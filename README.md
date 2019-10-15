![](logo_transparent.png)

******

*A prototyping library for JSON-driven web pages.*

## A quick example

Let's say you keep a list of things you like in a file called `favorites.json`.
It looks like this.

```json
[
  "Raindrops on roses",
  "Whiskers on kittens",
  "Bright copper kettles",
  "Warm woolen mittens",
  "Brown paper packages tied up with strings"
]
```

And, you want to display this list on a website. HTML has a
[&lt;template&gt;](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template)
tag, so let's use that.

```html
<h1>My favorite things</h1>
<ul>
<template data-src="/favorites.json" embed>
  <li slot></li>
</template>
</ul>
<script type="module" src="https://unpkg.com/fill-me-in"></script>
```

The `data-src` attribute specifies the data source for this template. The
`embed` attribute tells the library to render the template in place.

So, the HTML above produces

> # My favorite things
> - Raindrops on roses
> - Whiskers on kittens
> - Bright copper kettles
> - Warm woolen mittens
> - Brown paper packages tied up with strings

Ready to try it out for yourself? Have a look at the demos in the next section.

## Demos

- [My Favorite Things](https://codepen.io/lcfrs/pen/mdbvmgd?editors=1010)
- [Bingo Book](https://codepen.io/lcfrs/pen/WNeMGNg/?editors=1010)

## Tests

- [Tests](https://lcfrs.org/fill-me-in/tests.html)

## The Render API

The class `Render` is a builder API for customizing the render operation.

For example, this expression,

```
render("#album-template")
  .filter(album => album.rating >= 4.5)
  .into("#content");
```

When executed (via `into`), does the following:

- Finds the DOM element by the ID album-template
- Fetches JSON from the URL specified in its data-src attribute
- Removes albums that have a rating lower than 4.5
- Renders the remaining albums with the #album-template and inserts it into #content

### `render(template: string | HTMLTemplateElement): Render<any>`

Initialize the Render API with a selector string or `HTMLTemplateElement`.

### `.map<U>(f: T => U): Render<U>`

Map over content transforming it with f.

### `.reduce<U>(f: (current: U, next: T) => U, initial: U): Render<U>`

Fold over the content to transform it into something else.

### `.filter(predicate: (values: T) => boolean): Render<T>`

Remove content, keeping only that which matches the predicate.

### `.withValues<T>(values: T): Render<T>`

Specify values statically, instead of from `data-src`.

### `.asFragment(): Promise<DocumentFragment>`

Runs the render process with the customizations.

### `.into(target: string | HTMLElement): Promise<DocumentFragment>`

Runs `asFragment` and inserts the document fragment into the target, replacing its contents.

## Common scenarios

Some common scenarios follow.

### Lists

A list of albums

```javascript
{
  albums: [
    { name: "Dr. Feelgood", year: 1989, artist: "Mötley Crüe" },
    { name: "Appetite For Destruction", year: 1987, artist: "Guns N' Roses" }
  ]
}
```

applied to this template

```html
<template>
  <table slot="albums">
    <tbody>
      <template>
        <tr>
          <td slot="name"></td>
          <td slot="year"></td>
          <td slot="artist"></td>
        </tr>
      </template>
    </tbody>
  </table>
</template>
```

produces

```html
<table>
  <tbody>
    <tr>
      <td>Dr. Feelgood</td>
      <td>1989</td>
      <td>Mötley Crüe</td>
    </tr>
    <tr>
      <td>Appetite For Destruction</td>
      <td>1987</td>
      <td>Guns N' Roses</td>
    </tr>
  </tbody>
</table>
```

### Empty lists

The attribute `onempty` is a Javascript callback that is run when the indexed
list is empty (i.e. `{ albums: [] }`).

```html
<div class="or-empty" style="display: none">No albums found.</div>

<template>
  <table slot="albums" class="or-empty" onempty="$('.or-empty').toggle()">
    <tbody>
      <template>
        <tr>
          <td slot="name"></td>
          <td slot="year"></td>
          <td slot="artist"></td>
        </tr>
      </template>
    </tbody>
  </table>
</template>
```

becomes

```html
<div class="or-empty">No albums found.</div>

<table class="or-empty" style="display: none">
  <tbody>
  </tbody>
</table>
```

### Images

`<img>` is special-cased. The indexed value sets the `src` attribute.

```javascript
{
  pic: "https://example.com/example.jpg"
}
```

applied to

```html
<img src="default.jpg" slot="pic">
```

produces

```html
<img src="https://example.com/example.jpg">
```

### Links

When the indexed value is an object, its properties are unpacked into
attributes of the target element.

```javascript
{
  link: {
    href: "http://example.com/",
    textContent: "Example"
  }
}
```

applied to

```html
<a slot="link"></a>
```

produces

```html
<a href="http://example.com/">Example</a>
```

## Mods (short for modifiers)

HTML has a nested structure that maps to JSON, but sometimes we need more
flexibility. For `<img>`, we want to set the value of the `src` attribute. For
`<a>` we want to set the value of `href` and `textContent`. The `render`
function knows how to do all of this because of *mods*. Mods describe
how to transform a target element by a value.

The default mod sets the `textContent` of the target.

```javascript
function(e) { e.target.textContent = e.value }
```

The `<img>` mod sets the `src`.

```javascript
function(e) { e.target.src = e.value }
```

You can define your own custom mods.  This is a nonsense modifier to set
every target element to "hello", ignoring the passed in value.

```javascript
function nonsense(e) { e.target.textContent = "hello" }
```

Pass it to render via `withMods`.

```javascript
renderFragment.withMods(function(mods) { return [nonsense]; });
```
