# Changelog

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
