"Syntax-less" templating for HTML.

## A quick example
Running

```
import { render } from './index.js';

render("#template", { greeting: "Hello", subject: "world" });
```

on

```
<html>
  <body>
    <template id="template">
      <p><span slot="greeting"></span>, <span slot="subject"></span>!</p>
    </template>
```

turns it into

```
<html>
  <body>
    <p><span>Hello</span>, <span>world</span>!</p>
```
.

## How does it work?

HTML doesn't need a templating syntax (e.g. `{{example}}`) because its
structure forms an explicit hierarchy, which can be used as an index into
arbitrary objects.

```
<p slot="person">
  <p slot="address">
    <p slot="zip"></p>
```

maps to

```
{
  person: {
    address: {
      zip: 12345
```
.

The `slot` attribute tells the renderer how to traverse the object. When there
is no more to traverse (i.e. `target.querySelector[slot]` returns empty), it
modifies the target element with the value at the index.

In the above example, `<p slot="zip"></p>` becomes `<p>12345</p>`.

## Images

Images are special cased.

```
<img src="default.jpg" slot="pic">
```

when processed with

```
{
  pic: "https://example.com/example.jpg"
}
```

becomes

```
<img src="https://example.com/example.jpg">
```
.

## Object unpacking

Objects are also special cased. When the value at the index is an object, the
properties of the object set the attributes of the target element.

```
<a slot="link"></a>
```

when processed with

```
{
  link: {
    href: "http://example.com/",
    textContent: "Example"
  }
}
```

becomes

```
<a href="http://example.com/">Example</a>
```
.

## Modifiers

The rendering algorithm is extensible via modifiers. Modifiers are functions
that take a target element and a value and return true if the targe element was
modified. Images and object unpacking are default modifiers.

For example, this is a nonsense modifier to set every target element to
"hello".

```
render("#template", values, [function(element, value) { element.textContent = "hello" }]);
```
