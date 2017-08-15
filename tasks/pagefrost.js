module.exports = function(grunt) {

	const _ = require('lodash')
	const path = require('path')
	const pkg = require('../package.json')
	const PageFrost = require('../src/pagefrost')

	grunt.registerMultiTask(pkg.name, pkg.description, function(){

		// load site config
		const config = _.merge({
			root: process.cwd(), // resolve root folder
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

		// load template lists
		const templates = {
			pages: grunt.file.expand({cwd: config.src.pages}, ['**/*.html', '**/*.md']).sort(),
			layouts: grunt.file.expand({cwd: config.src.layouts}, ['**/*.html']).sort(),
			partials: grunt.file.expand({cwd: config.src.partials}, ['**/*.html']).sort(),
			helpers: grunt.file.expand({cwd: config.src.helpers}, ['*.js']).sort()
		}

		// create pagefrost instance and run task
		try {
			PageFrost.run(templates, config, grunt.log.ok)
		}
		catch(error) {
			grunt.fail.warn(error)
		}

	})

}
