const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const FrontMatter = require('front-matter')


class Parser {


	/**
	 * Parse template, extract front-matter and body
	 *
	 * @param {String} template
	 * @return {Object} page object
	 */
	static parse(folder, template) {

		// template does not exists
		const filepath = `${folder}/${template}`
		if(!fs.existsSync(filepath)) throw `Template '${filepath}' does not exist`

		// read template content and parse front matter
		const content = fs.readFileSync(filepath).toString()
		const meta = new FrontMatter(content)

		// resolve page attributes
		const page = Parser.resolve(template, meta)

		// clean body
		page.body = meta.body.trim()

		return page
	}


	/**
	 * Resolve page attributes from front-matter
	 *
	 * @param {String} template
	 * @param {Object} meta
	 * @return {Object}
	 */
	static resolve(template, meta) {

		// prepare page object
		const page = {}

		// resolve path
		page.src = template
		page.dest = template.replace('.md', '.html') // 'foo/bar.md' -> 'foo/bar.html'
		page.url = page.dest // alias

		// resolve type
		page.ext = path.extname(template) // 'foo/bar.md' -> '.md'
		page.type = (page.ext === '.md') ? 'markdown' : 'html'

		// resolve id
		page.id = meta.attributes.id || template.replace(page.ext, '').replace('/', '_') // 'foo/bar.md' -> 'foo_bar'

		// resolve layout, tag and publish state
		page.layout = meta.attributes.layout
		page.tag = meta.attributes.tag
		page.publish = !(meta.attributes.publish === false)

		// build meta (dot notation, allow `foo.bar` as foo{bar})
		page.data = {}
		_.each(meta.attributes, (value, attr) => {
			if(typeof value == 'object') _.merge(page.data[attr], value)
			else _.set(page.data, attr, value)
		})

		return page
	}


}

module.exports = Parser
