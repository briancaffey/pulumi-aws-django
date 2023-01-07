build:
	yarn build

ad-hoc-base-init:	build
	pulumi -C examples/ad-hoc/base stack init dev

ad-hoc-base-preview:	build
	pulumi -C examples/ad-hoc/base --stack dev --non-interactive preview

ad-hoc-base-up:	build
	pulumi -C examples/ad-hoc/base --non-interactive up --yes

ad-hoc-base-refresh:	build
	pulumi -C examples/ad-hoc/base --non-interactive refresh --yes

ad-hoc-base-destroy:	build
	pulumi -C examples/ad-hoc/base --stack dev --non-interactive destroy --yes

ad-hoc-base-rm:	build
	pulumi -C examples/ad-hoc/base stack rm dev --yes

ad-hoc-app-preview:	build
	pulumi -C examples/ad-hoc/app --stack alpha --non-interactive preview

ad-hoc-app-preview-diff:	build
	pulumi -C examples/ad-hoc/app --stack alpha --non-interactive preview --diff

ad-hoc-app-up:	build
	pulumi -C examples/ad-hoc/app --non-interactive up --yes

ad-hoc-app-destroy:	build
	pulumi -C examples/ad-hoc/app --stack alpha --non-interactive destroy --yes
