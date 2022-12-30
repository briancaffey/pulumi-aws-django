import * as aws from "@pulumi/aws"
import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";
import { RdsResources } from '../../internal/rds';
import { BastionHostResources } from '../../internal/bastion';

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
    });
    this.vpc = vpc;

    const assetsBucket = new aws.s3.Bucket("assetsBucket", {
      bucket: `${props.domainName.replace(".", "-")}-${stackName}-assets-bucket`
    });
    this.assetsBucket = assetsBucket;

    const albSecurityGroup = new aws.ec2.SecurityGroup('AlbSecurityGroup', {
      description: "Allow traffic from ALB",
      vpcId: vpc.vpcId,
      ingress: [{
        description: "Port 80 Traffic",
        fromPort: 80,
        toPort: 80,
        protocol: "tcp",
        cidrBlocks: ["0.0.0.0/0"],
      }, {
        description: "Port 443 Traffic",
        fromPort: 443,
        toPort: 443,
        protocol: "tcp",
        cidrBlocks: ["0.0.0.0/0"],
      }],
      egress: [{
        fromPort: 0,
        toPort: 0,
        protocol: "-1",
        cidrBlocks: ["0.0.0.0/0"],
      }],
    });
    this.albSecurityGroup = albSecurityGroup;

    const appSecurityGroup = new aws.ec2.SecurityGroup('AppSecurityGroup', {
      description: "Allow traffic from ALB SG to apps",
      vpcId: vpc.vpcId,
      ingress: [{
        description: "Port 80 Traffic",
        fromPort: 0,
        toPort: 0,
        protocol: "-1",
        securityGroups: [albSecurityGroup.id],
      },{
        description: "Allow traffic from this SG",
        fromPort: 0,
        toPort: 0,
        protocol: "-1",
        self: true,
      }],
      egress: [{
        description: "Allow all outbound traffic",
        fromPort: 0,
        toPort: 0,
        protocol: "-1",
        cidrBlocks: ["0.0.0.0/0"],
      },{
        description: "Allow all outbound to this SG",
        fromPort: 0,
        toPort: 0,
        protocol: "-1",
        self: true
      }],
    });
    this.appSecurityGroup = appSecurityGroup;

    const loadBalancer = new aws.alb.LoadBalancer("LoadBalancer", {
      internal: false,
      loadBalancerType: "application",
      securityGroups: [albSecurityGroup.id],
      subnets: vpc.publicSubnetIds,
    });
    this.alb = loadBalancer;

    new aws.alb.TargetGroup("DefaultTg", {
      vpcId: vpc.vpc.id,
      port: 80,
      targetType: "instance",
      protocol: "HTTP",
      healthCheck: {
        protocol: "HTTP",
        interval: 300,
        path: "/api/health-check/",
        timeout: 120,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        port: '80'
      }
    });

    new aws.alb.Listener("HttpListener", {
      loadBalancerArn: loadBalancer.arn,
      port: 80,
      protocol: "HTTP",
      defaultActions: [{
        type: "redirect",
        redirect: {
          port: "443",
          protocol: "HTTPS",
          statusCode: "HTTP_301",
        },
      }]
    });

    const httpsListener = new aws.alb.Listener("HttpsListener", {
      loadBalancerArn: loadBalancer.arn,
      port: 443,
      protocol: "HTTPS",
      certificateArn: props.certificateArn,
      defaultActions: [{
          type: "fixed-response",
          fixedResponse: {
              contentType: "text/plain",
              messageBody: "Fixed response content",
              statusCode: "200",
          },
      }],
    });
    this.listener = httpsListener;

    const serviceDiscoveryPrivateDnsNamespace = new aws.servicediscovery.PrivateDnsNamespace(
      "PrivateDnsNamespace", {
        description: "private dns namespace for ad hoc environment",
        vpc: vpc.vpc.id,
        name: `${stackName}-sd-ns`
      }
    );
    this.serviceDiscoveryNamespace = serviceDiscoveryPrivateDnsNamespace;

    // RDS
    const rdsResources = new RdsResources("RdsResources", {
      appSecurityGroup: appSecurityGroup,
      dbSecretName: "DB_SECRET_NAME",
      port: 5432,
      vpc: vpc
    });
    this.databaseInstance = rdsResources.databaseInstance;

    // BastionHost
    // const bastionHost = new BastionHostResources("BastionHostResources", {
    //   appSgId: appSecurityGroup.id,
    //   rdsAddress: rdsResources.databaseInstance.address,
    //   privateSubnet: vpc.privateSubnetIds[0]
    // });
    // this.bastionHostInstanceId = bastionHost.instanceId;
  }
}
