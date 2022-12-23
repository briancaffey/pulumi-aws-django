import * as aws from "@pulumi/aws"
import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";

// interface AdHocBaseEnvComponentProps {
//   certificateArn: string;
//   domainName: string
// }

/**
 * Static website using Amazon S3, CloudFront, and Route53.
 */
export class AdHocBaseEnvComponent extends pulumi.ComponentResource {

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

    const vpc = new awsx.ec2.Vpc("main", {
      cidrBlock: "10.0.0.0/16",
      numberOfAvailabilityZones: 2,
    });

    // const assetsBucket = new aws.s3.Bucket("assetsBucket", {
    //   bucket: 'my-bucket'
    // })
  }
}
