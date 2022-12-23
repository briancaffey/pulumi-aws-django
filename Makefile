build:
	yarn build

up:	build
	cd examples/ad-hoc/ && pulumi up



ad-hoc-base-preview:	build
	cd examples/ad-hoc/ && pulumi preview


ad-hoc-base-destroy:	build
	cd examples/ad-hoc/ && pulumi destroy
