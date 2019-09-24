![logo](https://lcfrs.org/fill-me-in/logo_transparent.png)
***

*Lightweight templating for tiny web apps.*

HTML doesn't need special templating syntax: it has a
[&lt;template&gt;](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template)
tag, and its nested structure maps naturally to JSON.

## A quick example

This HTML

```html
<h1>My favorite things</h1>
<template>
  <ul slot="things">
    <template>
      <li slot></li>
    </template>
  </ul>
</template>
```

and this Javascript

```javascript
import { render } from "https://unpkg.com/fill-me-in";

render("h1 + template", {
  things: [
    "Raindrops on roses",
    "Whiskers on kittens",
    "Bright copper kettles",
    "Warm woolen mittens",
    "Brown paper packages tied up with strings"
  ]
}, { replace: true });
```

produces

> # My favorite things
> - Raindrops on roses
> - Whiskers on kittens
> - Bright copper kettles
> - Warm woolen mittens
> - Brown paper packages tied up with strings

## Demos

Ready to learn more? Let's have look at some demos!

- [My Favorite Things](https://codepen.io/lcfrs/pen/mdbvmgd?editors=1010)
- [Bingo Book](https://codepen.io/lcfrs/pen/WNeMGNg/?editors=1010)

## Tests

- [Tests](https://lcfrs.org/fill-me-in/tests.html)

## The basics

Define the template in HTML.

```html
<template id="template">
  <p><span slot="greeting"></span>, <span slot="subject"></span>!</p>
</template>
```

Call `render` on the template, passing it data.

```javascript
import { render } from "https://unpkg.com/fill-me-in";

render("#template", { greeting: "Hello", subject: "world" }, { replace: true });
```

Render will *replace* the `<template>` with the following HTML.

```html
<p><span>Hello</span>, <span>world</span>!</p>
```

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

## Modifiers

HTML has a nested structure that maps to JSON, but sometimes we need more
flexibility. For `<img>`, we want to set the value of the `src` attribute. For
`<a>` we want to set the value of `href` and `textContent`. The `render`
function knows how to do all of this because of `modifiers`. Modifiers describe
how to transform a target element by a value.

The default modifier sets the `textContent` of the target.

```javascript
function(e) { e.target.textContent = e.value }
```

The `<img>` modifier sets the `src`.

```javascript
function(e) { e.target.src = e.value }
```

You can define your own custom modifiers.  This is a nonsense modifier to set
every target element to "hello", ignoring the passed in value.

```javascript
function nonsense(e) { e.target.textContent = "hello" }
```

Pass it to render as a keyword arg.

```javascript
render(..., { modifiers: [nonsense] });
```
