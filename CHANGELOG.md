# Changelog

## [1.28.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.27.0...v1.28.0) (2025-02-10)


### Features

* **docs:** update readme.md ([8cae247](https://github.com/briancaffey/pulumi-aws-django/commit/8cae247d4c63d2c2188d0ce081ce520f19aceff1))
* **ecs:** refactor ecs components and remove ad hoc component and example ([b3ae298](https://github.com/briancaffey/pulumi-aws-django/commit/b3ae2986f631bfee20763d6068dc1eaf901ba83a))
* **rds:** update rds component to use secrets manager secret ([d1f80b0](https://github.com/briancaffey/pulumi-aws-django/commit/d1f80b00c13900243c1f9641afd3488562b05dcf))


### Bug Fixes

* **deps:** update dependencies for example Pulumi projects ([04dc94c](https://github.com/briancaffey/pulumi-aws-django/commit/04dc94cf392d25605688be7ae5a24632267cc40e))
* **docs:** remove references to ad hoc environments ([70c4063](https://github.com/briancaffey/pulumi-aws-django/commit/70c40633a2afef031297c20f3a65d2edd8fc91f8))
* **ecs:** fix order of env vars to avoid large diffs in pulumi preview ([ad25c9d](https://github.com/briancaffey/pulumi-aws-django/commit/ad25c9d334bc93322788e7b18045f05f229d588b))
* **ecs:** fixes for ecs base and app components ([c466e3c](https://github.com/briancaffey/pulumi-aws-django/commit/c466e3c8779ffd74cbdbb87e1e2741f08c966548))
* **ecs:** remove unused code ([b236769](https://github.com/briancaffey/pulumi-aws-django/commit/b236769b8cb5e8d71a18a787602abfb79b62e3be))
* **elasticache:** fix issue with elasticache output and remove prod components ([e435671](https://github.com/briancaffey/pulumi-aws-django/commit/e4356713fa285106fc6058d387462ea0f44a93f7))
* **rds:** add rds password secret name output to base component ([2faf9cd](https://github.com/briancaffey/pulumi-aws-django/commit/2faf9cda1c7761ce508a074a24f33de00b304aca))
* **rds:** set recoveryWindowInDays to 0 ([ffda59f](https://github.com/briancaffey/pulumi-aws-django/commit/ffda59f30aba76a22d8cad44290080715e97f929))
* **sg:** fix alb security group by referencing correct sg ([1cad6fa](https://github.com/briancaffey/pulumi-aws-django/commit/1cad6fa7fcbd1099a82f043bfff75af2cca3d36d))
* **web-ui:** add backend api base to env vars for web-ui container ([7291180](https://github.com/briancaffey/pulumi-aws-django/commit/7291180305eb3327a6c6293162c5c68c1ce8a63d))

## [1.27.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.26.0...v1.27.0) (2025-01-27)


### Features

* **upgrade:** upgrade all dependencies to latest versions ([ff1019b](https://github.com/briancaffey/pulumi-aws-django/commit/ff1019b8eabd5481882007fdd13f6f7828f7756a))

## [1.26.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.25.0...v1.26.0) (2023-03-28)


### Features

* **parameter-group:** add parameter group with force_ssl turned on ([802ca65](https://github.com/briancaffey/pulumi-aws-django/commit/802ca6518cba92e0721e5321c057b1d8868369e3))

## [1.25.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.24.0...v1.25.0) (2023-03-26)


### Features

* **nginx-web:** add component for ecs web service that uses nginx as a sidecar for end-to-end encryption ([2d93bac](https://github.com/briancaffey/pulumi-aws-django/commit/2d93bac59d4a46c736afa32111a12625501db0ef))
* **tg:** add name property for target group in web component ([b0a5825](https://github.com/briancaffey/pulumi-aws-django/commit/b0a5825651460ed31308560329335155dbf61e54))

## [1.24.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.23.0...v1.24.0) (2023-03-19)


### Features

* **login:** remove npm login command ([8e21dd0](https://github.com/briancaffey/pulumi-aws-django/commit/8e21dd008cd50c68d5434952c9975f18710adcdf))

## [1.23.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.22.0...v1.23.0) (2023-03-19)


### Features

* **gha:** add env var for NPM_TOKEN from repo secret ([95af22e](https://github.com/briancaffey/pulumi-aws-django/commit/95af22e50a9fa196234551ae9827b45fc0fc612b))

## [1.22.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.21.0...v1.22.0) (2023-03-19)


### Features

* **npm:** add verbose loglevel ([94c3b48](https://github.com/briancaffey/pulumi-aws-django/commit/94c3b4891ea98d367d89589ca91017d700907729))

## [1.21.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.20.0...v1.21.0) (2023-03-17)


### Features

* **npm:** add npm login command ([5a624f4](https://github.com/briancaffey/pulumi-aws-django/commit/5a624f4cd755590962ac35dbb90968247d1a1e2c))

## [1.20.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.19.0...v1.20.0) (2023-03-17)


### Features

* **token:** change npm token to use classic automation token type ([8ad2b32](https://github.com/briancaffey/pulumi-aws-django/commit/8ad2b328280db6bcb7971ed221998903e6c3f8a0))

## [1.19.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.18.0...v1.19.0) (2023-03-17)


### Features

* **npm:** add npm login for publish action ([1c03c3e](https://github.com/briancaffey/pulumi-aws-django/commit/1c03c3e79eb7262e409d3205e09f41c8932be0d1))

## [1.18.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.17.1...v1.18.0) (2023-03-17)


### Features

* **release:** test release and publishing triggers ([4426b88](https://github.com/briancaffey/pulumi-aws-django/commit/4426b8813764445e4e5e6bce0d202a0b5745989b))

## [1.17.1](https://github.com/briancaffey/pulumi-aws-django/compare/v1.17.0...v1.17.1) (2023-02-26)


### Bug Fixes

* **publish:** fix npm publish command ([fd32945](https://github.com/briancaffey/pulumi-aws-django/commit/fd329450bb73bce9ae0662be62b6bc272700071a))

## [1.17.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.16.0...v1.17.0) (2023-02-26)


### Features

* **gha:** update publish workflow ([36d1081](https://github.com/briancaffey/pulumi-aws-django/commit/36d1081f5e7f956d2dff7453b71e4e444a29aede))

## [1.16.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.15.0...v1.16.0) (2023-01-17)


### Features

* **pulumi:** update pulumi package version to ^3.51.0 ([efc3ae5](https://github.com/briancaffey/pulumi-aws-django/commit/efc3ae54128b1047f27e494640fdf0eeea03c006))

## [1.15.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.14.0...v1.15.0) (2023-01-17)


### Features

* **publish:** fix publish workflow ([90c5d04](https://github.com/briancaffey/pulumi-aws-django/commit/90c5d04841c03587a0dfcbd22297b2b4f780b182))

## [1.14.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.13.0...v1.14.0) (2023-01-17)


### Features

* **releases:** add GH_PAT to release-please workflow ([60b7654](https://github.com/briancaffey/pulumi-aws-django/commit/60b7654eefb82a7c012235126db0828689655e9d))

## [1.13.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.12.1...v1.13.0) (2023-01-15)


### Features

* **docs:** update docs on release process ([31e51f5](https://github.com/briancaffey/pulumi-aws-django/commit/31e51f59045cf741599c11c4ad1cd43b0850555b))
* **gha:** debug release process ([b23d02d](https://github.com/briancaffey/pulumi-aws-django/commit/b23d02daa421e4d04c9dbf632fcc0ddbcac5c469))


### Bug Fixes

* **release:** add GH PAT to release-please workflow ([dd1c99c](https://github.com/briancaffey/pulumi-aws-django/commit/dd1c99c1567c84628a9130467b864264f5712c6c))

## [1.12.1](https://github.com/briancaffey/pulumi-aws-django/compare/v1.12.0...v1.12.1) (2023-01-08)


### Bug Fixes

* **gha:** fix tag pattern in gha ([3e07277](https://github.com/briancaffey/pulumi-aws-django/commit/3e0727780088c4e2fcdaf50f021e2712e18c03c4))

## [1.12.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.11.0...v1.12.0) (2023-01-08)


### Features

* **gha:** add gha workflow for publishing tagged version to npm ([f58b9e0](https://github.com/briancaffey/pulumi-aws-django/commit/f58b9e0f952767971db14a5e21d3ba9850d11e2c))


### Bug Fixes

* **makefile:** fix path in makefile command ([c6d4c15](https://github.com/briancaffey/pulumi-aws-django/commit/c6d4c15bf8944eda421b0d66319a888200444027))

## [1.11.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.10.0...v1.11.0) (2023-01-07)


### Features

* **ad-hoc:** complete example of ad hoc base and app environment and add celery beat service ([fe8ab42](https://github.com/briancaffey/pulumi-aws-django/commit/fe8ab42b2666f81b7e5cacb557fd1cece5be3f06))
* **autoscaling:** add autoscaling resources for api and worker service ([27097a6](https://github.com/briancaffey/pulumi-aws-django/commit/27097a61ab7ada5da1bc570d69112e8447202fcd))
* **config:** add config to ad hoc app example ([cbe60cf](https://github.com/briancaffey/pulumi-aws-django/commit/cbe60cfe23102a3674ae03ecde3ef7d95e8844b3))
* **examples:** completed prod infrastructure examples for base and app ([7fe77a9](https://github.com/briancaffey/pulumi-aws-django/commit/7fe77a96778812fa9d239d41cd56af89b9ba6ed2))
* **prod:** add elasticache and base and app components for prod infrastructure stacks ([94611b3](https://github.com/briancaffey/pulumi-aws-django/commit/94611b3c1dc1c85af60632660f0c6aa2a020b524))
* **readme:** add readme with links to other libraries ([e128402](https://github.com/briancaffey/pulumi-aws-django/commit/e1284026ed2903598763ad6fe1294e895f008429))

## [1.10.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.9.0...v1.10.0) (2023-01-01)


### Features

* **refactor:** refactor ad hoc base component ([4621575](https://github.com/briancaffey/pulumi-aws-django/commit/4621575fb879ea85f6eaabde552179a04a58e0c5))
* **refactor:** refactor dependency graph, cloudwatch abstractions, ecs cluster abstractions added ([9d65b02](https://github.com/briancaffey/pulumi-aws-django/commit/9d65b02545671b6f382244dfdac44e6f836766ed))


### Bug Fixes

* **bastion:** fix bastionHostUserData string by using pulumi.interpolate ([37835f9](https://github.com/briancaffey/pulumi-aws-django/commit/37835f92f6a2ab55fbf26f74fcf18051cb5504b1))

## [1.9.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.8.0...v1.9.0) (2022-12-30)


### Features

* **bastion:** add bastion host and related resources ([fec4410](https://github.com/briancaffey/pulumi-aws-django/commit/fec44102dd7066e1afcd64b8bf1a9369898596ef))

## [1.8.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.7.2...v1.8.0) (2022-12-30)


### Features

* **tags:** add autotagging to ad hoc base and app components ([d31d3cd](https://github.com/briancaffey/pulumi-aws-django/commit/d31d3cd4626709cbbfa2362683479cb58d825741))

## [1.7.2](https://github.com/briancaffey/pulumi-aws-django/compare/v1.7.1...v1.7.2) (2022-12-30)


### Bug Fixes

* **repo:** add root index.ts file that exposes components at top level ([b13c558](https://github.com/briancaffey/pulumi-aws-django/commit/b13c5583dceea4dcf2ba5c82cb00ac0146a87ec2))

## [1.7.1](https://github.com/briancaffey/pulumi-aws-django/compare/v1.7.0...v1.7.1) (2022-12-30)


### Bug Fixes

* **protocol:** add protocol to default tg health check ([7798a7b](https://github.com/briancaffey/pulumi-aws-django/commit/7798a7b0bcea1533a4addf478c401d9a7032593b))

## [1.7.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.6.0...v1.7.0) (2022-12-30)


### Features

* **s3:** add assets bucket to app stack from base stack ([4ac798c](https://github.com/briancaffey/pulumi-aws-django/commit/4ac798c2b97cb5453a919c21fddf317f61e90962))

## [1.6.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.5.0...v1.6.0) (2022-12-30)


### Features

* **environment:** fix all issues with environment variables ([8d41b6f](https://github.com/briancaffey/pulumi-aws-django/commit/8d41b6fb6eaefb3b01de8674d21d4d9ffaa77a78))

## [1.5.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.4.0...v1.5.0) (2022-12-29)


### Features

* **inputs-ouputs:** fix issues with pulumi inputs and outputs ([6dc7bb5](https://github.com/briancaffey/pulumi-aws-django/commit/6dc7bb515669c5ce8ddd3e1e4e8ea44ec658c772))

## [1.4.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.3.0...v1.4.0) (2022-12-28)


### Features

* **adhoc:** finish basic ad hoc environment with base and app components ([b63ecf5](https://github.com/briancaffey/pulumi-aws-django/commit/b63ecf5c340cf78dd85b3502a99f3fbfa39cdaf7))

## [1.3.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.2.0...v1.3.0) (2022-12-26)


### Features

* **app:** set up initial app component and refactor examples dir ([b4c2467](https://github.com/briancaffey/pulumi-aws-django/commit/b4c24676560a5ea6c89938749001ac6cbeb49390))

## [1.2.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.1.0...v1.2.0) (2022-12-24)


### Features

* **base:** finish first draft of ad hoc base component ([dc624b0](https://github.com/briancaffey/pulumi-aws-django/commit/dc624b0517c3b44409686ca93c13b38fc69dd959))

## [1.1.0](https://github.com/briancaffey/pulumi-aws-django/compare/v1.0.0...v1.1.0) (2022-12-23)


### Features

* **example:** add example and makefile targets for pulumi up and destroy ([5745347](https://github.com/briancaffey/pulumi-aws-django/commit/5745347f6779ecd17c7744bcaf9087f368849f9d))

## 1.0.0 (2022-12-22)


### Features

* add type to package json ([6c19c99](https://github.com/briancaffey/pulumi-aws-django/commit/6c19c99f089ae20cb557d368172cba42db98f9c2))
* change export statement in index.ts ([74ba720](https://github.com/briancaffey/pulumi-aws-django/commit/74ba720f9f7a745d240db81ef47648481e4e1443))
* initial ([b44aa7d](https://github.com/briancaffey/pulumi-aws-django/commit/b44aa7d5f4faa10e49d2a82b6b44647800ef1092))
* **initial:** initial commit ([8ff40ef](https://github.com/briancaffey/pulumi-aws-django/commit/8ff40ef75ed23a928b3851609a39f956bcc8b622))
* **main:** add main property to package.json referencing ./bin/index.js ([3668240](https://github.com/briancaffey/pulumi-aws-django/commit/36682407bfcb1c40329bc1e6144b5922566acbd0))
* **refactor:** refactor project structure ([cdf11c5](https://github.com/briancaffey/pulumi-aws-django/commit/cdf11c53589b7f944891dbca03f27cb14e5cdf2d))
* **types:** add types to package.json ([d5a301a](https://github.com/briancaffey/pulumi-aws-django/commit/d5a301a754ce4102046f33f3b949af4b1fa9a9e0))
* **v1:** prepare repo for publishing to npm ([f40663c](https://github.com/briancaffey/pulumi-aws-django/commit/f40663cc96410961f7a8dc4b687833eeec1fb0cc))
* **yarn:** update yarn.lock ([77110eb](https://github.com/briancaffey/pulumi-aws-django/commit/77110eb6ed8b7b7d91a331e27b0e293ca39f526b))
