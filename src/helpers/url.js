
/**
 * `url` helper
 * 
 * Prepend base url options to url
 */
module.exports = (Handlebars, options) => {
	return (url) => `${options.base_url}${url}`
}