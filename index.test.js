"use strict";

import { render } from "./index.js";

function mk(html) {
  let template = document.createElement("template");
  template.innerHTML = html.trim();
  return document.importNode(template.content, true);
}

function diff(a, b) {
  let x = document.createElement("div");
  let y = document.createElement("div");
  x.appendChild(a);
  y.appendChild(b);
  return `got: ${x.innerHTML}, want: ${y.innerHTML}`;
}

function normalize(node) {
  let nodes = [node];
  while (nodes.length > 0) {
    let target = nodes.pop();
    if (target.nodeType == 3 && target.textContent.trim() == "") {
      target.remove();
    }
    for (let i = 0; i < target.childNodes.length; i++) {
      nodes.push(target.childNodes[i]);
    }
  };
}

test("object", () => {
  let got = render(
    mk(`
<div slot="greeting"></div>
    `),
    {
      greeting: "hello"
    }
  );
  let want = mk(`
<div>hello</div>
  `);
  assert(got.isEqualNode(want), diff(got, want));
});

test("nested object", () => {
  let got = render(
    mk(`
<div slot="greeting">
  <div>
    <div slot="en"></div>
    <div slot="ja"></div>
  </div>
</div>
    `),
    {
      greeting: {
        en: "hello",
        ja: "konnichiwa"
      }
    }
  );
  let want = mk(`
<div>
  <div>
    <div>hello</div>
    <div>konnichiwa</div>
  </div>
</div>
  `);
  assert(got.isEqualNode(want), diff(got, want));
});

test("arrays", () => {
  let got = render(
    mk(`
<ul slot="fruit">
  <template><li slot></li></template>
</ul>
    `),
    {
      fruit: [
        "apple",
        "orange"
      ]
    }
  );
  let want = mk(`
<ul>
  <li>apple</li>
  <li>orange</li>
</ul>
  `);
  normalize(got);
  normalize(want);
  assert(got.isEqualNode(want), diff(got, want));
});

test("nested arrays", () => {
  let got = render(
    mk(`
<ul slot="recipes">
  <template>
  <li slot>
    <div>Ingredients:
      <ul>
        <template><li slot></li></template>
      </ul>
    </div>
  </li>
  </template>
</ul>
    `),
    {
      recipes: [
        ["apple", "lime", "kale"],
        ["orange", "carrot"]
      ]
    }
  );
  let want = mk(`
<ul>
  <li>
    <div>Ingredients:
      <ul>
        <li>apple</li>
        <li>lime</li>
        <li>kale</li>
      </ul>
    </div>
  </li>
  <li>
    <div>Ingredients:
      <ul>
        <li>orange</li>
        <li>carrot</li>
      </ul>
    </div>
  </li>
</ul>
  `);
  normalize(got);
  normalize(want);
  assert(got.isEqualNode(want), diff(got, want));
});

test("onempty", () => {
  let got = render(
    mk(`
<div>
  <ul slot="fruit" onempty="this.remove()">
    <template><li slot></li></template>
  </ul>
</div>
    `),
    {
      fruit: []
    }
  );
  let want = mk(`
<div>
</div>
  `);
  normalize(got);
  normalize(want);
  assert(got.isEqualNode(want), diff(got, want));
});

test("defaults", () => {
  let got = render(
    mk(`
<div slot="greeting">Default text.</div>
    `),
    {
    }
  );
  let want = mk(`
<div>Default text.</div>
  `);
  assert(got.isEqualNode(want), diff(got, want));
});

test("nested template", () => {
  let got = render(
    mk(`
<div>
  <div slot="aliases">
    <p>Aliases:</p>
    <ul>
      <template data-omit-empty>
        <li slot="name">
          <span slot="first"></span>
          <span slot="last"></span>
        </li>
      </template>
    </ul>
  </div>
</div>
    `),
    {
      salutation: "Mr.",
      name: { first: "Robert", last: "Dobalina" },
      aliases: [
        { name: { first: "Bob", last: "Dobalina" } },
        { name: { first: "Bob", last: "Dobalina" } }
      ]
    }
  );
  let want = mk(`
<div>
  <div>
    <p>Aliases:</p>
    <ul>
      <li>
        <span>Bob</span>
        <span>Dobalina</span>
      </li>
      <li>
        <span>Bob</span>
        <span>Dobalina</span>
      </li>
    </ul>
  </div>
</div>
  `);
  normalize(got);
  normalize(want);
  assert(got.isEqualNode(want), diff(got, want));
});
