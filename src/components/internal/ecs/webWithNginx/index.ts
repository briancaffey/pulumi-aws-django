import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";
import { CwLoggingResources } from "../../cw";

interface WebEcsServiceWithNginxProps {
  name: string;
  command: pulumi.Input<string[]>,
  envVars?: pulumi.Output<{ "name": string, "value": string }[]>;
  logRetentionInDays?: number;
  port: number;
  cpu?: string;
  memory?: string;
  //health check
  healthCheckPath: string;
  healthCheckInterval?: number;
  healthCheckHealthyThreshold?: number;
  // alb
  listenerArn: pulumi.Output<string>;
  pathPatterns?: string[];
  hostName: pulumi.Output<string>;
  // from base stack
  appSgId: pulumi.Output<string>;
  privateSubnets: pulumi.Output<string[]>;
  vpcId: pulumi.Output<string>;
  // inputs from this stack
  image: string;
  ecsClusterId: pulumi.Output<string>;
  executionRoleArn: pulumi.Output<string>;
  taskRoleArn: pulumi.Output<string>;

  // nginx props
  nginxImage: string;
  nginxPort: number;
}

export class WebEcsServiceWithNginx extends pulumi.ComponentResource {
  private memory: string;
  private cpu: string;
  private logRetentionInDays: number;
  private healthCheckInterval: number;
  private healthCheckHealthyThreshold: number;
  private pathPatterns: string[];
  public readonly listenerRule: aws.alb.ListenerRule;
  public readonly serviceName: pulumi.Output<string>;

  /**
   * Creates a load balanced fargate service and associated CloudWatch resources
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to EcsBaseEnv component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: WebEcsServiceWithNginxProps, opts?: pulumi.ResourceOptions) {
    const stackName = pulumi.getStack();
    const region = aws.getRegionOutput();
    super(`pulumi-contrib:components:${props.name}WebEcsServiceWithNginx`, name, props, opts);

    // set defaults
    this.cpu = props.cpu ?? "256";
    this.memory = props.memory ?? "512";
    this.logRetentionInDays = props.logRetentionInDays ?? 1;
    this.healthCheckInterval = props.healthCheckInterval ?? 5;
    this.healthCheckHealthyThreshold = props.healthCheckHealthyThreshold ?? 2;
    this.pathPatterns = props.pathPatterns ?? ["/*"];

    const cwLoggingResources = new CwLoggingResources(`${props.name}CwLoggingResources`, {
      name: props.name,
      logRetentionInDays: this.logRetentionInDays
    }, { parent: this });

    const cwLoggingResourcesForNginx = new CwLoggingResources(`${props.name}CwLoggingResourcesNginx`, {
      name: `${props.name}-nginx`,
      logRetentionInDays: this.logRetentionInDays
    }, { parent: this });

    // aws ecs task definition
    const taskDefinition = new aws.ecs.TaskDefinition(`${props.name}TaskDefinition`, {
      containerDefinitions: pulumi.jsonStringify([
        {
          name: `${props.name}-nginx`,
          image: props.nginxImage,
          essential: true,
          logConfiguration: {
            logDriver: "awslogs",
            options: {
              "awslogs-group": cwLoggingResourcesForNginx.cwLogGroupName,
              "awslogs-region": region.name,
              "awslogs-stream-prefix": `${props.name}-nginx`
            }
          },
          portMappings: [
            {
              containerPort: props.nginxPort,
              hostPort: props.nginxPort,
              protocol: "tcp"
            }
          ],
        },
        {
          name: props.name,
          image: props.image,
          command: props.command,
          environment: props.envVars,
          essential: true,
          logConfiguration: {
            logDriver: "awslogs",
            options: {
              "awslogs-group": cwLoggingResources.cwLogGroupName,
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

    const targetGroup = new aws.alb.TargetGroup(`${props.name}TargetGroup`, {
      name: `${stackName}-${props.name}-tg`,
      port: props.nginxPort,
      protocol: "HTTPS",
      targetType: "ip",
      vpcId: props.vpcId,
      healthCheck: {
        timeout: 2,
        protocol: "HTTPS",
        port: "traffic-port",
        path: props.healthCheckPath,
        matcher: "200-399",
        interval: this.healthCheckInterval,
        unhealthyThreshold: 3,
        healthyThreshold: this.healthCheckHealthyThreshold,
      },
      tags: {
        Name: `${stackName}-${props.name}-tg`
      }
    }, { parent: this });

    const ecsService = new aws.ecs.Service(`${props.name}WebService`, {
      name: `${stackName}-${props.name}`,
      cluster: props.ecsClusterId,
      taskDefinition: taskDefinition.arn,
      desiredCount: 1,
      enableExecuteCommand: true,
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
        containerName: `${props.name}-nginx`,
        containerPort: props.nginxPort
      }],
      networkConfiguration: {
        assignPublicIp: false,
        securityGroups: [props.appSgId],
        subnets: props.privateSubnets
      }
    }, {
      parent: this,
      ignoreChanges: ['taskDefinition', 'desiredCount']
    });
    this.serviceName = ecsService.name;

    const listenerRule = new aws.alb.ListenerRule(`${props.name}ListenerRule`, {
      listenerArn: props.listenerArn,
      actions: [{
        type: "forward",
        targetGroupArn: targetGroup.arn
      }],
      conditions: [
        {
          pathPattern: {
            values: this.pathPatterns
          }
        },
        {
          hostHeader: {
            values: [props.hostName]
          }
        }
      ]
    }, { parent: this });
    this.listenerRule = listenerRule;
  }
}
