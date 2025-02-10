import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";
import { IamResources } from "../../internal/iam/ecs";
import { WebEcsService } from "../../internal/ecs/web";
import { ManagementCommandTask } from "../../internal/ecs/managementCommand";
import { WorkerEcsService } from "../../internal/ecs/celery";
import { registerAutoTags } from "../../../util";
import { EcsClusterResources } from "../../internal/ecs/cluster";
import { SchedulerEcsService } from "../../internal/ecs/scheduler";
import { AutoScalingResources } from "../../internal/autoscaling";

// automatically tag all resources
registerAutoTags({
  "env": pulumi.getStack(),
});

/**
 * The inputs needed for setting up a prod app environment
 */
interface ProdAppComponentProps {
  vpcId: pulumi.Output<string>;
  assetsBucketName: pulumi.Output<string>;
  privateSubnets: pulumi.Output<string[]>;
  appSgId: pulumi.Output<string>;
  albSgId: pulumi.Output<string>;
  listenerArn: pulumi.Output<string>;
  albDnsName: pulumi.Output<string>;
  rdsAddress: pulumi.Output<string>;
  domainName: pulumi.Output<string>;
  baseStackName: pulumi.Output<string>;
  elastiCacheAddress: pulumi.Output<string>;
}

/**
 * Resource for prod app environment
 * Includes ECS Resources (Redis, API, Frontend, Celery, Beat, ECS Tasks, Route53 Records)
 */
export class ProdAppComponent extends pulumi.ComponentResource {
  public readonly url: string;
  private readonly clusterId: pulumi.Output<string>;

