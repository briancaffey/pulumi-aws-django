import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi";

interface ElastiCacheResourcesProps {
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string[]>;
  appSgId: pulumi.Output<string>;
  port: number;
}

export class ElastiCacheResources extends pulumi.ComponentResource {
  public elastiCacheCluster: aws.elasticache.Cluster;
  /**
   * Creates an ElastiCache cluster that runs redis
   * @param name The _unique_ name of the resource.
   * @param props Props to pass to ElastiCacheResources component
   * @param opts A bag of options that control this resource's behavior.
   */
  constructor(name: string, props: ElastiCacheResourcesProps, opts?: pulumi.ResourceOptions) {
    const stackName = pulumi.getStack();
    super("pulumi-contrib:components:ElastiCacheResources", name, props, opts);

    const elastiCacheSecurityGroup = new aws.ec2.SecurityGroup('ElastiCacheSecurityGroup', {
      description: "Allow traffic from app sg to ElastiCache",
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

    const elastiCacheSubnetGroup = new aws.elasticache.SubnetGroup("ElastiCacheSubnetGroup", {
      subnetIds: props.privateSubnetIds,
      name: `${stackName}-elasticache-subnet-group`
    }, { parent: this });

    const elastiCacheCluster = new aws.elasticache.Cluster("ElastiCacheCluster", {
      clusterId: `${stackName}-elasticache-cluster`,
      engine: "redis",
      nodeType: "cache.t2.micro",
      numCacheNodes: 1,
      parameterGroupName: "default.redis6.x",
      engineVersion: "6.x",
      port: props.port,
      subnetGroupName: elastiCacheSubnetGroup.name,
      securityGroupIds: [elastiCacheSecurityGroup.id]
    }, { parent: this });
    this.elastiCacheCluster = elastiCacheCluster;
  }
}