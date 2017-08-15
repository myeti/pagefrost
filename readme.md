# PageFrost 1.1.1

Grunt task to render Handlebars and Markdown templates using front-matter metadata.


## Install

```shell
npm install pagefrost
```


## Config

```js
grunt.initConfig({
	pagefrost: {
		target: {
			data: 'src/data.json',
			options: {
				base_url: '/',
				rewrite_url: false
			},
			src: {
				pages: 'src/pages',
				layouts: 'src/layouts',
				partials: 'src/partials',
				helpers: 'src/helpers'
			},
			dest: 'dist'
		}
	}
})

grunt.loadNpmTasks('pagefrost')
```

### `target.data`

Global data injected in all templates, can be either a `.json` file, a `.yml` file, a `.js` file or an object, default `{}`.

### `target.options.base_url`

Base url used by the `url` helper.

### `target.options.rewrite_url`

If `true`, create `.htaccess` and remove `.html` extension in `url` helper.

### `target.src.pages`

Folder where templates are located, default `src/pages`.

### `target.src.layouts`

Folder where layouts are located, default `src/layouts`.

### `target.src.partials`

Folder where partials are located, default `src/partials`.

### `target.src.helpers`

Folder where js helpers are located, default `src/helpers`.
The file loaded must be a factory generating the helper:

```js
module.exports = (Handlebars, options) => {
	return (input) => {
		/* do something here */
	}
}
```

### `target.dest`

Folder where compiled pages will be written, default `dist`.


## Usage

PageFrost will render all templates located in `src/pages` to `dist`, these templates can be either HTML file, Handlebars file or Markdown file.

### Front-matter

All templates are enhanced with the front-matter parsing and can define custom vars :

`src/pages/index.html`
```html
---
name: John
---

Ho, hello {{name}} !
```

`dist/index.html`
```html
Ho, hello John !
```

### Layout

Layout file can be defined in vars (ex. `default`, located in `src/layouts`):

`src/pages/index.html`
```html
---
layout: default
name: John
---

Ho, hello {{name}} !
```

`src/layouts/default.html`
```html
<h1>{{{$body}}}</h1>
```

`dist/index.html`
```html
<h1>Ho, hello John !</h1>
```

### Publish state

You can choose to exclude a file from rendering by setting the `publish` var to `false`:

```html
---
publish: false
---
```

### Collections

You can categorize a template and find it in the `$collections`, this act as a category:

`src/blog/note-1.html`
```html
---
collection: blog
---

Hey I'm a blog post :)
```

`src/blog.html`
```html
<h1>Blog:</h2>
<ul>
{{#each $collections.blog}}
<li>- {{this.url}}</li> <!-- blog/note-1.html -->
{{/each}}
</ul>
```

### Runtime vars

PageFrost will provide some runtime data:
- `id` current page's id
- `url` current page's url
- `$meta` current page's metadata (`src`, `dest`, `ext`, `type`...)
- `$pages` all published pages
- `$collections` all collections

### Built-in helpers

PageFrost comes with built-in helpers:
- `url` use `base_url` to generate valid url: `{{url 'foo/bar.html'}} -> 'http://www.base.url/foo/bar.html'`
- `loop` iterate over a collection sorted by property:
```html
{{#loop $collections.blog 'date'}}
	{{this.title}}
{{/loop}}
```

## :)
