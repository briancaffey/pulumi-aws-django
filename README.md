# pulumi-aws-django

This is a library for deploying Django applications to AWS using ECS Fargate. It is currently under active development.

There are similar libraries for CDK and Terraform:

- [github.com/briancaffey/cdk-django](https://github.com/briancaffey/cdk-django)
- [github.com/briancaffey/terraform-aws-django](https://github.com/briancaffey/terraform-aws-django)

For more information about this library, see this article: [https://briancaffey.github.io/2022/06/26/i-deployed-the-same-containerized-serverless-django-application-with-aws-cdk-and-terraform](https://briancaffey.github.io/2022/06/26/i-deployed-the-same-containerized-serverless-django-application-with-aws-cdk-and-terraform)

## Release Process

Releases are managed by `release-please`. The following secrets have been added to this GitHub repository:

- NPM_TOKEN (npm API key)
- GH_PAT (GitHub Personal Access Token with the ability to update workflows)
