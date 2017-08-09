module.exports = function(grunt) {

	const _ = require('lodash')
	const path = require('path')
	const pkg = require('../package.json')
	const PageFrost = require('../src/pagefrost')

	grunt.registerMultiTask(pkg.name, pkg.description, function(){

		// resolve root folder
		const root = process.cwd()

		// load config
		const config = _.merge({
			data: {},
			options: {
				base_url: '',
				rewrite_url: false
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
		config.src.helpers = `${root}/${config.src.helpers}`

		// load global data file
		if(typeof this.data.data == 'string') {
			if(!grunt.file.exists(this.data.data)) {
				grunt.fail.warn(`Site file '${this.data.data}' does not exist`)
			}
			else {
				const ext = path.extname(this.data.data)
				if(ext == '.yml') config.data = grunt.file.readYAML(this.data.data)
				if(ext == '.json') config.data = grunt.file.readJSON(this.data.data)
				if(ext == '.js') config.data = require(`${root}/${this.data.data}`)
			}
		}

		// aggregate files
		const templates = grunt.file.expand({cwd: config.src.pages}, ['**/*.html', '**/*.md'])
		const layouts = grunt.file.expand({cwd: config.src.layouts}, ['**/*.html'])
		const partials = grunt.file.expand({cwd: config.src.partials}, ['**/*.html'])
		const helpers = grunt.file.expand({cwd: config.src.helpers}, ['*.js'])

		// create pagefrost instance and run task
		try {
			const pagefrost = new PageFrost(config.src, config.dest, config.data, config.options, grunt.log.ok)
			pagefrost.proceed(templates, layouts, partials, helpers)
		}
		catch(error) {
			grunt.fail.warn(error)
		}

	})

}
