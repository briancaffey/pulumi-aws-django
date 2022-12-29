import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";
import { IamResources } from "../../internal/iam/ecs";
// import { RedisEcsResources } from "../../internal/ecs/redis";
import { WebEcsService } from "../../internal/ecs/web";
// import { ManagementCommandTask } from "../../internal/ecs/managementCommand";
// import { WorkerEcsService } from "../../internal/ecs/celery";

/**
 * The inputs needed for setting up and ad hoc environment
 */
interface AdHocAppComponentProps {
  vpcId: pulumi.Output<string>;
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
 * Base resources for Ad Hoc environments.
 * Includes networking resources (VPC, SG, ALB, CloudMap), RDS and S3
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
    // const current = aws.getCallerIdentity({});
    const accountId = process.env.AWS_ACCOUNT_ID;

    // ECR images
    // latest tags are only used for the initial deployment of the ad hoc application environment
    const backendImage = `${accountId}.dkr.ecr.us-east-1.amazonaws.com/backend`;
    // const frontendImage = `${accountId}.dkr.ecr.us-east-1.amazonaws.com/frontend`;

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
    // const bucketName = props.domainName as pulumi.Output<string>;
    // const s3Bucket = new aws.s3.Bucket("AssetsBucket", {
    //   forceDestroy: true,
    //   bucket: `${bucketName.apply(x => x.replace(".", "-"))}-${props.baseStackName}-bucket`
    // });
    // // TODO: this seems like a weird workaround (`as unknown as string`)
    // const s3BucketName = s3Bucket.bucket as unknown as string;

    // redis service host

    // postgres service host

    // postgres name

    // django settings module

    // domain name

    // frontend url

    // env vars to use in backend container
    const envVars: { [key: string]: pulumi.Output<string> | string }[] = [
      {
        name: "S3_BUCKET_NAME",
        value: "replace-with-bucket-name",
      },
      {
        name: "REDIS_SERVICE_HOST",
        value: pulumi.interpolate `${stackName}-redis.${props.baseStackName}-sd-ns`
      },
      {
        name: "POSTGRES_SERVICE_HOST",
        value: pulumi.interpolate `${props.rdsAddress}`,
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
        value: pulumi.interpolate `${props.domainName}`
      },
      {
        name: "FRONTEND_URL",
        value: pulumi.interpolate `https://${stackName}.${props.domainName}`,
      },
      {
        name: "DB_SECRET_NAME",
        value: "DB_SECRET_NAME",
      }
    ];

    // TODO: we could also define env vars this way and then transform to the name/value format using Object.entries
    // const envVars: pulumi.Input<{ [key: string]: pulumi.Output<string> | string }> = {
    //   S3_BUCKET_NAME: "replace-with-bucket-name",
    //   REDIS_SERVICE_HOST: `${stackName}-redis.${props.baseStackName}-sd-ns`,
    //   POSTGRES_SERVICE_HOST: `${props.rdsAddress}`,
    //   POSTGRES_NAME: `${stackName}-db`,
    //   DJANGO_SETTINGS_MODULE: "backend.settings.production",
    //   DOMAIN_NAME: `${props.domainName}`,
    //   FRONTEND_URL: `https://${stackName}.${props.domainName}`,
    //   DB_SECRET_NAME: "DB_SECRET_NAME"
    // }

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
    // const redis = new RedisEcsResources("RedisEcsResources", {
    //   name: "redis",
    //   image: "redis:5.0.3-alpine",
    //   privateSubnets: props.privateSubnets,
    //   port: 6379,
    //   memory: "2048",
    //   cpu: "1024",
    //   logGroupName: `/ecs/${stackName}/redis`,
    //   logStreamPrefix: "redis",
    //   ecsClusterId: cluster.id,
    //   appSgId: props.appSgId,
    //   // not able to process Output<string> as string here
    //   // role ARNs are wrapped with Input, Input<string> on the interface
    //   // https://stackoverflow.com/a/62562828/6084948
    //   executionRoleArn: iamResources.taskExecutionRole.arn,
    //   taskRoleArn: iamResources.ecsTaskRole.arn,
    //   logRetentionInDays: 1,
    //   serviceDiscoveryNamespaceId: props.serviceDiscoveryNamespaceId,
    //   containerName: "redis"
    // });

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
    // const frontendService = new WebEcsService("FrontendWebService", {
    //   // defined locally
    //   name: "frontend",
    //   command: ["nginx", "-g", "daemon off;"],
    //   logRetentionInDays: 1,
    //   port: 80,
    //   memory: "2048",
    //   cpu: "1024",
    //   // logs
    //   logGroupName: `/ecs/${stackName}/frontend`,
    //   logStreamPrefix: "frontend",
    //   // health check
    //   healthCheckPath: "/",
    //   // alb
    //   listenerArn: props.listenerArn,
    //   pathPatterns: ["/*"],
    //   hostName,
    //   // base stack
    //   appSgId: props.appSgId,
    //   privateSubnets: props.privateSubnets,
    //   vpcId: props.vpcId,
    //   // pulumi Inputs from this stack
    //   image: frontendImage,
    //   ecsClusterId: cluster.id,
    //   executionRoleArn: iamResources.taskExecutionRole.arn,
    //   taskRoleArn: iamResources.ecsTaskRole.arn,
    // }, {
    //   // this ensures that the priority of the listener rule for the api service is higher than the frontend service
    //   dependsOn: [apiService.listenerRule]
    // });

    // Celery Default Worker
    // const workerService = new WorkerEcsService("WorkerService", {
    //   // defined locally
    //   name: "default",
    //   command: ["celery", "--app=backend.celery_app:app", "worker", "--loglevel=INFO", "-Q", "default"],
    //   envVars,
    //   logRetentionInDays: 1,
    //   cpu: "1024",
    //   memory: "2048",
    //   logGroupName: `/ecs/${stackName}/celery-default-worker`,
    //   logStreamPrefix: "celery-default-worker",
    //   // from base stack
    //   appSgId: props.appSgId,
    //   privateSubnets: props.privateSubnets,
    //   // pulumi Inputs from this stack
    //   image: backendImage,
    //   ecsClusterId: cluster.id,
    //   executionRoleArn: iamResources.taskExecutionRole.arn,
    //   taskRoleArn: iamResources.ecsTaskRole.arn,
    // });

    // TODO: add this
    // Celery beat

    // backend update task
    // const backendUpdateTask = new ManagementCommandTask("BackendUpdateTask", {
    //   name: "backendUpdate",
    //   command: ["python", "manage.py", "pre_update"],
    //   appSgId: props.appSgId,
    //   containerName: "backendUpdate",
    //   cpu: "1024",
    //   memory: "2048",
    //   ecsClusterId: cluster.id,
    //   image: backendImage,
    //   executionRoleArn: iamResources.taskExecutionRole.arn,
    //   taskRoleArn: iamResources.ecsTaskRole.arn,
    //   envVars,
    //   logGroupName: `/ecs/${stackName}/backendUpdate`,
    //   logRetentionInDays: 1,
    //   logStreamPrefix: "backendUpdate",
    //   privateSubnets: props.privateSubnets,
    // });
    // this.backendUpdateScript = backendUpdateTask.executionScript;
  }
}
