import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";
import { Input } from "@pulumi/pulumi";

interface RedisEcsResourcesProps {
  name: string;
  image: string;
  privateSubnets: string[];
  port: number;
  cpu: string;
  memory: string;
  logGroupName: string;
  logStreamPrefix: string;
  logRetentionInDays: number;
  containerName: string;
  // https://stackoverflow.com/a/62562828/6084948
  ecsClusterId: Input<string>;
  executionRoleArn: Input<string>;
  taskRoleArn: Input<string>;
  appSgId: string;
  serviceDiscoveryNamespaceId: string;
}

export class RedisEcsResources extends pulumi.ComponentResource {
  // public foo: aws.foo.bar;
  /**
   * Creates a new static website hosted on AWS.
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to AdHocBaseEnv component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: RedisEcsResourcesProps, opts?: pulumi.ResourceOptions) {
    const stackName = pulumi.getStack();
    const region = aws.getRegionOutput();
    super("pulumi-contrib:components:RedisEcsResources", name, props, opts);

    // aws cloudwatch log group
    const cwLogGroup = new aws.cloudwatch.LogGroup("logGroup", {
      name: props.logGroupName,
      retentionInDays: props.logRetentionInDays
    });

    // aws cloudwatch log stream
    const cwLogStream = new aws.cloudwatch.LogStream("logStream", {
      logGroupName: cwLogGroup.name,
      name: props.logStreamPrefix
    });

    // aws ecs task definition
    const taskDefinition = new aws.ecs.TaskDefinition("taskDefinition", {
      containerDefinitions: JSON.stringify([
        {
          name: props.name,
          image: props.image,
          essential: true,
          logConfiguration: {
            logDriver: "awslogs",
            options: {
              "awslogs-group": props.logGroupName,
              "awslogs-region": region.name,
              "awslogs-stream-prefix": props.logStreamPrefix
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
      cpu: props.cpu,
      memory: props.memory,
    });

    // aws service discovery service
    // this is only needed for redis in ad hoc environments
    const serviceDiscoveryService = new aws.servicediscovery.Service("ServiceDiscoveryService", {
      name: `${stackName}-redis`,
      dnsConfig: {
        namespaceId: props.serviceDiscoveryNamespaceId,
        dnsRecords: [{
          ttl: 10,
          type: "A"
        }]
      },
      healthCheckCustomConfig: {
        failureThreshold: 1
      }
    });

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
        subnets: props.privateSubnets
      }
    })
  }
}
