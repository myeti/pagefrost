const _ = require('lodash')

/**
 * `loop` helper
 * 
 * Loop through collection sorted by props
 * Ex: {{#loop collection 'prop'}} {{/loop}}
 */
module.exports = (Handlebars) => {
	return (collection, keys, options) => {

		// no sorting keys are provided, normal loop
		if(typeof keys != 'string') return Handlebars.helpers.each(collection, keys)

		// parse multiple keys separated by coma (ex. `id,name`)
		const iteratees = keys.split(',').map(key => {

			// extract type if provided (ex. `published:date`)
			const [prop, type] = key.trim().split(':')

			// build iteratee
			let iteratee = prop // standard, just check for a specific property
			if(type === 'date') { // check for date based property
				iteratee = (item) => Date.parse(item[prop])
			}

			return iteratee
		})

		// apply sorting and native `each` loop
		const sorted = _.sortBy(collection, iteratees)
		return Handlebars.helpers.each(sorted, options)
	}
}