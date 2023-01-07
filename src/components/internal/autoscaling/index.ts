import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";

interface AutoScalingResourcesProps {
  clusterName: pulumi.Output<string>;
  serviceName: pulumi.Output<string>;
}

export class AutoScalingResources extends pulumi.ComponentResource {
  /**
   * Creates a set of resources needed for autoscaling an ECS Service
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to the component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: AutoScalingResourcesProps, opts?: pulumi.ResourceOptions) {
    const stackName = pulumi.getStack();
    super("pulumi-contrib:components:AutoScalingResources", name, props, opts);

    const resourceId = pulumi.interpolate`service/${props.clusterName}/${props.serviceName}`;
    const serviceNamespace = "ecs";
    const scalableDimension = "ecs:service:DesiredCount";
    const adjustmentType = "ChangeInCapacity";

    const autoScalingTarget = new aws.appautoscaling.Target("AppAutoScaling", {
      serviceNamespace: "ecs",
      resourceId,
      scalableDimension: "ecs:service:DesiredCount",
      minCapacity: 1,
      maxCapacity: 3
    }, { parent: this });

    const scaleUpPolicy = new aws.appautoscaling.Policy("ScaleUpPolicy", {
      name: `${stackName}ScaleUp`,
      serviceNamespace,
      resourceId,
      scalableDimension,
      stepScalingPolicyConfiguration: {
        adjustmentType,
        cooldown: 60,
        metricAggregationType: "Maximum",
        stepAdjustments: [
          {
            metricIntervalLowerBound: "0",
            scalingAdjustment: 1
          }
        ]
      }
    }, {
      dependsOn: autoScalingTarget,
      parent: this
    });

    const scaleDownPolicy = new aws.appautoscaling.Policy("ScaleDownPolicy", {
      name: `${stackName}ScaleDown`,
      serviceNamespace,
      resourceId,
      scalableDimension,
      stepScalingPolicyConfiguration: {
        adjustmentType,
        cooldown: 60,
        metricAggregationType: "Maximum",
        stepAdjustments: [
          {
            metricIntervalLowerBound: "0",
            scalingAdjustment: -1
          }
        ]
      }
    }, {
      dependsOn: autoScalingTarget,
      parent: this
    });

    const highCpuAlarm = new aws.cloudwatch.MetricAlarm("ServiceHighCpu", {
      metricName: "CPUUtilization",
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      evaluationPeriods: 2,
      namespace: "AWS/ECS",
      period: 60,
      statistic: "Average",
      threshold: 85,
      dimensions: {
        ClusterName: props.clusterName,
        ServiceName: props.serviceName
      },
      alarmActions: [scaleUpPolicy.arn]
    }, { parent: this });

    const lowCpuAlarm = new aws.cloudwatch.MetricAlarm("ServiceLowCpu", {
      metricName: "CPUUtilization",
      comparisonOperator: "LessThanOrEqualToThreshold",
      evaluationPeriods: 2,
      namespace: "AWS/ECS",
      period: 60,
      statistic: "Average",
      threshold: 85,
      dimensions: {
        ClusterName: props.clusterName,
        ServiceName: props.serviceName
      },
      alarmActions: [scaleDownPolicy.arn]
    }, { parent: this });
  }
}
