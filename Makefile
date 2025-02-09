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

ecs-app-preview:	build
	pulumi -C examples/ecs/app --stack alpha --non-interactive preview

ecs-app-preview-diff:	build
	pulumi -C examples/ecs/app --stack alpha --non-interactive preview --diff

ecs-app-up:	build
	pulumi -C examples/ecs/app --non-interactive up --yes

ecs-app-destroy:	build
	pulumi -C examples/ecs/app --stack alpha --non-interactive destroy --yes

prod-base-preview:	build
	pulumi -C examples/prod/base --stack stage --non-interactive preview

prod-base-up:	build
	pulumi -C examples/prod/base --stack stage --non-interactive up --yes

prod-base-destroy:	build
	pulumi -C examples/prod/base --stack stage --non-interactive destroy --yes

prod-app-preview:	build
	pulumi -C examples/prod/app --stack stage --non-interactive preview

prod-app-preview-diff:	build
	pulumi -C examples/prod/app --stack stage --non-interactive preview --diff

prod-app-up:	build
	pulumi -C examples/prod/app --stack stage --non-interactive up --yes

prod-app-destroy:	build
	pulumi -C examples/prod/app --stack stage --non-interactive destroy --yes
