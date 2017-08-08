const _ = require('lodash')
const Handlebars = require('handlebars')
const Markdown = require('markdown').markdown
const Beautify = require('js-beautify')


class Builder {


	/**
	 * Build a page with its layouts
	 *
	 * @param {Object} page
	 * @param {Object} data
	 * @param {Object} layouts
	 * @return {String}
	 */
	static build(page, data, layouts) {

		// prepare layers to build
		const layers = [page]
		const layersData = [page.data]

		let nextLayer = page.layout
		while(nextLayer) {
			const layer = layouts[nextLayer]
			layers.push(layer)
			layersData.push(layer.data)
			nextLayer = layer.layout
		}

		// prepare final vars
		const vars = _.merge({}, data, ...layersData.reverse())

		// build body for each layers
		let body = null
		layers.forEach(layer => {
			const layerVars = _.merge({}, vars, {$body: body})
			body = Builder.compile(layer, layerVars)
		})

		// beautify html
		return Builder.beautify(body)
	}


	/**
	 * Compile template
	 *
	 * @param {Object} page
	 * @param {Object} vars
	 * @return {String}
	 */
	static compile(page, vars) {
		let body = Handlebars.compile(page.body)(vars)
		if(page.type == 'markdown') body = Markdown.toHTML(body)
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
