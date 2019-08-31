"Syntax-less" templating for HTML.

## A quick example

Takes a `<template>`

```
<template>
  <p><span slot="greeting"></span>, <span slot="subject"></span>!</p>
</template>
```

and an object

```
{
  greeting: "Hello",
  subject: "world"
}
```

and produces

```
<p><span>Hello</span>, <span>world</span>!</p>
```
.

## What is syntax-less?

HTML doesn't need a templating syntax (e.g. `{{example}}`) because its
structure forms an explicit hierarchy, which can be used as an index into
arbitrary objects.

```
<p slot="person">
  <p slot="address">
    <p slot="zip">...
```

maps to

```
{
  person: {
    address: {
      zip: ...
```
.
