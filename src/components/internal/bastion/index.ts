import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";

interface BastionHostResourcesProps {
  instanceType?: string;
  rdsAddress: pulumi.Output<string>;
  appSgId: pulumi.Output<string>;
  privateSubnet: pulumi.Output<string>;
}

export class BastionHostResources extends pulumi.ComponentResource {
  public readonly instanceId?: pulumi.Output<string>;

  /**
   * Creates resources for a bastion host EC2 instance.
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to the BastionHostResources component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: BastionHostResourcesProps, opts?: pulumi.ResourceOptions) {
    const stackName = pulumi.getStack();
    super("pulumi-contrib:components:BastionHostResources", name, props, opts);

    // ami
    const ami = aws.ec2.getAmi({
      filters: [
        {
          name: "owner-alias",
          values: ["amazon"]
        },
        {
          name: "name",
          values: ["amzn2-ami-hvm-*-x86_64-ebs"]
        }
      ],
      mostRecent: true,
      owners: ["amazon"]
    });

    // role
    // ecs task role
    const bastionHostRole = new aws.iam.Role("BastionHostRole", {
      name: `${stackName}BastionHostRole`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Sid: "",
          Principal: {
            Service: ["ec2.amazonaws.com"],
          },
        }],
      }),
    });

    // policy for BastionHostRole
    const policy = new aws.iam.RolePolicy("BastionHostPolicy", {
      name: `${stackName}BastionHostPolicy`,
      role: bastionHostRole.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: [
            "ssmmessages:*",
            "ssm:UpdateInstanceInformation",
            "ec2messages:*"
          ],
          Effect: "Allow",
          Resource: "*",
        }],
      }),
    });

    // instance profile
    const instanceProfile = new aws.iam.InstanceProfile("BastionHostInstanceProfile", {
      role: bastionHostRole.name,
      name: `${stackName}BastionInstanceProfile`
    });

    // bastion host user data string
    const bastionHostUserData = `
#cloud-config
package_upgrade: true
packages:
  - postgresql
  - socat
write_files:
  - content: |
      # /etc/systemd/system/socat-forwarder.service
      [Unit]
      Description=socat forwarder service
      After=socat-forwarder.service
      Requires=socat-forwarder.service

      [Service]
      Type=simple
      StandardOutput=syslog
      StandardError=syslog
      SyslogIdentifier=socat-forwarder

      ExecStart=/usr/bin/socat -d -d TCP4-LISTEN:5432,fork TCP4:${props.rdsAddress}:5432
      Restart=always

      [Install]
      WantedBy=multi-user.target
    path: /etc/systemd/system/socat-forwarder.service

runcmd:
  - [ systemctl, daemon-reload ]
  - [ systemctl, enable, socat-forwarder.service ]
  # https://dustymabe.com/2015/08/03/installingstarting-systemd-services-using-cloud-init/
  - [ systemctl, start, --no-block, socat-forwarder.service ]
`;

    // instance
    const instance = new aws.ec2.Instance("BastionHostInstance", {
      ami: ami.then(i => i.id),
      associatePublicIpAddress: true,
      instanceType: props.instanceType ?? 't2.micro',
      userDataReplaceOnChange: true,
      iamInstanceProfile: instanceProfile.name,
      vpcSecurityGroupIds: [props.appSgId],
      subnetId: props.privateSubnet,
      userData: bastionHostUserData,
    });
    this.instanceId = instance.id;
  }
}