
build: components index.js sldr.styl template.js
	@component build --dev --use component-styl

template.js: template.html
	@component convert $<

components: component.json
	@component install --dev

test: build
	@component test browser

clean:
	rm -fr dist build components template.js

dist: build
	@component build --use component-styl --standalone Slidr -o dist -n slidr.dist

.PHONY: clean
