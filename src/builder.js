const _ = require('lodash')
const Handlebars = require('handlebars')
const Markdown = require('markdown').markdown
const Beautify = require('js-beautify')


class Builder {


	/**
	 * Build a page with its layouts
	 *
	 * @param {Object} page
	 * @param {Object} layouts
	 * @param {Object} preVars
	 * @param {Object} postVars
	 * @return {String}
	 */
	static build(page, layouts, preVars, postVars) {

		// compose layers to build
		const {layers, vars} = Builder.compose(page, layouts)

		// prepare final vars
		const finalVars = _.merge({}, preVars, vars, postVars)

		// build body for each layers
		const body = Builder.compile(layers, finalVars)

		// beautify html
		return Builder.beautify(body)
	}


	/**
	 * Compose layers
	 * 
	 * @param {Object} page
	 * @param {Object} layouts
	 * @return {Object}
	 */
	static compose(page, layouts) {

		// add page as first layer
		const layers = [page]
		const layersVars = [page.data]

		// add layouts to layers
		let nextLayout = page.meta.layout
		while(nextLayout) {
			const layout = layouts[nextLayout]
			layers.push(layout)
			layersVars.push(layout.data)
			nextLayout = layout.meta.layout
		}

		// merge data
		const vars = _.merge({}, ...layersVars.reverse())

		return {layers, vars}
	}


	/**
	 * Compile all layers
	 * 
	 * @param {Array} layers 
	 * @param {Object} vars 
	 * @return {String}
	 */
	static compile(layers, vars) {

		let body = null
		layers.forEach(layer => {
			const layerVars = _.merge({}, vars, {$body: body})
			body = Builder.render(layer, layerVars)
		})

		return body
	}


	/**
	 * Compile template
	 *
	 * @param {Object} page
	 * @param {Object} vars
	 * @return {String}
	 */
	static render(page, vars) {

		let body = Handlebars.compile(page.body)(vars) // render handlebars
		if(page.meta.type == 'markdown') body = Markdown.toHTML(body) // rendere markdown

		return body
	}


	/**
	 * Tidy and beautify html code
	 *
	 * @param {String} html
	 * @return {String}
	 */
	static beautify(html) {
		return Beautify.html(html, {
			indent_size: 2,
			preserve_newlines: true,
			indent_inner_html: true
		})
	}


}

module.exports = Builder
