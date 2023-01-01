import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";
import { Input } from "@pulumi/pulumi";

interface RedisEcsResourcesProps {
  name: string;
  image: string;
  port: number;
  cpu?: string;
  memory?: string;
  logRetentionInDays?: number;
  privateSubnetIds: Input<string[]>;
  ecsClusterId: Input<string>;
  executionRoleArn: Input<string>;
  taskRoleArn: Input<string>;
  appSgId: Input<string>;
  serviceDiscoveryNamespaceId: Input<string>;
}

export class RedisEcsResources extends pulumi.ComponentResource {
  private memory: string;
  private cpu: string;
  private logRetentionInDays: number;
  /**
   * Creates a redis service in an ECS cluster
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to AdHocBaseEnv component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: RedisEcsResourcesProps, opts?: pulumi.ResourceOptions) {
    const stackName = pulumi.getStack();
    const region = aws.getRegionOutput();
    super("pulumi-contrib:components:RedisEcsResources", name, props, opts);

    // set defaults
    this.cpu = props.cpu ?? "256";
    this.memory = props.memory ?? "512";
    this.logRetentionInDays = props.logRetentionInDays ?? 1;

    // aws cloudwatch log group
    const cwLogGroup = new aws.cloudwatch.LogGroup(`${props.name}logGroup`, {
      name: `/ecs/${stackName}/${props.name}`,
      retentionInDays: this.logRetentionInDays
    }, { parent: this });

    // aws cloudwatch log stream
    const cwLogStream = new aws.cloudwatch.LogStream(`${props.name}LogStream`, {
      logGroupName: cwLogGroup.name,
      name: props.name
    }, { parent: this });

    // aws ecs task definition
    const taskDefinition = new aws.ecs.TaskDefinition(`${props.name}TaskDefinition`, {
      containerDefinitions: pulumi.jsonStringify([
        {
          name: props.name,
          image: props.image,
          essential: true,
          logConfiguration: {
            logDriver: "awslogs",
            options: {
              "awslogs-group": cwLogGroup.name,
              "awslogs-region": region.name,
              "awslogs-stream-prefix": props.name
            }
          },
          portMappings: [
            {
              containerPort: props.port,
              hostPort: props.port,
              protocol: "tcp"
            }
          ],
        }
      ]),
      taskRoleArn: props.taskRoleArn,
      executionRoleArn: props.executionRoleArn,
      family: `${stackName}-${props.name}`,
      networkMode: "awsvpc",
      requiresCompatibilities: ["FARGATE"],
      cpu: this.cpu,
      memory: this.memory,
    }, { parent: this });

    // aws service discovery service
    // this is only needed for redis in ad hoc environments
    const serviceDiscoveryService = new aws.servicediscovery.Service("ServiceDiscoveryService", {
      name: `${stackName}-redis`,
      dnsConfig: {
        namespaceId: props.serviceDiscoveryNamespaceId,
        dnsRecords: [{
          ttl: 10,
          type: "A"
        }],
        routingPolicy: "MULTIVALUE"
      },
      healthCheckCustomConfig: {
        failureThreshold: 1
      }
    }, { parent: this });

    // aws ecs service
    const ecsService = new aws.ecs.Service("RedisService", {
      name: `${stackName}-${props.name}`,
      cluster: props.ecsClusterId,
      taskDefinition: taskDefinition.arn,
      desiredCount: 1,
      capacityProviderStrategies: [
        {
          capacityProvider: "FARGATE_SPOT",
          weight: 100,
        },
        {
          capacityProvider: "FARGATE",
          weight: 0,
        },
      ],
      serviceRegistries: {
        registryArn: serviceDiscoveryService.arn,
      },
      networkConfiguration: {
        assignPublicIp: true,
        securityGroups: [props.appSgId],
        subnets: props.privateSubnetIds
      }
    }, { parent: this });
  }
}
