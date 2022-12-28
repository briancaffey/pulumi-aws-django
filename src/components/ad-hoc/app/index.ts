import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";
import { IamResources } from "../../internal/iam/ecs";
import { RedisEcsResources } from "../../internal/ecs/redis";
import { WebEcsService } from "../../internal/ecs/web";
import { ManagementCommandTask } from "../../internal/ecs/managementCommand";
import { WorkerEcsService } from "../../internal/ecs/celery";

/**
 * The inputs needed for setting up and ad hoc environment
 */
interface AdHocAppComponentProps {
  vpcId: string;
  privateSubnets: string[];
  publicSubnets: string[];
  appSgId: string;
  albSgId: string;
  listenerArn: string;
  albDefaultTgArn: string;
  albDnsName: string;
  serviceDiscoveryNamespaceId: string;
  rdsAddress: string;
  domainName: string;
  baseStackName: string;
}

/**
 * Base resources for Ad Hoc environments.
 * Includes networking resources (VPC, SG, ALB, CloudMap), RDS and S3
 */
export class AdHocAppComponent extends pulumi.ComponentResource {
  public url: string;

  /**
   * Creates resources for ad hoc application environments
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to AdHocBaseEnv component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: AdHocAppComponentProps, opts?: pulumi.ResourceOptions) {
    super("pulumi-contrib:components:AdHocApp", name, props, opts);

    const stackName = pulumi.getStack();
    const hostName = `${stackName}.${props.domainName}`

    // ECR
    const backendRepo = aws.ecr.getRepositoryOutput({name: "backend"});
    const backendImage = aws.ecr.getImageOutput({repositoryName: backendRepo.name, imageTag: 'latest'});

    const frontendRepo = aws.ecr.getRepositoryOutput({name: "frontend"});
    const frontendImage = aws.ecr.getImageOutput({repositoryName: frontendRepo.name, imageTag: 'latest'});

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

    // s3
    const s3Bucket = new aws.s3.Bucket("AssetsBucket", {
      forceDestroy: true,
      bucket: `${props.domainName.replace(".", "-")}-${props.baseStackName}-bucket`
    });
    // TODO: this seems like a weird workaround (`as unknown as string`)
    const s3BucketName = s3Bucket.bucket as unknown as string;

    // env vars to use in backend container
    const envVars : { [key: string]: string } = {
      S3_BUCKET_NAME: s3BucketName,
      REDIS_SERVICE_HOST: `${stackName}-redis.${props.baseStackName}-sd-ns`,
      POSTGRES_SERVICE_HOST: props.rdsAddress,
      POSTGRES_NAME: `${stackName}-db`,
      // get this from pulumi config file Pulumi.alpha.yaml
      DJANGO_SETTINGS_MODULE: 'backend.settings.production',
      DOMAIN_NAME: props.domainName,
      FRONTEND_URL: `https://${stackName}.${props.domainName}`,
      DB_SECRET_NAME: 'DB_SECRET_NAME',
    };

    // IAM Roles
    const iamResources = new IamResources("IamResources", {});

    // Route 53 record
    const hostedZone = aws.route53.getZoneOutput({
      name: props.domainName,
      privateZone: false
    });

    new aws.route53.Record("CnameRecord", {
      zoneId: hostedZone.id,
      name: `${stackName}.${props.domainName}`,
      type: "CNAME",
      ttl: 60,
      records: [props.albDnsName]
    });
    this.url = `${stackName}.${props.domainName}`;

    // Redis
    const redis = new RedisEcsResources("RedisEcsResources", {
      name: "redis",
      image: "redis:5.0.3-alpine",
      privateSubnets: props.privateSubnets,
      port: 6379,
      memory: "2048",
      cpu: "1024",
      logGroupName: `ecs/${stackName}/redis`,
      logStreamPrefix: "redis",
      ecsClusterId: cluster.id,
      appSgId: props.appSgId,
      // not able to process Output<string> as string here
      // role ARNs are wrapped with Input, Input<string> on the interface
      // https://stackoverflow.com/a/62562828/6084948
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
      logGroupName: `ecs/${stackName}/gunicorn`,
      logStreamPrefix: "gunicorn",
      // health check
      healthCheckPath: "/api/health-check/",
      // alb
      listenerArn: props.listenerArn,
      pathPatterns: ["/api/*", "/admin/*", "/graphql/*", "/mtv/"],
      hostName,
      // from base stack
      appSgId: props.appSgId,
      privateSubnets: props.privateSubnets,
      targetGroupArn: props.albDefaultTgArn,
      vpcId: props.vpcId,
      // pulumi Inputs from this stack
      image: backendImage.id,
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
      envVars: {},
      logRetentionInDays: 1,
      port: 80,
      memory: "2048",
      cpu: "1024",
      // logs
      logGroupName: `ecs/${stackName}/frontend`,
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
      targetGroupArn: props.albDefaultTgArn,
      vpcId: props.vpcId,
      // pulumi Inputs from this stack
      image: frontendImage.id,
      ecsClusterId: cluster.id,
      executionRoleArn: iamResources.taskExecutionRole.arn,
      taskRoleArn: iamResources.ecsTaskRole.arn,
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
      logGroupName: `ecs/${stackName}/celery-default-worker`,
      logStreamPrefix: "celery-default-worker",
      // from base stack
      appSgId: props.appSgId,
      privateSubnets: props.privateSubnets,
      // pulumi Inputs from this stack
      image: backendImage.id,
      ecsClusterId: cluster.id,
      executionRoleArn: iamResources.taskExecutionRole.arn,
      taskRoleArn: iamResources.ecsTaskRole.arn,
    });

    // Celery beat

    // backend update task
    const backendUpdateTask = new ManagementCommandTask("BackendUpdateTask", {
      name: "backendUpdate",
      command: ["python", "manage.py", "pre_update"],
      appSgId: props.appSgId,
      containerName: "backendUpdate",
      cpu: "1024",
      memory: "2048",
      ecsClusterId: cluster.id,
      image: backendImage.id,
      executionRoleArn: iamResources.taskExecutionRole.arn,
      taskRoleArn: iamResources.ecsTaskRole.arn,
      envVars,
      logGroupName: `/ecs/${stackName}/backendUpdate`,
      logRetentionInDays: 1,
      logStreamPrefix: "backendUpdate",
      privateSubnets: props.privateSubnets,
    })
  }
}
