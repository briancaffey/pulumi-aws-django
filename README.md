# pulumi-aws-django

This is a library for deploying Django applications to AWS using ECS Fargate.

## About

`pulumi-aws-django` aims to demonstrate best-practices for building web applications in AWS cloud. Executing the code in this project will build cloud resources such as networks, servers and databases that power a web application that can run securely on the public internet.

You don't need to use this library directly in your code. It is recommended that you use this repo as a guide. It includes common patterns that are used when working with Infrastructure as Code.

### Companion application

This project has a companion repo that contains a Django (Python) web application backend and a Nuxt.js frontend site (server-rendered Vue.js written in TypeScript). This project can be found here:

[https://github.com/briancaffey/django-step-by-step/](https://github.com/briancaffey/django-step-by-step/)

### Related projects

This project is has been written with the two other main Infrastructure as Code tools: Terraform and CDK. You can find these repos here:

- [terraform-aws-django](https://github.com/briancaffey/terraform-aws-django)
- [cdk-django](https://github.com/briancaffey/cdk-django)

## Getting started with examples

First install Pulumi:

```
brew install pulumi/tap/pulumi
```

Then authenticate with:

```
pulumi login
```

## Prerequisites

Using this repo assumes that you have the following:

- a domain name (e.g. example.com)
- a Route 53 public hosted zone for a domain name
- an Amazon Certificate Manager certificate that covers (`*.example.com`)
- an AWS AIM role for deploying infrastructure via GitHub Actions (Terraform code in this repo for creating the least-privilege role coming soon!)

## Usage

First you deploy the `base` stack, then you deploy the `app` stack.

The `base` stack deploys long-lived resources that shouldn't need to be updated frequently, these include:

- VPC
- ElastiCache
- S3
- Security Groups
- Load balancer
- RDS

The `app` stack deploys resources primarily for ECS services that run the application processes, these include:

- ECS cluster for the environment
- web-facing services (for running gunicorn and for running the frontend UI app)
- celery worker for asynchronous task processing
- celery beat for scheduled tasks
- management_command for running migrations and other "pre-update" tasks (collectstatic, loading fixtures, etc.)
- All backend environment variables are configured here (shared between all backend services)
- Route 53 record for the environment (e.g. `<env_name>.example.com`)
- IAM resources (this might be able to be moved to the base stack)

### Local Examples

It is best to deploy cloud infrastructure with automated pipelines that execute Infrastructure as Code. For testing and development you can deploy locally.

First, export environment variables:

```
export DOMAIN_NAME=example.com
export CERTIFICATE_ARN=arn:aws:acm:us-east-1:111111111111:certificate/11111111-1111-1111-1111-111111111111
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=abc
export AWS_SESSION_TOKEN=123
export COMPANY_NAME=abc
export AWS_ACCOUNT_ID=123456789
```

The `Makefile` documents the commands that can be used to set up infrastructure. Here are the commands that can be used to create and destroy the base layer of infrastructure.

```Makefile
build:
	yarn build

ecs-base-init:	build
	pulumi -C examples/ecs/base stack init dev

ecs-base-preview:	build
	pulumi -C examples/ecs/base --stack dev --non-interactive preview

ecs-base-up:	build
	pulumi -C examples/ecs/base --non-interactive up --yes

ecs-base-refresh:	build
	pulumi -C examples/ecs/base --non-interactive refresh --yes

ecs-base-destroy:	build
	pulumi -C examples/ecs/base --stack dev --non-interactive destroy --yes

ecs-base-rm:	build
	pulumi -C examples/ecs/base stack rm dev --yes
```

There are similar commands for building the `app` stack infrastructure.

### GitHub Actions

TODO - add a section here about using this repo with GitHub Actions

## Release Process for `pulumi-aws-django`

Releases are managed by `release-please`. The following secrets have been added to this GitHub repository:

- NPM_TOKEN (npm API key)
- GH_PAT (GitHub Personal Access Token with the ability to update workflows)

Pushes to main will update a PR with changes in `CHANGELOG.md` and `package*.json`. Merging this PR creates a new version (e.g. `v1.2.3`).

## TODO

Add a stack that includes:

- AIM role with permission to create base and app stacks (least-privilege)
- ECR repositories with lifecycle rules
- Hosted zone
- ACM certificate
