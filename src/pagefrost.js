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
	 * @param {Object} config
	 * @param {Function} log
	 */
	constructor(config, log) {

		this.root = config.root
		this.src = config.src || {}
		this.dest = config. dest
		this.data = config.data || {}
		this.options = config.options || {}
		this.log = log || console.log

		this.layouts = {}
		this.collections = {}
		this.pages = {
			all: {},
			published: {},
			unpublished: {}
		}
	}


	/**
	 * Register built-in pagefrost helpers
	 */
	registerBuiltInHelpers() {
		const folder = `${__dirname}/helpers`
		fs.readdirSync(folder).forEach(helper => this.registerHelper(folder, helper))
	}


	/**
	 * Register all helpers
	 *
	 * @param {Array} helpers
	 */
	registerHelpers(helpers) {
		_.each(helpers, helper => this.registerHelper(`${this.root}/${this.src.helpers}`, helper))
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
		this.log(`Register helper '${name}'`)
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
		Handlebars.registerPartial(name, content.toString())
		this.log(`Register partial '${name}'`)
	}


	/**
	 * Parse all layouts
	 *
	 * @param {Array} templates
	 */
	parseLayouts(templates) {

		// reset list
		this.layouts = {}

		// parse and register layouts
		_.each(templates, template => {

			// parse layout definition
			const layout = Parser.parse(this.src.layouts, template)

			// template does not exist
			const id = layout.meta.id
			if(this.layouts[id]) throw `Layout id '${id}' is already taken`

			// add to layouts list
			this.layouts[id] = layout
			this.log(`Parse layout '${this.src.layouts}/${template}' as '${id}'`)
		})
	}


	/**
	 * Parse all pages
	 *
	 * @param {Array} templates
	 */
	parsePages(templates) {

		// reset lists
		this.collections = {}
		this.pages = {
			all: {},
			published: {},
			unpublished: {}
		}		

		// parse and register pages
		_.each(templates, template => {
			const page = Parser.parse(this.src.pages, template)
			this.registerPage(page)
		})

		const totalParsed = _.size(this.pages.all)
		this.log(`=> ${totalParsed} pages parsed`)
	}


	/**
	 * Add parsed page to lists
	 * 
	 * @param {Object} page 
	 */
	registerPage(page) {

		// error: id already exists
		const id = page.meta.id

		// resolve url
		page.meta.url = (page.data.url || page.meta.dest).replace('index.html', '')
		if(this.options.rewrite_url) page.meta.url = page.meta.url.replace('.html', '')

		// expose data
		page.data.id = page.meta.id
		page.data.url = page.meta.url

		// generate public exposed data
		const exposed = _.cloneDeep(page.data)
		exposed.$meta = _.cloneDeep(page.meta)

		// add to pages list
		this.pages.all[id] = page

		// add to un/published pages list
		if(page.meta.publish) this.pages.published[id] = exposed
		else this.pages.unpublished[id] = exposed

		// add to collections
		if(page.meta.collection && page.meta.publish) {

			// create new collection
			if(!this.collections[page.meta.collection]) {
				this.collections[page.meta.collection] = {}
			}

			this.collections[page.meta.collection][id] = exposed
		}

		this.log(`Parse page '${this.src.pages}/${page.meta.src}' as '${id}'`)
	}


	/**
	 * Build all parsed pages
	 */
	buildPages() {

		_.each(this.pages.all, page => {
			if(page.meta.publish) this.buildPage(page) // render published page
			else this.deletePage(page) // delete unpublished page
		})

		const totalPublished = _.size(this.pages.published)
		const totalUnpublished = _.size(this.pages.unpublished)
		this.log(`=> ${totalPublished} pages published, ${totalUnpublished} pages unpublished`)
	}


	/**
	 * Delete unpublished page
	 * 
	 * @param {Object} page 
	 */
	deletePage(page) {
		const filepath = `${this.dest}/${page.meta.dest}`
		if(fs.existsSync(filepath)) {
			fs.unlinkSync(`${this.dest}/${page.meta.dest}`)
			this.log(`Unpublish '${page.meta.id}'`)
		}
	}


	/**
	 * Build page
	 * 
	 * @param {Object} page 
	 */
	buildPage(page) {

		// generate html
		const html = Builder.build(page, this.layouts, this.data, {
			$meta: page.meta,
			$pages: this.pages.published,
			$collections: this.collections
		})

		// write down page
		fs.writeFileSync(`${this.dest}/${page.meta.dest}`, html)
		this.log(`Publish '${page.meta.id}' -> '${this.dest}/${page.meta.dest}'`)
	}


	/**
	 * Generate htaccess with exposed pages
	 *
	 * @param {Object}
	 */
	writeHtaccess() {

		// write rules
		const htaccess = ['RewriteEngine On']
		_.each(this.pages.all, page => {
			if(page.meta.publish) {
				htaccess.push(`RewriteRule ${this.options.base_url}${page.meta.url} ${page.meta.dest} [L]`)
			}
		})

		// default 404 page : 404.html
		htaccess.push('')
		htaccess.push('ErrorDocument 404 404.html')

		// write file
		fs.writeFileSync(`${this.dest}/.htaccess`, htaccess.join("\n"))
		this.log(`Generate htaccess -> '${this.dest}/.htaccess'`)
	}


	/**
	 * Delete not needed htaccess
	 */
	deleteHtaccess() {
		const filepath = `${this.dest}/.htaccess`
		if(fs.existsSync(filepath)) {
			fs.unlinkSync(filepath)
			this.log(`Delete htaccess`)
		}
	}


	/**
	 * Proceed to frost !
	 *
	 * @param {Object} templates
	 * @return {Object}
	 */
	proceed(templates) {

		// register helpers and partials
		this.registerBuiltInHelpers()
		this.registerHelpers(templates.helpers)
		this.registerPartials(templates.partials)

		// parse pages
		this.parseLayouts(templates.layouts)
		this.parsePages(templates.pages)

		// build pages
		this.buildPages()

		// write htaccess
		if(this.options.rewrite_url) this.writeHtaccess()
		else this.deleteHtaccess()
	}


	/**
	 * Static shorthand
	 * 
	 * @param {Object} templates 
	 * @param {Object} config
	 * @param {Function} log 
	 */
	static run(templates, config, log) {
		return new this(config, log).proceed(templates)
	}


}

module.exports = PageFrost
