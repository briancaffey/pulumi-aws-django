import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";
import { Input } from "@pulumi/pulumi";

interface WebEcsServiceProps {
  // defined locally
  name: string;
  command: string[],
  envVars: { [key: string]: string };
  logRetentionInDays: number;
  port: number;
  cpu: string;
  memory: string;
  logGroupName: string;
  logStreamPrefix: string;
  //health check
  healthCheckPath: string;
  healthCheckInterval?: number;
  healthCheckHealthyThreshold?: number;
  // alb
  listenerArn: string;
  pathPatterns: string[];
  hostName: string;
  // from base stack
  appSgId: string;
  privateSubnets: string[];
  targetGroupArn: string;
  vpcId: string;
  // inputs from this stack
  image: Input<string>;
  ecsClusterId: Input<string>;
  executionRoleArn: Input<string>;
  taskRoleArn: Input<string>;
}

export class WebEcsService extends pulumi.ComponentResource {
  // public foo: aws.foo.bar;
  /**
   * Creates a new static website hosted on AWS.
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to AdHocBaseEnv component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: WebEcsServiceProps, opts?: pulumi.ResourceOptions) {
    const stackName = pulumi.getStack();
    const region = aws.getRegionOutput();
    super(`pulumi-contrib:components:${props.name}WebEcsService`, name, props, opts);

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

    // aws ecs service
    const ecsService = new aws.ecs.Service("WebService", {
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
      loadBalancers: [{
        targetGroupArn: props.targetGroupArn,
        containerName: props.name,
        containerPort: props.port
      }],
      networkConfiguration: {
        assignPublicIp: true,
        securityGroups: [props.appSgId],
        subnets: props.privateSubnets
      }
    }, {
      ignoreChanges: ['taskDefinition', 'desiredCount']
    });

    const targetGroup = new aws.alb.TargetGroup("TargetGroup", {
      port: props.port,
      protocol: "HTTP",
      targetType: "ip",
      vpcId: props.vpcId,
      healthCheck: {
        timeout: 5,
        protocol: "HTTP",
        port: "traffic-port",
        path: props.healthCheckPath,
        matcher: "200-399",
        interval: props.healthCheckInterval ?? 2,
        unhealthyThreshold: 3,
        healthyThreshold: props.healthCheckHealthyThreshold ?? 2,
      }
    });

    const listenerRule = new aws.alb.ListenerRule("ListenerRule", {
      listenerArn: props.listenerArn,
      actions: [{
        type: "forward",
        targetGroupArn: props.targetGroupArn
      }],
      conditions: [
        {
          pathPattern: {
            values: props.pathPatterns
          }
        },
        {
          hostHeader: {
            values: [props.hostName]
          }
        }
      ]
    })
  }
}
