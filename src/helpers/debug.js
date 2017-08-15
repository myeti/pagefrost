const util = require('util')

/**
 * `debug` helper
 * 
 * Print JS var
 */
module.exports = () => {
	return (input) => util.inspect(input, false, null)
}