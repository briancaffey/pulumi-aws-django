import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";
import { IamResources } from "../../internal/iam/ecs";
import { RedisEcsResources } from "../../internal/ecs/redis";
import { WebEcsService } from "../../internal/ecs/web";
import { ManagementCommandTask } from "../../internal/ecs/managementCommand";
import { WorkerEcsService } from "../../internal/ecs/celery";
import { registerAutoTags } from "../../../util";

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

    const accountId = process.env.AWS_ACCOUNT_ID;

    // ECR images
    // latest tags are only used for the initial deployment of the ad hoc application environment
    // TODO: lookup from ecr.getRepo / ecr.getImage?
    const backendImage = `${accountId}.dkr.ecr.us-east-1.amazonaws.com/backend`;
    const frontendImage = `${accountId}.dkr.ecr.us-east-1.amazonaws.com/frontend`;

    // ECS
    // https://www.pulumi.com/registry/packages/aws/api-docs/ecs/cluster/
    const cluster = new aws.ecs.Cluster("EcsCluster", {
      name: `${stackName}-cluster`
    });

    // https://www.pulumi.com/registry/packages/aws/api-docs/ecs/clustercapacityproviders/
    const clusterCapacityProviders = new aws.ecs.ClusterCapacityProviders("clusterCapacityProviders", {
      clusterName: cluster.name,
      capacityProviders: ["FARGATE_SPOT", "FARGATE"],
      defaultCapacityProviderStrategies: [{
          base: 1,
          weight: 100,
          capacityProvider: "FARGATE_SPOT",
      }],
    });

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

    const envVars = hosts.apply(([pgHost, baseStackName, domainName, assetsBucketName]) => [
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

    // IAM Roles
    const iamResources = new IamResources("IamResources", {});

    // Route 53 record
    const hostedZone = aws.route53.getZoneOutput({
      name: props.domainName.apply(x => x),
      privateZone: false
    });

    new aws.route53.Record("CnameRecord", {
      zoneId: hostedZone.id,
      name: pulumi.interpolate `alpha.${props.domainName}`,
      type: "CNAME",
      ttl: 60,
      records: [pulumi.interpolate `${props.albDnsName}`]
    });
    this.url = `alpha.${props.domainName}`;

    // Redis
    const redis = new RedisEcsResources("RedisEcsResources", {
      name: "redis",
      image: "redis:5.0.3-alpine",
      privateSubnets: props.privateSubnets,
      port: 6379,
      memory: "2048",
      cpu: "1024",
      logGroupName: `/ecs/${stackName}/redis`,
      logStreamPrefix: "redis",
      ecsClusterId: cluster.id,
      appSgId: props.appSgId,
      executionRoleArn: iamResources.taskExecutionRole.arn,
      taskRoleArn: iamResources.ecsTaskRole.arn,
      logRetentionInDays: 1,
      serviceDiscoveryNamespaceId: props.serviceDiscoveryNamespaceId,
      containerName: "redis"
    });

    // API
    const apiService = new WebEcsService("ApiWebService", {
      // defined locally
      name: "gunicorn",
      command: ["gunicorn", "-t", "1000", "-b", "0.0.0.0:8000", "--log-level", "info", "backend.wsgi"],
      envVars,
      logRetentionInDays: 1,
      port: 8000,
      cpu: "1024",
      memory: "2048",
      logGroupName: `/ecs/${stackName}/gunicorn`,
      logStreamPrefix: "gunicorn",
      // health check
      healthCheckPath: "/api/health-check/",
      // alb
      listenerArn: props.listenerArn,
      pathPatterns: ["/api/*", "/admin/*", "/graphql/*", "/mtv/*"],
      hostName,
      // from base stack
      appSgId: props.appSgId,
      privateSubnets: props.privateSubnets,
      vpcId: props.vpcId,
      // pulumi Inputs from this stack
      image: backendImage,
      ecsClusterId: cluster.id,
      executionRoleArn: iamResources.taskExecutionRole.arn,
      taskRoleArn: iamResources.ecsTaskRole.arn,
    });

    // Frontend Service
    // API
    const frontendService = new WebEcsService("FrontendWebService", {
      // defined locally
      name: "frontend",
      command: ["nginx", "-g", "daemon off;"],
      logRetentionInDays: 1,
      port: 80,
      memory: "2048",
      cpu: "1024",
      // logs
      logGroupName: `/ecs/${stackName}/frontend`,
      logStreamPrefix: "frontend",
      // health check
      healthCheckPath: "/",
      // alb
      listenerArn: props.listenerArn,
      pathPatterns: ["/*"],
      hostName,
      // base stack
      appSgId: props.appSgId,
      privateSubnets: props.privateSubnets,
      vpcId: props.vpcId,
      // pulumi Inputs from this stack
      image: frontendImage,
      ecsClusterId: cluster.id,
      executionRoleArn: iamResources.taskExecutionRole.arn,
      taskRoleArn: iamResources.ecsTaskRole.arn,
    }, {
      // this ensures that the priority of the listener rule for the api service is higher than the frontend service
      dependsOn: [apiService]
    });

    // Celery Default Worker
    const workerService = new WorkerEcsService("WorkerService", {
      // defined locally
      name: "default",
      command: ["celery", "--app=backend.celery_app:app", "worker", "--loglevel=INFO", "-Q", "default"],
      envVars,
      logRetentionInDays: 1,
      cpu: "1024",
      memory: "2048",
      logGroupName: `/ecs/${stackName}/celery-default-worker`,
      logStreamPrefix: "celery-default-worker",
      // from base stack
      appSgId: props.appSgId,
      privateSubnets: props.privateSubnets,
      // pulumi Inputs from this stack
      image: backendImage,
      ecsClusterId: cluster.id,
      executionRoleArn: iamResources.taskExecutionRole.arn,
      taskRoleArn: iamResources.ecsTaskRole.arn,
    });

    // TODO: add this
    // Celery beat

    // backend update task
    const backendUpdateTask = new ManagementCommandTask("BackendUpdateTask", {
      // defined locally
      name: "backendUpdate",
      command: ["python", "manage.py", "pre_update"],
      envVars,
      containerName: "backendUpdate",
      cpu: "1024",
      memory: "2048",
      logGroupName: `/ecs/${stackName}/backendUpdate`,
      logRetentionInDays: 1,
      logStreamPrefix: "backendUpdate",
      // from base stack
      appSgId: props.appSgId,
      privateSubnets: props.privateSubnets,
      // pulumi Inputs from this stack
      ecsClusterId: cluster.id,
      image: backendImage,
      executionRoleArn: iamResources.taskExecutionRole.arn,
      taskRoleArn: iamResources.ecsTaskRole.arn,
    });
    this.backendUpdateScript = backendUpdateTask.executionScript;
  }
}
