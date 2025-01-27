# pulumi-aws-django

This is a library for deploying Django applications to AWS using ECS Fargate.

## Getting started with examples

```
brew install pulumi/tap/pulumi
```

This repo contains two examples: `ad-hoc` and `base`.

The `Makefile` documents commands for setting up these environments:

```
ad-hoc-base-init
ad-hoc-base-preview
ad-hoc-base-up
ad-hoc-base-refresh
ad-hoc-base-destroy
ad-hoc-base-rm
```

There are similar libraries for CDK and Terraform:

- [github.com/briancaffey/cdk-django](https://github.com/briancaffey/cdk-django)
- [github.com/briancaffey/terraform-aws-django](https://github.com/briancaffey/terraform-aws-django)

For more information about this library, see this article: [https://briancaffey.github.io/2022/06/26/i-deployed-the-same-containerized-serverless-django-application-with-aws-cdk-and-terraform](https://briancaffey.github.io/2022/06/26/i-deployed-the-same-containerized-serverless-django-application-with-aws-cdk-and-terraform)

## Release Process

Releases are managed by `release-please`. The following secrets have been added to this GitHub repository:

- NPM_TOKEN (npm API key)
- GH_PAT (GitHub Personal Access Token with the ability to update workflows)

## Testing Release and Publishing Triggers

- Using an npm token (Classic token with Automation option selected)