  /**
   * Creates resources for prod application environments
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to ProdBaseEnv component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: ProdAppComponentProps, opts?: pulumi.ResourceOptions) {
    super("pulumi-contrib:components:ProdApp", name, props, opts);

    const stackName = pulumi.getStack();
    const hostName = props.domainName.apply(x => `${stackName}.${x}`)
    this.url = `https://${hostName}`;

    interface EnvVar {
      name: string;
      value: string;
    }

    let config = new pulumi.Config();
    let extraEnvVars = config.getObject<EnvVar[]>("extraEnvVars");

    const accountId = process.env.AWS_ACCOUNT_ID;

    // ECR images
    // latest tags are only used for the initial deployment of the prod application environment
    // TODO: lookup from ecr.getRepo / ecr.getImage?
    const backendImage = `${accountId}.dkr.ecr.us-east-1.amazonaws.com/backend`;
    const frontendImage = `${accountId}.dkr.ecr.us-east-1.amazonaws.com/frontend`;

    // ECS Cluster and Cluster Capacity Providers
    const ecsClusterResources = new EcsClusterResources("EcsClusterResources", {}, { parent: this });
    this.clusterId = ecsClusterResources.clusterId;

    // env vars to use in backend container
    // https://github.com/pulumi/examples/blob/master/aws-ts-airflow/index.ts#L61
    // https://gist.github.com/AaronFriel/fa4d88781f339c2c26791a08b9c50c0e
    const hosts = pulumi.all([
      props.rdsAddress,
      props.elastiCacheAddress,
      props.baseStackName,
      props.domainName,
      props.assetsBucketName
    ]);

    let envVars = hosts.apply(([pgHost, elastiCacheAddress, baseStackName, domainName, assetsBucketName]) => [
      {
        name: "S3_BUCKET_NAME",
        value: assetsBucketName,
      },
      {
        name: "REDIS_SERVICE_HOST",
        value: elastiCacheAddress,
      },
      {
        name: "POSTGRES_SERVICE_HOST",
        value: pgHost,
      },
      {
        name: "POSTGRES_NAME",
        value: stackName
      },
      {
        name: "DJANGO_SETTINGS_MODULE",
        value: 'backend.settings.production'
      },
      {
        name: "DOMAIN_NAME",
        value: domainName
      },
      {
        name: "FRONTEND_URL",
        value: `https://${stackName}.${domainName}`,
      },
      {
        name: "DB_SECRET_NAME",
        value: "DB_SECRET_NAME",
      },
      {
        name: "BASE_STACK_NAME",
        value: baseStackName
      }
    ]);

    if (extraEnvVars) {
      envVars = envVars.apply(x => x.concat(extraEnvVars!))
    }

    const iamResources = new IamResources("IamResources", {}, { parent: this });

    const hostedZone = aws.route53.getZoneOutput({
      name: props.domainName.apply(x => x),
      privateZone: false
    });

    const route53CnameRecord = new aws.route53.Record("CnameRecord", {
      zoneId: hostedZone.id,
      name: pulumi.interpolate `${stackName}.${props.domainName}`,
      type: "CNAME",
      ttl: 60,
      records: [pulumi.interpolate `${props.albDnsName}`]
    }, { parent: this });

    const apiService = new WebEcsService("ApiWebService", {
      name: "gunicorn",
      command: ["gunicorn", "-t", "1000", "-b", "0.0.0.0:8000", "--log-level", "info", "backend.wsgi"],
      envVars,
      port: 8000,
      healthCheckPath: "/api/health-check/",
      listenerArn: props.listenerArn,
      pathPatterns: ["/api/*", "/admin/*", "/graphql/*", "/mtv/*"],
      hostName,
      appSgId: props.appSgId,
      privateSubnets: props.privateSubnets,
      vpcId: props.vpcId,
      image: backendImage,
      ecsClusterId: this.clusterId,
      executionRoleArn: iamResources.taskExecutionRole.arn,
      taskRoleArn: iamResources.ecsTaskRole.arn,
    }, { parent: this });

    new AutoScalingResources("ApiAutoScaling", {
      clusterName: ecsClusterResources.clusterName,
      serviceName: apiService.serviceName
    }, { parent: apiService})

    const frontendService = new WebEcsService("FrontendWebService", {
      name: "frontend",
      command: ["nginx", "-g", "daemon off;"],
      port: 80,
      healthCheckPath: "/",
      listenerArn: props.listenerArn,
      pathPatterns: ["/*"],
      hostName,
      appSgId: props.appSgId,
      privateSubnets: props.privateSubnets,
      vpcId: props.vpcId,
      image: frontendImage,
      ecsClusterId: this.clusterId,
      executionRoleArn: iamResources.taskExecutionRole.arn,
      taskRoleArn: iamResources.ecsTaskRole.arn,
    }, {
      // this ensures that the priority of the listener rule for the api service is higher than the frontend service
      parent: this,
      dependsOn: [apiService]
    });

    const workerService = new WorkerEcsService("WorkerService", {
      name: "default",
      command: ["celery", "--app=backend.celery_app:app", "worker", "--loglevel=INFO", "-Q", "default"],
      envVars,
      appSgId: props.appSgId,
      privateSubnetIds: props.privateSubnets,
      image: backendImage,
      ecsClusterId: this.clusterId,
      executionRoleArn: iamResources.taskExecutionRole.arn,
      taskRoleArn: iamResources.ecsTaskRole.arn,
    }, { parent: this });

    new AutoScalingResources("WorkerAutoScaling", {
      clusterName: ecsClusterResources.clusterName,
      serviceName: workerService.serviceName
    }, { parent: workerService})

    const schedulerService = new SchedulerEcsService("SchedulerService", {
      name: "beat",
      command: ["celery", "--app=backend.celery_app:app", "beat", "--loglevel=INFO"],
      envVars,
      appSgId: props.appSgId,
      privateSubnetIds: props.privateSubnets,
      image: backendImage,
      ecsClusterId: this.clusterId,
      executionRoleArn: iamResources.taskExecutionRole.arn,
      taskRoleArn: iamResources.ecsTaskRole.arn,
    }, { parent: this });

    const backendUpdateTask = new ManagementCommandTask("BackendUpdateTask", {
      name: "backendUpdate",
      command: ["python", "manage.py", "pre_update"],
      envVars,
      appSgId: props.appSgId,
      privateSubnetIds: props.privateSubnets,
      ecsClusterId: this.clusterId,
      image: backendImage,
      executionRoleArn: iamResources.taskExecutionRole.arn,
      taskRoleArn: iamResources.ecsTaskRole.arn,
    }, { parent: this });
  }
}
