import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";

interface RdsResourcesProps {
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string[]>;
  appSgId: pulumi.Output<string>;
  dbSecretName: string;
  port: number;
}

export class RdsResources extends pulumi.ComponentResource {
  public databaseInstance: aws.rds.Instance;
  public rdsPasswordSecretName: pulumi.Output<string>;
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
      vpcId: props.vpcId,
      ingress: [{
        description: "allow traffic from app sg",
        fromPort: props.port,
        toPort: props.port,
        protocol: "tcp",
        securityGroups: [props.appSgId],
      }],
      egress: [{
        fromPort: 0,
        toPort: 0,
        protocol: "-1",
        cidrBlocks: ["0.0.0.0/0"],
      }],
    }, { parent: this });

    // TODO: add secret with random password for rds
    // https://www.pulumi.com/registry/packages/random/api-docs/randompassword/
    // https://www.pulumi.com/registry/packages/aws/api-docs/secretsmanager/secretversion/

    // subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup("DbSubnetGroup", {
      subnetIds: props.privateSubnetIds,
      name: `${stackName}-db-subnet-group`
    }, { parent: this });

    const dbParameterGroup = new aws.rds.ParameterGroup("DbParameterGroup", {
      name: `${stackName}parametergroup`,
      family: "postgres13",
      parameters: [
        {
          name: "rds.force_ssl",
          value: "1",
        }
      ],
    }, { parent: this });

    // secret
    const rdsPassword = new random.RandomPassword("rdsPassword", {
      length: 16,
      special: true,
      overrideSpecial: "_!%^",
    });

    const suffix = new random.RandomString("suffix", {
      length: 8,
      special: false,
      upper: false,
    });

    // Create the Secrets Manager secret with a name derived from the stack and suffix.
    const secret = new aws.secretsmanager.Secret("secret", {
      name: pulumi.interpolate`${stackName}/rds-password/${suffix.result}`,
    });
    this.rdsPasswordSecretName = secret.name

    // Create a Secrets Manager secret version that contains the RDS password.
    const secretVersion = new aws.secretsmanager.SecretVersion("secretVersion", {
      secretId: secret.id,
      secretString: rdsPassword.result,
    });

    // instance
    const dbInstance = new aws.rds.Instance("DbInstance", {
      identifier: `${stackName}-rds`,
      instanceClass: "db.t3.micro",
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      engine: "postgres",
      engineVersion: "17.2",
      port: props.port,
      username: "postgres",
      password: pulumi.interpolate`${secretVersion.secretString}`,
      allocatedStorage: 20,
      storageEncrypted: false,
      multiAz: false,
      storageType: "gp2",
      publiclyAccessible: false,
      skipFinalSnapshot: true,
      backupRetentionPeriod: 7,
      dbSubnetGroupName: dbSubnetGroup.name,
      // for prod environments, the prod base stackName is the same as the prod app stack name
      // ad hoc environments have dedicated databases that are created outside of IAC
      dbName: stackName,
      parameterGroupName: dbParameterGroup.name
    }, { parent: this });
    this.databaseInstance = dbInstance;
  }
}