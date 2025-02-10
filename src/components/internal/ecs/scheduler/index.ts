import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";
import { CwLoggingResources } from "../../cw";

interface SchedulerEcsServiceProps {
  name: string;
  command: pulumi.Input<string[]>,
  envVars: pulumi.Output<{ "name": string, "value": string }[]>;
  logRetentionInDays?: number;
  cpu?: string;
  memory?: string;
  // from base stack
  appSgId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string[]>;
  // inputs from this stack
  image: string;
  ecsClusterId: pulumi.Output<string>;
  executionRoleArn: pulumi.Output<string>;
  taskRoleArn: pulumi.Output<string>;
}

export class SchedulerEcsService extends pulumi.ComponentResource {
  private memory: string;
  private cpu: string;
  private logRetentionInDays: number;

  /**
   * Creates a new async worker service or scheduling daemon service (e.g. celery, celery beat)
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to EcsBaseEnv component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: SchedulerEcsServiceProps, opts?: pulumi.ResourceOptions) {
    const stackName = pulumi.getStack();
    const region = aws.getRegionOutput();
    super(`pulumi-contrib:components:${props.name}WorkerEcsService`, name, props, opts);

    this.cpu = props.cpu ?? "256";
    this.memory = props.memory ?? "512";
    this.logRetentionInDays = props.logRetentionInDays ?? 1;

    const cwLoggingResources = new CwLoggingResources(`${props.name}CwLoggingResources`, {
      name: props.name,
      logRetentionInDays: this.logRetentionInDays
    }, { parent: this });

    const taskDefinition = new aws.ecs.TaskDefinition(`${props.name}TaskDefinition`, {
      containerDefinitions: pulumi.jsonStringify([
        {
          name: props.name,
          image: props.image,
          command: props.command,
          environment: props.envVars,
          essential: true,
          user: "root",
          logConfiguration: {
            logDriver: "awslogs",
            options: {
              "awslogs-group": cwLoggingResources.cwLogGroupName,
              "awslogs-region": region.name,
              "awslogs-stream-prefix": props.name
            }
          }
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

    // aws ecs service
    const ecsService = new aws.ecs.Service(`${props.name}SchedulerService`, {
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
      networkConfiguration: {
        assignPublicIp: false,
        securityGroups: [props.appSgId],
        subnets: props.privateSubnetIds
      }
    }, {
      parent: this,
      ignoreChanges: ['taskDefinition']
    });
  }
}
