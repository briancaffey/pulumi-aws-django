import * as aws from "@pulumi/aws"
import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";

interface RdsResourcesProps {
  vpc: awsx.ec2.Vpc;
  appSecurityGroup: aws.ec2.SecurityGroup;
  dbSecretName: string;
  port: number;
}

export class RdsResources extends pulumi.ComponentResource {
  public databaseInstance: aws.rds.Instance;
  /**
   * Creates a new static website hosted on AWS.
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to AdHocBaseEnv component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: RdsResourcesProps, opts?: pulumi.ResourceOptions) {
    const stackName = pulumi.getStack();
    super("pulumi-contrib:components:RdsResources", name, props, opts);

    // rds security group
    const rdsSecurityGroup = new aws.ec2.SecurityGroup('RdsSecurityGroup', {
      description: "Allow traffic from app sg to RDS",
      vpcId: props.vpc.vpc.id,
      ingress: [{
        description: "allow traffic from app sg",
        fromPort: props.port,
        toPort: props.port,
        protocol: "tcp",
        securityGroups: [props.appSecurityGroup.id],
      }],
      egress: [{
        fromPort: 0,
        toPort: 0,
        protocol: "-1",
        cidrBlocks: ["0.0.0.0/0"],
      }],
    });

    // secret?
    // TODO: add this later with random password
    // https://www.pulumi.com/registry/packages/random/api-docs/randompassword/

    // subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup("DbSubnetGroup", {
      subnetIds: props.vpc.privateSubnetIds,
      name: `${stackName}-db-subnet-group`
    });

    // instance
    const dbInstance = new aws.rds.Instance("DbInstance", {
      identifier: `${stackName}-rds`,
      instanceClass: "db.t3.micro",
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      engine: "",
      engineVersion: "",
      port: props.port,
      username: "postgres",
      password: "postgres",
      allocatedStorage: 20,
      storageEncrypted: false,
      multiAz: false,
      storageType: "gp2",
      publiclyAccessible: false,
      skipFinalSnapshot: true,
      backupRetentionPeriod: 7,
      dbSubnetGroupName: dbSubnetGroup.name,
      dbName: "postgres"
    });
    this.databaseInstance = dbInstance;
  }
}