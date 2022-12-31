import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";
import { Input, Output } from "@pulumi/pulumi";

interface WebEcsServiceProps {
  // defined locally
  name: string;
  command: Input<string[]>,
  // envVars?: pulumi.Input<{ "name": string, "value": pulumi.Output<string> | string }[]>;
  envVars?: pulumi.Output<{ "name": string, "value": string }[]>;
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
  listenerArn: Input<string>;
  pathPatterns: string[];
  hostName: pulumi.Output<string>;
  // from base stack
  appSgId: Input<string>;
  privateSubnets: pulumi.Input<string[]>;
  vpcId: pulumi.Input<string>;
  // inputs from this stack
  image: string;
  ecsClusterId: Input<string>;
  executionRoleArn: Input<string>;
  taskRoleArn: Input<string>;
}

export class WebEcsService extends pulumi.ComponentResource {
  // public foo: aws.foo.bar;
  public readonly listenerRule: aws.alb.ListenerRule;
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
    const cwLogGroup = new aws.cloudwatch.LogGroup(`${props.name}LogGroup`, {
      name: props.logGroupName,
      retentionInDays: props.logRetentionInDays
    });

    // aws cloudwatch log stream
    const cwLogStream = new aws.cloudwatch.LogStream(`${props.name}LogStream`, {
      logGroupName: cwLogGroup.name,
      name: props.logStreamPrefix
    });

    // aws ecs task definition
    const taskDefinition = new aws.ecs.TaskDefinition(`${props.name}TaskDefinition`, {
      containerDefinitions: pulumi.jsonStringify([
        {
          name: props.name,
          image: props.image,
          command: props.command,
          environment: props.envVars,
          essential: true,
          logConfiguration: {
            logDriver: "awslogs",
            options: {
              "awslogs-group": props.logGroupName,
              "awslogs-region": "us-east-1",
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

    const targetGroup = new aws.alb.TargetGroup(`${props.name}TargetGroup`, {
      port: props.port,
      protocol: "HTTP",
      targetType: "ip",
      vpcId: props.vpcId,
      healthCheck: {
        timeout: 2,
        protocol: "HTTP",
        port: "traffic-port",
        path: props.healthCheckPath,
        matcher: "200-399",
        interval: props.healthCheckInterval ?? 5,
        unhealthyThreshold: 3,
        healthyThreshold: props.healthCheckHealthyThreshold ?? 2,
      },
      tags: {
        Name: `${stackName}-${props.name}-tg`
      }
    }, { parent: this });

    // aws ecs service
    const ecsService = new aws.ecs.Service(`${props.name}WebService`, {
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
        targetGroupArn: targetGroup.arn,
        containerName: props.name,
        containerPort: props.port
      }],
      networkConfiguration: {
        assignPublicIp: true,
        securityGroups: [props.appSgId],
        subnets: props.privateSubnets
      }
    }, {
      parent: this,
      ignoreChanges: ['taskDefinition', 'desiredCount'],
      dependsOn: [targetGroup]
    });

    const listenerRule = new aws.alb.ListenerRule(`${props.name}ListenerRule`, {
      listenerArn: props.listenerArn,
      actions: [{
        type: "forward",
        targetGroupArn: targetGroup.arn
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
    }, { parent: this});
    this.listenerRule = listenerRule;
  }
}
