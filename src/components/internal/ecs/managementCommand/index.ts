import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";
import { Input } from "@pulumi/pulumi";
import { CwLoggingResources } from "../../cw";

interface ManagementCommandTaskProps {
  name: string;
  command: pulumi.Input<string[]>;
  envVars: pulumi.Output<{ "name": string, "value": string }[]>;
  logRetentionInDays?: number;
  cpu?: string;
  memory?: string;
  // from base stack
  appSgId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string[]>;
  // inputs from this stack
  image: string;
  ecsClusterId: Input<string>;
  executionRoleArn: Input<string>;
  taskRoleArn: Input<string>;
}

export class ManagementCommandTask extends pulumi.ComponentResource {
  public executionScript: pulumi.Output<string>;
  private memory: string;
  private cpu: string;
  private logRetentionInDays: number;

  /**
   * Creates a task definition and a script to run the task using AWS CLI an any application deployment
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to AdHocBaseEnv component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: ManagementCommandTaskProps, opts?: pulumi.ResourceOptions) {
    const stackName = pulumi.getStack();
    const region = aws.getRegionOutput();
    super(`pulumi-contrib:components:${props.name}ManagementCommandTask`, name, props, opts);

    // set defaults
    this.cpu = props.cpu ?? "256";
    this.memory = props.memory ?? "512";
    this.logRetentionInDays = props.logRetentionInDays ?? 1;

    const cwLoggingResources = new CwLoggingResources(`${props.name}CwLoggingResources`, {
      name: props.name,
      logRetentionInDays: this.logRetentionInDays
    }, { parent: this });

    // aws ecs task definition
    const taskDefinition = new aws.ecs.TaskDefinition(`${props.name}TaskDefinition`, {
      containerDefinitions: pulumi.jsonStringify([
        {
          name: props.name,
          image: props.image,
          environment: props.envVars,
          command: props.command,
          essential: true,
          logConfiguration: {
            logDriver: "awslogs",
            options: {
              "awslogs-group": cwLoggingResources.cwLogGroupName,
              "awslogs-region": region.name,
              "awslogs-stream-prefix": props.name
            }
          },
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

    // this script is called once on initial setup from GitHub Actions
    const executionScript = pulumi.interpolate`#!/bin/bash
START_TIME=$(date +%s000)
TASK_ID=$(aws ecs run-task --cluster ${props.ecsClusterId} --task-definition ${taskDefinition.arn} --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[${props.privateSubnetIds.apply(x => x.join(","))}],securityGroups=[${props.appSgId}],assignPublicIp=ENABLED}" | jq -r '.tasks[0].taskArn')
aws ecs wait tasks-stopped --tasks $TASK_ID --cluster ${props.ecsClusterId}
END_TIME=$(date +%s000)
aws logs get-log-events --log-group-name ${cwLoggingResources.cwLogGroupName} --log-stream-name ${props.name}/${props.name}/\${TASK_ID##*/} --start-time $START_TIME --end-time $END_TIME | jq -r '.events[].message'
`;
    this.executionScript = executionScript;
  }
}
