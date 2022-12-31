import * as aws from "@pulumi/aws"
import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";
import { AlbResources } from "../../internal/alb";
import { BastionHostResources } from '../../internal/bastion';
import { RdsResources } from '../../internal/rds';
import { registerAutoTags } from "../../../util";
import { SecurityGroupResources } from "../../internal/sg";

// automatically tag all resources
registerAutoTags({
  "env": pulumi.getStack(),
});

/**
 * The inputs needed for setting up and ad hoc environment
 */
interface AdHocBaseEnvComponentProps {
  certificateArn: string;
  domainName: string;
}

/**
 * Base resources for Ad Hoc environments.
 * Includes networking resources (VPC, SG, ALB, CloudMap), RDS and S3
 */
export class AdHocBaseEnvComponent extends pulumi.ComponentResource {

  public readonly vpc: awsx.ec2.Vpc;
  public readonly alb: aws.alb.LoadBalancer;
  public readonly appSecurityGroup: aws.ec2.SecurityGroup;
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly serviceDiscoveryNamespace: aws.servicediscovery.PrivateDnsNamespace;
  public readonly databaseInstance: aws.rds.Instance;
  public readonly assetsBucket: aws.s3.Bucket;
  public readonly domainName: string;
  public readonly listener: aws.alb.Listener;
  public readonly stackName: string;
  public readonly bastionHostInstanceId?: pulumi.Output<string>;

  /**
   * Creates base resources to support ad hoc application environments
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to AdHocBaseEnv component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: AdHocBaseEnvComponentProps, opts?: pulumi.ResourceOptions) {
    super("pulumi-contrib:components:AdHocBaseEnv", name, props, opts);

    const stackName = pulumi.getStack();
    this.stackName = stackName;
    this.domainName = props.domainName;

    const vpc = new awsx.ec2.Vpc(stackName, {
      cidrBlock: "10.0.0.0/16",
      numberOfAvailabilityZones: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true
    }, { parent: this });
    this.vpc = vpc;

    const assetsBucket = new aws.s3.Bucket("assetsBucket", {
      bucket: `${props.domainName.replace(".", "-")}-${stackName}-assets-bucket`,
      forceDestroy: true
    }, { parent: this });
    this.assetsBucket = assetsBucket;

    const securityGroupResources = new SecurityGroupResources("SecurityGroupResources", {
      vpcId: vpc.vpcId
    }, { parent: this });
    this.appSecurityGroup = securityGroupResources.appSecurityGroup;
    this.albSecurityGroup = securityGroupResources.albSecurityGroup;

    // ALB resources (Load Balancer, Default Target Group, HTTP and HTTPS Listener)
    const loadBalancerResources = new AlbResources("AlbResources", {
      albSgId: securityGroupResources.albSecurityGroup.id,
      certificateArn: props.certificateArn,
      publicSubnetIds: vpc.publicSubnetIds,
      vpcId: vpc.vpcId,
    }, { parent: this });
    this.alb = loadBalancerResources.alb;
    this.listener = loadBalancerResources.listener;

    // CloudMap service discovery is only needed in ad hoc environments
    // It is needed to support running redis in our ECS cluster
    const sdNameSpace = new aws.servicediscovery.PrivateDnsNamespace("PrivateDnsNamespace", {
      description: "private dns namespace for ad hoc environment",
      vpc: vpc.vpcId,
      name: `${stackName}-sd-ns`
    }, { parent: this });
    this.serviceDiscoveryNamespace = sdNameSpace;

    // RDS
    const rdsResources = new RdsResources("RdsResources", {
      appSgId: securityGroupResources.appSecurityGroup.id,
      dbSecretName: "DB_SECRET_NAME",
      port: 5432,
      vpcId: vpc.vpcId,
      privateSubnetIds: vpc.privateSubnetIds
    }, { parent: this });
    this.databaseInstance = rdsResources.databaseInstance;

    // BastionHost
    const bastionHost = new BastionHostResources("BastionHostResources", {
      appSgId: securityGroupResources.appSecurityGroup.id,
      rdsAddress: rdsResources.databaseInstance.address,
      privateSubnet: vpc.privateSubnetIds[0]
    }, { parent: this });
    this.bastionHostInstanceId = bastionHost.instanceId;
  }
}
