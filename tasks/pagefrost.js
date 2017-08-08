module.exports = function(grunt) {

	const _ = require('lodash')
	const path = require('path')
	const pkg = require('../package.json')
	const PageFrost = require('../src/pagefrost')

	grunt.registerMultiTask(pkg.name, pkg.description, function(){

		// load config
		const config = _.merge({
			root: process.cwd(),
			data: {},
			options: {
				baseurl: '',
				rewrite: false
			},
			src: {
				pages: 'src/pages',
				layouts: 'src/layouts',
				partials: 'src/partials',
				helpers: 'src/helpers'
			},
			dest: 'dist'
		}, this.data)

		// resolve helpers path
		config.src.helpers = `${config.root}/${config.src.helpers}`

		// load global data file
		if(typeof this.data.data == 'string') {
			if(!grunt.file.exists(this.data.data)) {
				grunt.fail.warn(`Site file '${this.data.data}' does not exist`)
			}
			else {
				const ext = path.extname(this.data.data)
				if(ext == '.yml') config.data = grunt.file.readYAML(this.data.data)
				if(ext == '.json') config.data = grunt.file.readJSON(this.data.data)
				if(ext == '.js') config.data = require(`${config.root}/${this.data.data}`)
			}
		}

		// aggregate files
		const templates = grunt.file.expand({cwd: config.src.pages}, ['**/*.html', '**/*.md'])
		const layouts = grunt.file.expand({cwd: config.src.layouts}, ['**/*.html'])
		const partials = grunt.file.expand({cwd: config.src.partials}, ['**/*.html'])
		const helpers = grunt.file.expand({cwd: config.src.helpers}, ['*.js'])

		// create pagefrost instance and run task
		try {

			// create pagefrost instance
			const pagefrost = new PageFrost(config.src, config.dest, config.data, config.options)

			// run task
			const {built, ignored} = pagefrost.proceed(templates, layouts, partials, helpers)

			// show logs
			_.each(pagefrost.pages, page => grunt.log.ok(`Page '${config.dest}/${page.dest}' published`))
			grunt.log.ok(`${built} file published, ${ignored} ignored`)
		}
		catch(error) {
			grunt.fail.warn(error)
		}

	})

}