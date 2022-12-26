build:
	yarn build

ad-hoc-base-preview:	build
	pulumi -C examples/ad-hoc/base --stack dev --non-interactive preview

ad-hoc-base-up:	build
	pulumi -C examples/ad-hoc/base --non-interactive up --yes

ad-hoc-base-destroy:	build
	pulumi -C examples/ad-hoc/base --stack dev --non-interactive destroy --yes

ad-hoc-app-preview:	build
	pulumi -C examples/ad-hoc/app --stack alpha --non-interactive preview

ad-hoc-app-up:	build
	pulumi -C examples/ad-hoc/app --non-interactive up --yes

ad-hoc-app-destroy:	build
	pulumi -C examples/ad-hoc/app --stack alpha --non-interactive destroy --yes
