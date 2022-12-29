import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";
import { Input } from "@pulumi/pulumi";

interface WorkerEcsServiceProps {
  // defined locally
  name: string;
  command: Input<string[]>,
  envVars: { [key: string]: pulumi.Input<string> | string }[];
  logRetentionInDays: number;
  cpu: string;
  memory: string;
  logGroupName: string;
  logStreamPrefix: string;
  // from base stack
  appSgId: Input<string>;
  privateSubnets: Input<string[]>;
  // inputs from this stack
  image: string;
  ecsClusterId: Input<string>;
  executionRoleArn: Input<string>;
  taskRoleArn: Input<string>;
}

export class WorkerEcsService extends pulumi.ComponentResource {
  // public foo: aws.foo.bar;
  /**
   * Creates a new static website hosted on AWS.
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to AdHocBaseEnv component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: WorkerEcsServiceProps, opts?: pulumi.ResourceOptions) {
    const stackName = pulumi.getStack();
    // TODO figure out how to fix this so it does not need to be hard coded below
    // const region = aws.getRegionOutput();
    // const region = new pulumi.Config();
    // const r = region.require("region")

    super(`pulumi-contrib:components:${props.name}WorkerEcsService`, name, props, opts);

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
      containerDefinitions: JSON.stringify([
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
          }
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
    const ecsService = new aws.ecs.Service(`${props.name}CeleryService`, {
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
        assignPublicIp: true,
        securityGroups: [props.appSgId],
        subnets: props.privateSubnets
      }
    }, {
      ignoreChanges: ['taskDefinition', 'desiredCount']
    });
  }
}
