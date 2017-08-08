# PageFrost 1.0.0

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
			data: 'src/site.json',
			pages: 'src/pages',
			layouts: 'src/layouts',
			partials: 'src/partials',
			helpers: 'src/helpers',
			dest: 'dist'
		}
	}
})

grunt.loadNpmTasks('pagefrost')
```

### `target.data`

Global data injected in all templates, can be either a json file or an object, default `{}`.

### `target.pages`

Path folder where templates are located, default `src/pages`.

### `target.layouts`

Path folder where layouts are located, default `src/layouts`.

### `target.partials`

Path folder where partials are located, default `src/partials`.

### `target.helpers`

Path folder where javascript helpers are located, default `src/helpers`.
The file loaded must be a factory to generate the helper:

```js
module.exports = function(Handlebars) {
	return function() { /* do something here */ }
}
```

### `target.dest`

Path folder where compiled pages will be written, default `dist`.


## Usage

PageFrost will render all templates located in `src/pages` to `dist`, these templates can be either HTML file, Handlebars file or Markdown file.

### Front-matter

All templates are enhanced with the front-matter metadata feature and can define custom vars :

`src/pages/index.html`
```html
---
name: John
---

Ho, hello {{name}} !
```

...will render `dist/index.html`
```html
Ho, hello John !
```

### Layout

Layout file can be defined in metadata (ex. `default`, located in `src/layouts`):

`src/pages/index.html`
```html
---
layout: default
name: John
---

Ho, hello {{name}} !
```

with `src/layouts/default.html`
```html
<h1>{{{$body}}}</h1>
```

...will render `dist/index.html`
```html
<h1>Ho, hello John !</h1>
```

### Publish state

You can choose to exclude a file from rendering by setting the `publish` metadata to `false`:

```html
---
publish: false
---
```

### Tags

You can tag a template and find it in the `$tags` collectionm this act as a category

`src/blog/note-1.html`
```html
---
tag: blog
---

Hey I'm a blog post :)
```

`src/blog.html`
```html
<h1>Blog:</h2>
<ul>
{{#each $tags.blog}}
<li>- {{this.file}}</li> <!-- blog/note-1.html -->
{{/each}}
</ul>
```

### Runtime vars

PageFrost will provide some runtime data, prefixed with `$`:
- `$page` current explosed page data (`id`, `url`, `dest`, `tag`, `meta`)
- `$pages` all exposesd pages
- `$tags` all exposesd tags


## :)
