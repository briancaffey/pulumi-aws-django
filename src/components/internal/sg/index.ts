import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";

interface SecurityGroupResourcesProps {
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string[]>;
}

export class SecurityGroupResources extends pulumi.ComponentResource {
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly appSecurityGroup: aws.ec2.SecurityGroup;
  /**
   * Creates ALB and Application Security Groups
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to AdHocBaseEnv component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: SecurityGroupResourcesProps, opts?: pulumi.ResourceOptions) {
    super(`pulumi-contrib:components:SecurityGroupResources`, name, props, opts);
    const region = aws.getRegionOutput();

    // Security Groups
    const albSecurityGroup = new aws.ec2.SecurityGroup("albSecurityGroup", {
      name: pulumi.interpolate`${pulumi.getStack()}-alb-sg`,
      description: "ALB security group",
      vpcId: props.vpcId,
      tags: { Name: pulumi.interpolate`${pulumi.getStack()}-alb-sg` },
    });
    this.albSecurityGroup = albSecurityGroup;

    const appSecurityGroup = new aws.ec2.SecurityGroup("appSecurityGroup", {
      name: pulumi.interpolate`${pulumi.getStack()}-app-sg`,
      description: "Allows inbound access from the ALB only",
      vpcId: props.vpcId,
      tags: { Name: pulumi.interpolate`${pulumi.getStack()}-ecs-sg` },
    });
    this.appSecurityGroup = appSecurityGroup;

    // VPC endpoint security group
    const vpceSecurityGroup = new aws.ec2.SecurityGroup("vpceSecurityGroup", {
      name: pulumi.interpolate`${pulumi.getStack()}-vpce-sg`,
      description: "Security Group for VPC Endpoints (ECR API, ECR DKR, S3, Secrets Manager",
      vpcId: props.vpcId,
      tags: { Name: pulumi.interpolate`${pulumi.getStack()}-vpce-sg` },
    });

    // VPC Endpoints

    const ecrApiEndpoint = new aws.ec2.VpcEndpoint("ecrApiEndpoint", {
      vpcId: props.vpcId,
      serviceName: pulumi.interpolate`com.amazonaws.${region}.ecr.api`,
      vpcEndpointType: "Interface",
      subnetIds: props.privateSubnetIds,
      securityGroupIds: [vpceSecurityGroup.id],
      privateDnsEnabled: true,
      tags: {
          Name: pulumi.interpolate`${pulumi.getStack()}-vpce-ecr-api`,
      },
    });

    const ecrDkrEndpoint = new aws.ec2.VpcEndpoint("ecrDkrEndpoint", {
      vpcId: props.vpcId,
      serviceName: pulumi.interpolate`com.amazonaws.${region}.ecr.dkr`,
      vpcEndpointType: "Interface",
      subnetIds: props.privateSubnetIds,
      securityGroupIds: [vpceSecurityGroup.id],
      privateDnsEnabled: true,
      tags: {
          Name: pulumi.interpolate`${pulumi.getStack()}-vpce-ecr-dkr`,
      },
    });

    // Get private route table IDs. The awsx.ec2.Vpc component does not expose this
    // Use .apply() to access the array once it resolves
    const privateRouteTableIds = props.privateSubnetIds.apply(subnetIds => {
      // For each subnetId, look up its associated route table and extract the id.
      const rtIdPromises = subnetIds.map(subnetId =>
          aws.ec2.getRouteTable({ subnetId: subnetId }).then(rt => rt.id)
      );
      // Wrap the array of promises with pulumi.all to produce an Output<string[]>
      return pulumi.all(rtIdPromises);
    });

    const s3Endpoint = new aws.ec2.VpcEndpoint("s3Endpoint", {
      vpcId: props.vpcId,
      serviceName: pulumi.interpolate`com.amazonaws.${region}.s3`,
      vpcEndpointType: "Gateway",
      routeTableIds: privateRouteTableIds,
      tags: {
          Name: pulumi.interpolate`${pulumi.getStack()}-s3`,
      },
    });

    // Security Group rules

    const albEgressToAppRule = new aws.vpc.SecurityGroupEgressRule("albEgressToAppRule", {
      securityGroupId: albSecurityGroup.id,
      referencedSecurityGroupId: appSecurityGroup.id,
      ipProtocol: "tcp",
      fromPort: 0,
      toPort: 65535,
      description: "Allow outbound TCP traffic from ALB to App",
    });

    const albIngressRule = new aws.vpc.SecurityGroupIngressRule("albIngressRule", {
      securityGroupId: appSecurityGroup.id,
      referencedSecurityGroupId: albSecurityGroup.id,
      ipProtocol: "tcp",
      fromPort: 0,
      toPort: 65535,
      description: "Allow inbound TCP traffic from ALB",
    });

    const albIngressRuleHttp = new aws.vpc.SecurityGroupIngressRule("albIngressRuleHttp", {
      securityGroupId: appSecurityGroup.id,
      referencedSecurityGroupId: albSecurityGroup.id,
      ipProtocol: "tcp",
      fromPort: 80,
      toPort: 80,
      cidrIpv4: '0.0.0.0/0',
      description: "Allow HTTP traffic from anywhere",
    });

    const albIngressRuleHttps = new aws.vpc.SecurityGroupIngressRule("albIngressRuleHttps", {
      securityGroupId: appSecurityGroup.id,
      referencedSecurityGroupId: albSecurityGroup.id,
      ipProtocol: "tcp",
      fromPort: 443,
      toPort: 443,
      cidrIpv4: '0.0.0.0/0',
      description: "Allow HTTPS traffic from anywhere",
    });

    const appEgressRule = new aws.vpc.SecurityGroupEgressRule("appEgressRule", {
      securityGroupId: appSecurityGroup.id,
      ipProtocol: "-1", // all protocols
      cidrIpv4: "0.0.0.0/0",
      description: "Allow all outbound traffic",
    });

    const appToVpceEgressRule = new aws.vpc.SecurityGroupIngressRule("appToVpceEgressRule", {
      securityGroupId: appSecurityGroup.id,
      referencedSecurityGroupId: vpceSecurityGroup.id,
      ipProtocol: "tcp",
      fromPort: 443,
      toPort: 443,
      description: "Allow HTTP traffic from anywhere",
    });

    const vpceToAppIngressRule = new aws.vpc.SecurityGroupIngressRule("vpceToAppIngressRule", {
      securityGroupId: vpceSecurityGroup.id,
      referencedSecurityGroupId: appSecurityGroup.id,
      ipProtocol: "tcp",
      fromPort: 443,
      toPort: 443,
      description: "Allow HTTP traffic from anywhere",
    });

  }
}
