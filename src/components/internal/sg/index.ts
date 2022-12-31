import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";

interface SecurityGroupResourcesProps {
  vpcId: pulumi.Output<string>;
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

    const albSecurityGroup = new aws.ec2.SecurityGroup('AlbSecurityGroup', {
      description: "Allow traffic from ALB",
      vpcId: props.vpcId,
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
    }, { parent: this });
    this.albSecurityGroup = albSecurityGroup;

    const appSecurityGroup = new aws.ec2.SecurityGroup('AppSecurityGroup', {
      description: "Allow traffic from ALB SG to apps",
      vpcId: props.vpcId,
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
    }, { parent: this });
    this.appSecurityGroup = appSecurityGroup;
  }
}
