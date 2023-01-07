import { ProdBaseEnvComponent } from '../../../src/components/prod/base';

const prodBaseEnv = new ProdBaseEnvComponent('myProdEnv', {
  certificateArn: process.env.ACM_CERTIFICATE_ARN || 'arn:aws:acm:us-east-1:111111111111:certificate/11111111-1111-1111-1111-111111111111',
  domainName: process.env.DOMAIN_NAME || 'example.com'
});

export const vpcId = prodBaseEnv.vpc.vpcId;
export const assetsBucketName = prodBaseEnv.assetsBucket.id;
export const privateSubnetIds = prodBaseEnv.vpc.privateSubnetIds;
export const appSgId = prodBaseEnv.appSecurityGroup.id;
export const albSgId = prodBaseEnv.albSecurityGroup.id;
export const listenerArn = prodBaseEnv.listener.arn;
export const albDnsName = prodBaseEnv.alb.dnsName;
export const rdsAddress = prodBaseEnv.databaseInstance.address;
export const domainName = prodBaseEnv.domainName;
export const baseStackName = prodBaseEnv.stackName;
export const bastionHostInstanceId = prodBaseEnv.bastionHostInstanceId;
export const elastiCacheAddress = prodBaseEnv.elastiCacheCluster.cacheNodes[0].address
