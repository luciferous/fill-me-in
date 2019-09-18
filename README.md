*Syntax-less* templating for HTML.

HTML doesn't need a templating syntax. Its structure is an
explicit hierarchy, which can be used to traverse arbitrary objects.

```html
<p slot="person">
  <p slot="address">
    <p slot="zip"></p>
```

looks a lot like

```javascript
{
  person: {
    address: {
      zip: 12345
```

In the above example, the `slot` attributes specify the path (or index,
i.e., `.person.address.zip`) through the object to the value `12345`.

For simple templates, we are done here. The indexed value fills in the
designated region, and so `<p slot="zip"></p>` becomes `<p>12345</p>`.

But *filling in* the region isn't always how we want to transform it (see:
[Images](#images) and [Links](#links)).

## Have a look

- [Demos](https://lcfrs.org/fill-me-in/demos.html)
- [Tests](https://lcfrs.org/fill-me-in/tests.html)

## The basics

Start with an `import`.

```javascript
import { render } from "https://unpkg.com/fill-me-in";
```

Applying `render` to

```html
<html>
  <body>
    <template id="template">
      <p><span slot="greeting"></span>, <span slot="subject"></span>!</p>
    </template>
```

and

```javascript
{ greeting: "Hello", subject: "world" }
```

produces

```html
<html>
  <body>
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

Templating isn't just about how to traverse the object, it's also about how to
transform the designated region by the indexed value. The default
transformation, that we earlier referred to as *filling in*, sets the
`textContent` of the target element. The transformation for `<img>` is an
extension, as is the transformation for when the value is an object.

These extensions are specified by `modifiers`. Modifiers are functions that
describe how to transform a target element by a value. For example, this is a
nonsense modifier to set every target element to "hello", ignoring the passed
in value.

```javascript
render("#template", values, {
  modifiers: [function() { this.target.textContent = "hello" }]
});
```
