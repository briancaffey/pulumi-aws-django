import * as aws from "@pulumi/aws"
// import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";

/**
 * The inputs needed for setting up and ad hoc environment
 */
interface AdHocAppComponentProps {
  vpcId: string;
  privateSubnets: string[];
  publicSubnets: string[];
  appSgId: string;
  albSgId: string;
  listenerArn: string;
  albDefaultTgArn: string;
  albDnsName: string;
  serviceDiscoveryNamespaceId: string;
  rdsAddress: string;
  domainName: string;
}

/**
 * Base resources for Ad Hoc environments.
 * Includes networking resources (VPC, SG, ALB, CloudMap), RDS and S3
 */
export class AdHocAppComponent extends pulumi.ComponentResource {

  /**
   * Creates resources for ad hoc application environments
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to AdHocBaseEnv component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: AdHocAppComponentProps, opts?: pulumi.ResourceOptions) {
    super("pulumi-contrib:components:AdHocApp", name, props, opts);

    const stackName = pulumi.getStack();

    // https://www.pulumi.com/registry/packages/aws/api-docs/ecs/cluster/
    new aws.ecs.Cluster("EcsCluster", {
      name: `${stackName}-cluster`
    });

    // TODO add the rest of the ad hoc app component resources here
  }
}
