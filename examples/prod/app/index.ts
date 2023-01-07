import * as pulumi from "@pulumi/pulumi";
import { ProdAppComponent } from '../../../src/components/prod/app';

const org = process.env.PULUMI_ORG || "briancaffey";
const environment = process.env.PULUMI_ENVIRONMENT || "stage";

const stackReference = new pulumi.StackReference(`${org}/prod-base/${environment}`)

const vpcId = stackReference.getOutput("vpcId") as pulumi.Output<string>;
const assetsBucketName = stackReference.getOutput("assetsBucketName") as pulumi.Output<string>;
const privateSubnets = stackReference.getOutput("privateSubnetIds") as pulumi.Output<string[]>;
const appSgId = stackReference.getOutput("appSgId") as pulumi.Output<string>;
const albSgId = stackReference.getOutput("albSgId") as pulumi.Output<string>;
const listenerArn = stackReference.getOutput("listenerArn") as pulumi.Output<string>;
const albDnsName = stackReference.getOutput("albDnsName") as pulumi.Output<string>;
const rdsAddress = stackReference.getOutput("rdsAddress") as pulumi.Output<string>;
const elastiCacheAddress = stackReference.getOutput("elastiCacheAddress") as pulumi.Output<string>;
const domainName = stackReference.getOutput("domainName") as pulumi.Output<string>;
const baseStackName = stackReference.getOutput("baseStackName") as pulumi.Output<string>;

// ad hoc app env
const prodAppComponent = new ProdAppComponent("ProdAppComponent", {
  vpcId,
  assetsBucketName,
  privateSubnets,
  appSgId,
  albSgId,
  listenerArn,
  albDnsName,
  elastiCacheAddress,
  rdsAddress,
  domainName,
  baseStackName
});

// exports
export const backendUpdateScript = prodAppComponent.backendUpdateScript;
