import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";

interface EcsClusterResourcesProps {
  useSpot?: boolean
}

export class EcsClusterResources extends pulumi.ComponentResource {
  public clusterId: pulumi.Output<string>;
  public clusterName: pulumi.Output<string>;
  /**
   * Creates a new static website hosted on AWS.
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to AdHocBaseEnv component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: EcsClusterResourcesProps, opts?: pulumi.ResourceOptions) {
    const stackName = pulumi.getStack();
    super(`pulumi-contrib:components:EcsClusterResources`, name, props, opts);

    // default to not using spot instances
    const useSpot: boolean = props.useSpot ?? false;

    const cluster = new aws.ecs.Cluster("EcsCluster", {
      name: `${stackName}-cluster`
    }, { parent: this });
    this.clusterId = cluster.id;
    this.clusterName = cluster.name;

    new aws.ecs.ClusterCapacityProviders("clusterCapacityProviders", {
      clusterName: cluster.name,
      capacityProviders: useSpot ? ["FARGATE_SPOT", "FARGATE"] : ["FARGATE"],
      defaultCapacityProviderStrategies: [{
          base: 1,
          weight: 100,
          capacityProvider: useSpot ? "FARGATE_SPOT" : "FARGATE",
      }],
    }, { parent: cluster });
  }
}
