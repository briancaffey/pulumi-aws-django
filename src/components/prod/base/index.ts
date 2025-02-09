import * as aws from "@pulumi/aws"
import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";
import { AlbResources } from "../../internal/alb";
import { RdsResources } from '../../internal/rds';
import { ElastiCacheResources } from '../../internal/elasticache'
import { registerAutoTags } from "../../../util";
import { SecurityGroupResources } from "../../internal/sg";

// automatically tag all resources
registerAutoTags({
  "env": pulumi.getStack(),
});

/**
 * The inputs needed for setting up and ad hoc environment
 */
interface ProdBaseEnvComponentProps {
  certificateArn: string;
  domainName: string;
}

/**
 * Base resources for Production and Pre-production environments.
 * For example, Stage and Production environments can both use this component for their base stacks
 * Includes networking resources (VPC, SG, ALB, CloudMap), RDS, ElastiCache and S3
 */
export class ProdBaseEnvComponent extends pulumi.ComponentResource {

  public readonly vpc: awsx.ec2.Vpc;
  public readonly alb: aws.alb.LoadBalancer;
  public readonly appSecurityGroup: aws.ec2.SecurityGroup;
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly databaseInstance: aws.rds.Instance;
  public readonly assetsBucket: aws.s3.Bucket;
  public readonly domainName: string;
  public readonly listener: aws.alb.Listener;
  public readonly stackName: string;
  public readonly bastionHostInstanceId?: pulumi.Output<string>;
  public readonly elastiCacheCluster: aws.elasticache.Cluster;

  /**
   * Creates base resources to support production application environments
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to ProdBaseEnv component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: ProdBaseEnvComponentProps, opts?: pulumi.ResourceOptions) {
    super("pulumi-contrib:components:ProdBaseEnv", name, props, opts);

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
      vpcId: vpc.vpcId,
      privateSubnetIds: vpc.privateSubnetIds,
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

    const rdsResources = new RdsResources("RdsResources", {
      appSgId: securityGroupResources.appSecurityGroup.id,
      dbSecretName: "DB_SECRET_NAME",
      port: 5432,
      vpcId: vpc.vpcId,
      privateSubnetIds: vpc.privateSubnetIds
    }, { parent: this });
    this.databaseInstance = rdsResources.databaseInstance;

    const elastiCacheResources = new ElastiCacheResources("ElastiCacheResources", {
      vpcId: vpc.vpcId,
      privateSubnetIds: vpc.privateSubnetIds,
      appSgId: securityGroupResources.appSecurityGroup.id,
      port: 6379
    }, { parent: this });
    this.elastiCacheCluster = elastiCacheResources.elastiCacheCluster;

  }
}
