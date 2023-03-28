import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";

// TODO: add anything here if needed in the future for tighter permissions
interface IamResourcesProps {}

export class IamResources extends pulumi.ComponentResource {
  readonly ecsTaskRole: aws.iam.Role;
  readonly taskExecutionRole: aws.iam.Role;
  /**
   * Creates a new static website hosted on AWS.
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to AdHocBaseEnv component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: IamResourcesProps, opts?: pulumi.ResourceOptions) {
    const stackName = pulumi.getStack();
    super("pulumi-contrib:components:IamResources", name, props, opts);

    // ecs task role
    const ecsTaskRole = new aws.iam.Role("EcsTaskRole", {
      name: `${stackName}EcsTaskRole`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Sid: "",
          Principal: {
            Service: [
              "ec2.amazonaws.com",
              "ecs.amazonaws.com",
              "ecs-tasks.amazonaws.com"
            ],
          },
        }],
      }),
    }, { parent: this });
    this.ecsTaskRole = ecsTaskRole;

    // policy for ecs task role
    new aws.iam.RolePolicy("EcsTaskPolicy", {
      name: `${stackName}EcsTaskPolicy`,
      role: ecsTaskRole.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: [
            'ecs:*',
            'ec2:*',
            'elasticloadbalancing:*',
            'ecr:*',
            'cloudwatch:*',
            's3:*',
            'rds:*',
            'logs:*',
            'elasticache:*',
            'secretsmanager:*',
          ],
          Effect: "Allow",
          Resource: "*",
        }, {
          Effect: "Allow",
          Action: [
            "ssmmessages:CreateControlChannel",
            "ssmmessages:CreateDataChannel",
            "ssmmessages:OpenControlChannel",
            "ssmmessages:OpenDataChannel"
          ],
          Resource: "*"
        }],
      }),
    }, { parent: this });

    // task execution role
    const ecsTaskExecutionRole = new aws.iam.Role("EcsTaskExecutionRole", {
      name: `${stackName}EcsTaskExecutionRole`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Sid: "",
          Principal: {
            Service: ["ecs-tasks.amazonaws.com"],
          },
        }],
      }),
    }, { parent: this });
    this.taskExecutionRole = ecsTaskExecutionRole;

    new aws.iam.RolePolicy("EcsTaskExecutionPolicy", {
      name: `${stackName}EcsTaskPolicy`,
      role: ecsTaskExecutionRole.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: ["s3:*"],
            Resource: ["arn:aws:s3:::*", "arn:aws:s3:::*/*"]
          },
          {
            Effect: "Allow",
            Action: ["secretsmanager:GetSecretValue"],
            Resource: ["*"]
          },
          {
            Effect: "Allow",
            Action: ["ecr:AmazonEC2ContainerRegistryReadOnly", "ecr:*"],
            Resource: ["*"]
          },
          {
            Effect: "Allow",
            Action: [
              'ecs:*',
              'ec2:*',
              'elasticloadbalancing:*',
              'ecr:*',
              'cloudwatch:*',
              's3:*',
              'rds:*',
              'logs:*',
              'elasticache:*',
              'secretsmanager:*',
            ],
            Resource: ["*"]
          },
          {
            Effect: "Allow",
            Action: [
              "ssmmessages:CreateControlChannel",
              "ssmmessages:CreateDataChannel",
              "ssmmessages:OpenControlChannel",
              "ssmmessages:OpenDataChannel"
            ],
            Resource: "*"
          }
        ]
      }),
    }, { parent: this });
  }
}