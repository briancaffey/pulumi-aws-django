import * as pulumi from "@pulumi/pulumi";
import { AdHocBaseEnvComponent } from '../../../src/components/ad-hoc/base';

// Create an AWS resource (S3 Bucket)
const adHocBaseEnv = new AdHocBaseEnvComponent('myAdHocEnv', {
  certificateArn: process.env.CERTIFICATE_ARN || 'arn:aws:acm:us-east-1:111111111111:certificate/11111111-1111-1111-1111-111111111111',
  domainName: process.env.DOMAIN_NAME || 'example.com'
});

// should I be exporting the vpc component from awsx, or just the vpcid and read it in another stack?
export const vpcId = adHocBaseEnv.vpc.vpcId;
export const privateSubnets = adHocBaseEnv.vpc.privateSubnetIds;
export const publicSubnets = adHocBaseEnv.vpc.publicSubnetIds;
export const appSgId = adHocBaseEnv.appSecurityGroup.id;
export const albSgId = adHocBaseEnv.albSecurityGroup.id;
export const listenerArn = adHocBaseEnv.listener.arn;
export const albDefaultTgArn = "";
export const albDnsName = adHocBaseEnv.alb.dnsName;
export const serviceDiscoveryNamespaceId = adHocBaseEnv.serviceDiscoveryNamespace.id;
export const rdsAddress = adHocBaseEnv.databaseInstance.address;
export const domainName = adHocBaseEnv.domainName;
export const baseStackname = adHocBaseEnv.stackName;
