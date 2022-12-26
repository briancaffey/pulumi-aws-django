import * as pulumi from "@pulumi/pulumi";
import { AdHocAppComponent } from '../../../src/components/ad-hoc/app';

// try importing configs from
let vpcId: string;
let privateSubnets: string[];
let publicSubnets: string[];
let appSgId: string;
let albSgId: string;
let listenerArn: string;
let albDefaultTgArn: string;
let albDnsName: string;
let serviceDiscoveryNamespaceId: string;
let rdsAddress: string;
let domainName: string;

try {
  const org = process.env.PULUMI_ORG || "briancaffey";
  const stackReference = new pulumi.StackReference(`${org}/ad-hoc-base/dev`)
  vpcId = stackReference.getOutput("vpcId") as unknown as string;
  privateSubnets = stackReference.getOutput("privateSubnetIds") as unknown as string[];
  publicSubnets = stackReference.getOutput("publicSubnetIds") as unknown as string[];

  appSgId = stackReference.getOutput("appSgId") as unknown as string;
  albSgId = stackReference.getOutput("albSgId") as unknown as string;
  listenerArn = stackReference.getOutput("listenerArn") as unknown as string;
  albDefaultTgArn = stackReference.getOutput("albDefaultTgArn") as unknown as string;
  albDnsName = stackReference.getOutput("albDnsName") as unknown as string;
  serviceDiscoveryNamespaceId = stackReference.getOutput("serviceDiscoveryNamespaceId") as unknown as string;
  rdsAddress = stackReference.getOutput("rdsAddress") as unknown as string;
  domainName = stackReference.getOutput("domainName") as unknown as string;

} catch (error) {
  vpcId = "abc";
  privateSubnets = ["abc", "def"];
  publicSubnets = ["abc", "def"];
  appSgId = "";
  albSgId = "";
  listenerArn = "";
  albDefaultTgArn = "";
  albDnsName = "";
  serviceDiscoveryNamespaceId = "";
  rdsAddress = "";
  domainName = "";
}

// ad hoc app env
const adHocAppComponent = new AdHocAppComponent("AdHocAppComponent", {
  vpcId,
  privateSubnets,
  publicSubnets,
  appSgId,
  albSgId,
  listenerArn,
  albDefaultTgArn,
  albDnsName,
  serviceDiscoveryNamespaceId,
  rdsAddress,
  domainName,
})


// exports