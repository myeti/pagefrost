const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')

const Parser = require('./parser')
const Builder = require('./builder')


class PageFrost {


	/**
	 * New PageFront instance
	 *
	 * @param {Object} src {templates, layouts, partials, helpers}
	 * @param {String} dest
	 * @param {Object} data
	 * @param {Object} options {base_url, rewrite_url}
	 */
	constructor(src, dest, data, options) {

		this.src = src
		this.dest = dest
		this.data = data
		this.options = options

		this.layouts = {}
		this.pages = {}
		this.published = {}
		this.tags = {}

		this.builtInHelpers = ['loop', 'url']
	}


	/**
	 * Register built-in pagefrost helpers
	 */
	registerBuiltInHelpers() {
		this.builtInHelpers.forEach(helper => {
			this.registerHelper(`${__dirname}/helpers`, `${helper}.js`)
		})
	}


	/**
	 * Register all helpers
	 *
	 * @param {Array} helpers
	 */
	registerHelpers(helpers) {
		_.each(helpers, helper => this.registerHelper(this.src.helpers, helper))
	}


	/**
	 * Register hamdlebars helper
	 *
	 * @param {String} folder
	 * @param {String} helper
	 */
	registerHelper(folder, helper) {
		const name = path.basename(helper).replace('.js', '') // 'folder/helper-name.js -> 'helper-name'
		const factory = require(`${folder}/${helper}`)
		Handlebars.registerHelper(name, factory(Handlebars, this.options))
	}


	/**
	 * Register all partials
	 *
	 * @param {Array} partials
	 */
	registerPartials(partials) {
		_.each(partials, partial => this.registerPartial(this.src.partials, partial))
	}


	/**
	 * Register handlebars partial
	 *
	 * @param {String} folder
	 * @param {String} partial
	 */
	registerPartial(folder, partial) {
		const name = partial.replace('.html', '') // 'foo/bar.html' -> {{> foo/bar}}
		const content = fs.readFileSync(`${folder}/${partial}`)
		Handlebars.registerPartial(name, content)
	}


	/**
	 * Parse all layouts
	 *
	 * @param {Array} layouts
	 */
	parseLayouts(layouts) {

		// reset list
		this.layouts = {}

		// parse and register layouts
		_.each(layouts, layout => {

			// parse layout definition
			const parsed = Parser.parse(this.src.layouts, layout)
			if(this.layouts[parsed.id]) throw `Layout id '${parsed.id}' is already taken`

			// add to layouts list
			this.layouts[parsed.id] = parsed
		})
	}


	/**
	 * Parse all templates
	 *
	 * @param {Array} templates
	 */
	parseTemplates(templates) {

		// reset lists
		this.pages = {}
		this.published = {}
		this.tags = {}

		// parse and register pages
		_.each(templates, template => {

			// parse page definition
			const parsed = Parser.parse(this.src.pages, template)
			if(this.pages[parsed.id]) throw `Page id '${parsed.id}' is already taken`

			// apply rewrite url rule
			if(this.options.rewrite_url) {
				parsed.url = parsed.url.replace(parsed.ext, '')
			}

			// add to pages list
			this.pages[parsed.id] = parsed

			// add to published pages list
			if(parsed.publish) {
				this.published[parsed.id] = parsed
			}

			// add to published tags list
			if(parsed.tag && parsed.publish) {
				if(!this.tags[parsed.tag]) this.tags[parsed.tag] = {}
				this.tags[parsed.tag][parsed.id] = parsed
			}
		})
	}


	/**
	 * Build all parsed pages
	 *
	 * @return {Tuple}
	 */
	buildPages() {

		// reset stats
		let built = 0
		let ignored = 0

		// build all published pages
		_.each(this.pages, page => {

			// delete unpublished file
			if(!page.publish) {
				ignored++
				fs.unlinkSync(`${this.dest}/${page.dest}`)
				return;
			}

			// prepare global vars
			const data = _.merge({}, this.data, {
				$page: _.omit(page, 'body'),
				$pages: this.published,
				$tags: this.tags
			})

			// generate html
			const html = Builder.build(page, data, this.layouts)

			// write down page
			fs.writeFileSync(`${this.dest}/${page.dest}`, html)
			built++
		})

		return {built, ignored}
	}


	/**
	 * Generate htaccess with exposed pages
	 *
	 * @param {Object}
	 */
	writeHtaccess() {

		// write rules
		const htaccess = ['RewriteEngine On']
		_.each(this.published, page => {
			htaccess.push(`RewriteRule ${this.options.base_url}${page.url} ${page.dest} [L]`)
		})

		// write file
		return fs.writeFileSync(`${this.dest}/.htaccess`, htaccess.join("\n"))
	}


	/**
	 * Proceed to frost !
	 *
	 * @param {Array} templates
	 * @param {Array} layouts
	 * @param {Array} partials
	 * @param {Array} helpers
	 * @return {Object}
	 */
	proceed(templates, layouts, partials, helpers) {

		// register helpers and partials
		this.registerBuiltInHelpers()
		this.registerHelpers(helpers)
		this.registerPartials(partials)

		// parse pages
		this.parseLayouts(layouts)
		this.parseTemplates(templates)

		// build pages
		const stats =  this.buildPages()

		// write htaccess
		if(this.options.rewrite_url) this.writeHtaccess()

		return stats
	}


}

module.exports = PageFrost
