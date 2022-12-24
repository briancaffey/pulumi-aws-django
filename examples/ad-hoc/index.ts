import * as pulumi from "@pulumi/pulumi";
import { AdHocBaseEnvComponent } from '../../';

// Create an AWS resource (S3 Bucket)
const adHocBaseEnv = new AdHocBaseEnvComponent('myAdHocEnv', {
  certificateArn: process.env.CERTIFICATE_ARN || 'arn:aws:acm:us-east-1:111111111111:certificate/11111111-1111-1111-1111-111111111111',
  domainName: process.env.DOMAIN_NAME || 'example.com'
});

// should I be exporting the vpc component from awsx, or just the vpcid and read it in another stack?
export const vpc = adHocBaseEnv.vpc;
export const alb = adHocBaseEnv.alb;
export const appSecurityGroup = adHocBaseEnv.appSecurityGroup;
export const serviceDiscoveryNamespace = adHocBaseEnv.serviceDiscoveryNamespace;
export const databaseInstance = adHocBaseEnv.databaseInstance;
export const assetsBucket = adHocBaseEnv.assetsBucket;
export const domainName = adHocBaseEnv.domainName;
export const listener = adHocBaseEnv.listener;
