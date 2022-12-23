import * as pulumi from "@pulumi/pulumi";
import { AdHocBaseEnvComponent } from '../../';

// Create an AWS resource (S3 Bucket)
const adHocBaseEnv = new AdHocBaseEnvComponent('myAdHocEnv', {
})

// certificateArn: process.env.CERTIFICATE_ARN || 'arn:aws:acm:region:account:certificate/certificate_ID',
// domainName: process.env.DOMAIN_NAME || 'example.com'