import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";
import { IamResources } from "../../internal/iam/ecs";
import { RedisEcsResources } from "../../internal/ecs/redis";
import { WebEcsService } from "../../internal/ecs/web";
import { WebEcsServiceWithNginx } from "../../internal/ecs/webWithNginx";
import { ManagementCommandTask } from "../../internal/ecs/managementCommand";
import { WorkerEcsService } from "../../internal/ecs/celery";
import { registerAutoTags } from "../../../util";
import { EcsClusterResources } from "../../internal/ecs/cluster";
import { SchedulerEcsService } from "../../internal/ecs/scheduler";

// automatically tag all resources
registerAutoTags({
  "env": pulumi.getStack(),
});

/**
 * The inputs needed for setting up and ad hoc environment
 */
interface AdHocAppComponentProps {
  vpcId: pulumi.Output<string>;
  assetsBucketName: pulumi.Output<string>;
  privateSubnets: pulumi.Output<string[]>;
  appSgId: pulumi.Output<string>;
  albSgId: pulumi.Output<string>;
  listenerArn: pulumi.Output<string>;
  albDnsName: pulumi.Output<string>;
  serviceDiscoveryNamespaceId: pulumi.Output<string>;
  rdsAddress: pulumi.Output<string>;
  domainName: pulumi.Output<string>;
  baseStackName: pulumi.Output<string>;
}

/**
 * Resource for ad hoc app environment
 * Includes ECS Resources (Redis, API, Frontend, Celery, Beat, ECS Tasks, Route53 Records)
 */
export class AdHocAppComponent extends pulumi.ComponentResource {
  public readonly url: string;
  public readonly backendUpdateScript?: pulumi.Output<string>;
  private readonly clusterId: pulumi.Output<string>;

  /**
   * Creates resources for ad hoc application environments
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to AdHocBaseEnv component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: AdHocAppComponentProps, opts?: pulumi.ResourceOptions) {
    super("pulumi-contrib:components:AdHocApp", name, props, opts);

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
    // latest tags are only used for the initial deployment of the ad hoc application environment
    // TODO: lookup from ecr.getRepo / ecr.getImage?
    const backendImage = `${accountId}.dkr.ecr.us-east-1.amazonaws.com/backend`;
    const frontendImage = `${accountId}.dkr.ecr.us-east-1.amazonaws.com/frontend`;
    const nginxImage = `${accountId}.dkr.ecr.us-east-1.amazonaws.com/backend-nginx`;

    // ECS Cluster and Cluster Capacity Providers
    const ecsClusterResources = new EcsClusterResources("EcsClusterResources", {
      useSpot: true // default to using spot for ad hoc environments
    }, { parent: this });
    this.clusterId = ecsClusterResources.clusterId;

    // S3
    // TODO: add optional per-ad hoc environment S3 bucket to use instead of shared S3 bucket from base stack

    // env vars to use in backend container
    // https://github.com/pulumi/examples/blob/master/aws-ts-airflow/index.ts#L61
    // https://gist.github.com/AaronFriel/fa4d88781f339c2c26791a08b9c50c0e
    const hosts = pulumi.all([
      props.rdsAddress,
      props.baseStackName,
      props.domainName,
      props.assetsBucketName
    ]);

    let envVars = hosts.apply(([pgHost, baseStackName, domainName, assetsBucketName]) => [
      {
        name: "S3_BUCKET_NAME",
        value: assetsBucketName,
      },
      {
        name: "REDIS_SERVICE_HOST",
        value: `${stackName}-redis.${baseStackName}-sd-ns`
      },
      {
        name: "POSTGRES_SERVICE_HOST",
        value: pgHost,
      },
      {
        name: "POSTGRES_NAME",
        value: `${stackName}-db`
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

    const redis = new RedisEcsResources("RedisEcsResources", {
      name: "redis",
      image: "redis:5.0.3-alpine",
      privateSubnetIds: props.privateSubnets,
      port: 6379,
      ecsClusterId: this.clusterId,
      appSgId: props.appSgId,
      executionRoleArn: iamResources.taskExecutionRole.arn,
      taskRoleArn: iamResources.ecsTaskRole.arn,
      serviceDiscoveryNamespaceId: props.serviceDiscoveryNamespaceId,
    }, { parent: this });

    const apiService = new WebEcsServiceWithNginx("ApiWebService", {
      nginxImage: nginxImage,
      nginxPort: 443,
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

    const frontendService = new WebEcsService("FrontendWebService", {
      // defined locally
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
      cpu: "1024",
      memory: "2048",
      appSgId: props.appSgId,
      privateSubnetIds: props.privateSubnets,
      ecsClusterId: this.clusterId,
      image: backendImage,
      executionRoleArn: iamResources.taskExecutionRole.arn,
      taskRoleArn: iamResources.ecsTaskRole.arn,
    }, { parent: this });
    this.backendUpdateScript = backendUpdateTask.executionScript;
  }
}
