*Syntax-less* templating for HTML.

## An example
Running

```javascript
import { render } from "https://unpkg.com/fill-me-in";

render("#template", { greeting: "Hello", subject: "world" });
```

on

```html
<html>
  <body>
    <template id="template">
      <p><span slot="greeting"></span>, <span slot="subject"></span>!</p>
    </template>
```

produces

```html
<html>
  <body>
    <p><span>Hello</span>, <span>world</span>!</p>
```

## The basic idea

HTML doesn't need a templating syntax (e.g. `{{example}}`). Its structure is an
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

The `slot` attributes specify a path to take through the object. When there are
no more slots (i.e. `target.querySelector[slot]` returns empty), we are
(hopefully) left with references to:

- a designated region of the template (a.k.a. an HTML element)
- a value within the object

In the above example, the `slot` attributes specify the path
(or index, i.e., `.person.address.zip`) through the object to the value `12345`.

For simple templates, we are done here. The indexed value fills in the
designated region, and so `<p slot="zip"></p>` becomes `<p>12345</p>`.

But *filling in* the region isn't always how we want to transform it. To
understand why, let's look at `<img>` and `<a>`.

### \<img\>

```html
<img src="default.jpg" slot="pic">
```

applied to

```javascript
{
  pic: "https://example.com/example.jpg"
}
```

produces

```html
<img src="https://example.com/example.jpg">
```

`<img>` is special-cased. The indexed value sets the `src` attribute.

### \<a\>

```html
<a slot="link"></a>
```

applied to

```javascript
{
  link: {
    href: "http://example.com/",
    textContent: "Example"
  }
}
```

becomes

```html
<a href="http://example.com/">Example</a>
```

When the indexed value is an object, its properties are unpacked into
attributes of the target element.

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
render("#template", values, [function() { this.target.textContent = "hello" }]);
```
