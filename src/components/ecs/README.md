# `ad-hoc`

This directory contains components for ad hoc `base` environments and ad hoc `app` environments.

A ad hoc `base` environment contains resources that are shared by ad hoc `app` environments that do not change frequently, including:

- VPC
- Assets bucket
- ALB SG
- App SG
- Load Balancer
- RDS
  - RDS SG
  - DB Subnet Group
  - Secrets Manager Secret for RDS
  - RDS Instance

An ad hoc `app` environment contains resources that are specific to an ad hoc app instance. These environments contain use resources from an ad hoc `base` environment and they include:

- ECR Repository (lookup)
- ECR Image
- ECS Cluster
- Environment variables
- ECS roles
- Hosted Zone
- CNAME Record
- Redis Service
- Api Service
- Frontend Service
- Celery Default Service
- Celery Beat Service
- Backend Update Task