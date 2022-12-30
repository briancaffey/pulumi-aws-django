import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";
import { Input } from "@pulumi/pulumi";

interface ManagementCommandTaskProps {
  // defined locally
  name: string;
  command: string[];
  envVars: pulumi.Output<{ "name": string, "value": string }[]>;
  logRetentionInDays: number;
  cpu: string;
  memory: string;
  logGroupName: string;
  logStreamPrefix: string;
  containerName: string;
  // from base stack
  appSgId: pulumi.Output<string>;
  privateSubnets: pulumi.Output<string[]>;
  // inputs from this stack
  image: string;
  ecsClusterId: Input<string>;
  executionRoleArn: Input<string>;
  taskRoleArn: Input<string>;
}

export class ManagementCommandTask extends pulumi.ComponentResource {
  public executionScript: pulumi.Output<string>;
  /**
   * Creates a new static website hosted on AWS.
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to AdHocBaseEnv component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: ManagementCommandTaskProps, opts?: pulumi.ResourceOptions) {
    const stackName = pulumi.getStack();
    const region = aws.getRegionOutput();
    super(`pulumi-contrib:components:${props.name}ManagementCommandTask`, name, props, opts);

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
          environment: props.envVars,
          command: props.command,
          essential: true,
          logConfiguration: {
            logDriver: "awslogs",
            options: {
              "awslogs-group": props.logGroupName,
              "awslogs-region": "us-east-1",
              "awslogs-stream-prefix": props.logStreamPrefix
            }
          },
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

    // this script is called once on initial setup from GitHub Actions
    const executionScript = pulumi.interpolate`#!/bin/bash
START_TIME=$(date +%s000)
TASK_ID=$(aws ecs run-task --cluster ${props.ecsClusterId} --task-definition ${taskDefinition.arn} --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[${props.privateSubnets.apply(x => x.join(","))}],securityGroups=[${props.appSgId}],assignPublicIp=ENABLED}" | jq -r '.tasks[0].taskArn')
aws ecs wait tasks-stopped --tasks $TASK_ID --cluster ${props.ecsClusterId}
END_TIME=$(date +%s000)
aws logs get-log-events --log-group-name ${props.logGroupName} --log-stream-name ${props.logStreamPrefix}/${props.containerName}/\${TASK_ID##*/} --start-time $START_TIME --end-time $END_TIME | jq -r '.events[].message'
`;
    this.executionScript = executionScript;
  }
}
