import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";

interface CwLoggingResourcesProps {
  name: string;
  logRetentionInDays: number;
}

export class CwLoggingResources extends pulumi.ComponentResource {
  public cwLogGroupName: pulumi.Output<string>;
  /**
   * Creates a log group and log stream to be used by containers in ECS tasks
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to EcsBaseEnv component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: CwLoggingResourcesProps, opts?: pulumi.ResourceOptions) {
    const stackName = pulumi.getStack();
    super(`pulumi-contrib:components:${props.name}CwLoggingResources`, name, props, opts);

    // aws cloudwatch log group
    const cwLogGroup = new aws.cloudwatch.LogGroup(`${props.name}LogGroup`, {
      name: `/ecs/${stackName}/${props.name}`,
      retentionInDays: props.logRetentionInDays
    }, { parent: this });
    this.cwLogGroupName = cwLogGroup.name;

    // aws cloudwatch log stream
    new aws.cloudwatch.LogStream(`${props.name}LogStream`, {
      logGroupName: cwLogGroup.name,
      name: props.name
    }, { parent: this});
  }
}
