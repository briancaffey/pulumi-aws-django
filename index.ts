import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

/**
 * Static website using Amazon S3, CloudFront, and Route53.
 */
export class AdHocEnvironmentComponent extends pulumi.ComponentResource {

  /**
   * Creates a new static website hosted on AWS.
   * @param name The _unique_ name of the resource.
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, opts?: pulumi.ResourceOptions) {
    const inputs: pulumi.Inputs = {
      options: opts,
    };

    super("pulumi-contrib:components:AdHoc", name, inputs, opts);

    new aws.ec2.Vpc("main", {
      cidrBlock: "10.0.0.0/16",
    });
  }
}
