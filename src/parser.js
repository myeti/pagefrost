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
		const fm = Parser.frontmatter(filepath)

		// resolve page attributes
		return Parser.resolve(template, fm.attributes, fm.body)
	}


	/**
	 * Read front-matter metadata
	 * 
	 * @param {String} filepath
	 * @return {Object} 
	 */
	static frontmatter(filepath) {
		const content = fs.readFileSync(filepath).toString()
		return new FrontMatter(content)
	}


	/**
	 * Resolve page attributes from front-matter
	 *
	 * @param {String} template
	 * @param {Object} attrs
	 * @return {Object}
	 */
	static resolve(template, attrs, body) {
		return {
			data: Parser.mergeVars(attrs),
			meta: Parser.resolveMeta(attrs, template),
			body: Parser.cleanBody(body)
		}
	}


	/**
	 * Merge vars
	 * 
	 * @param {Object} attrs 
	 * @return {Object}
	 */
	static mergeVars(attrs) {

		const data = {}

		_.each(attrs, (value, attr) => {
			if(typeof value == 'object') _.merge(data[attr], value) // recursively merge object
			else _.set(data, attr, value) // dot notation: 'foo.bar' -> foo: { bar }
		})

		return data
	}


	/**
	 * Resolve meta data
	 * 
	 * @param {Object} attrs 
	 * @param {String} template 
	 * @return {Object}
	 */
	static resolveMeta(attrs, template) {

		const meta = {}

		meta.src = template // 'foo/bar.md'
		meta.dest = template.replace('.md', '.html') // 'foo/bar.md' -> 'foo/bar.html'
		meta.ext = path.extname(template) // 'foo/bar.md' -> '.md'
		meta.id = attrs.id || template.replace(meta.ext, '').replace('/', '_') // 'foo/bar.md' -> 'foo_bar'
		meta.type = (meta.ext === '.md') ? 'markdown' : 'html'
		meta.layout = attrs.layout
		meta.category = attrs.category
		meta.publish = !(attrs.publish === false)

		return meta
	}


	/**
	 * Sanitize body
	 * 
	 * @param {String} body 
	 * @return {String}
	 */
	static cleanBody(body) {
		return body.trim()
	}


}

module.exports = Parser
