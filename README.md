![](logo_transparent.png)

******
*HTML templating without Javascript.*

## A quick example

Let's say you keep a list of things you like in a file called `favorites.json`.
It looks like this.

```json
{
  "things": [
    "Raindrops on roses",
    "Whiskers on kittens",
    "Bright copper kettles",
    "Warm woolen mittens",
    "Brown paper packages tied up with strings"
  ]
}
```

And, you want to display this list on a website. HTML has a
[&lt;template&gt;](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template)
tag, so let's use that.

```html
<h1>My favorite things</h1>
<template data-src="/favorites.json" embed>
  <ul slot="things">
    <template>
      <li slot></li>
    </template>
  </ul>
</template>
<script type="module" src="https://unpkg.com/fill-me-in"></script>
```

The `data-src` attribute specifies the data source for this template. The
`embed` attribute tells the library to render the template automatically.

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

## API

For simple websites, an HTML `<template>` and a `data-src` might be enough. But
when you want more power and control, the Javascript API is the way to go.

Everything starts with `render`, which takes a single parameter we will call
the *target*. The target can be a selector string of a template element, or the
template element itself.

```javascript
render("template").into("#content");
```

`render` works by chaining actions together.

### into

`into` replaces the content of `#content` with the rendered output.

### withValues

`withValues` allows you to specify the data source as a Javascript object,
overriding `data-src`.

```javascript
render("template").withValues({
  things: [
    "Raindrops on roses",
    "Whiskers on kittens",
    "Bright copper kettles",
    "Warm woolen mittens",
    "Brown paper packages tied up with strings"
  ]
}).into("#content");
```

### withProcess

`withProcess` transforms the data from the data source.

```javascript
render("template").withProcess(function(values) {
  values.things.push("HTML templates");
  return values;
}).into("#content");
```

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
