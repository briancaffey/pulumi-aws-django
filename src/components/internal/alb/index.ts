import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";

interface AlbResourcesProps {
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string[]>;
  albSgId: pulumi.Output<string>;
  certificateArn: string;
}

export class AlbResources extends pulumi.ComponentResource {
  public readonly listener: aws.alb.Listener;
  public readonly alb: aws.alb.LoadBalancer;

  /**
   * Creates a new static website hosted on AWS.
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to AdHocBaseEnv component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: AlbResourcesProps, opts?: pulumi.ResourceOptions) {
    super(`pulumi-contrib:components:AlbResources`, name, props, opts);

    const loadBalancer = new aws.alb.LoadBalancer("LoadBalancer", {
      internal: false,
      loadBalancerType: "application",
      securityGroups: [props.albSgId],
      subnets: props.publicSubnetIds,
    }, { parent: this });
    this.alb = loadBalancer;

    new aws.alb.TargetGroup("DefaultTg", {
      vpcId: props.vpcId,
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
    }, { parent: this });

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
    }, { parent: this });

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
    }, { parent: this });
    this.listener = httpsListener;
  }
}

