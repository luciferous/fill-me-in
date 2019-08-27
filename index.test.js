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
  var texts = [];

  for (var i = 0; i < node.childNodes.length; i++) {
    let child = node.childNodes[i];
    if (child.nodeType == 3) {
      console.log(`"${child.textContent}"`);
      if (child.textContent.trim() == "") {
        texts.push(child);
      }
    } else if (child.childNodes) {
      normalize(child);
    }
  };

  texts.forEach(function(child) { child.remove() });
  return node;
}

test("greeting", () => {
  let got = render(
    mk(`
<div data-key="greeting"></div>
    `),
    {
      greeting: "hello"
    }
  );
  let want = mk(`
<div data-key="greeting">hello</div>
  `);
  assert(got.isEqualNode(want), diff(got, want));
});

test("multilingual greeting", () => {
  let got = render(
    mk(`
<div data-key="greeting">
  <div data-key="en"></div>
  <div data-key="ja"></div>
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
<div data-key="greeting">
  <div data-key="en">hello</div>
  <div data-key="ja">konnichiwa</div>
</div>
  `);
  assert(got.isEqualNode(want), diff(got, want));
});

test("arrays", () => {
  let got = render(
    mk(`
<ul data-key="fruit">
  <template><li data-value></li></template>
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
<ul data-key="fruit">
  <li data-value>apple</li>
  <li data-value>orange</li>
</ul>
  `);
  normalize(got.firstChild);
  normalize(want.firstChild);
  assert(got.isEqualNode(want), diff(got, want));
});

test("nested template", () => {
  let got = render(
    mk(`
<div>
  <p data-key="name">Name:
    <span data-key="first"></span>
    <span data-key="last"></span>
  </p>
  <div data-key="aliases">
    <p>Aliases:</p>
    <ul>
      <template data-omit-empty>
        <li data-key="name">
          <span data-key="first"></span>
          <span data-key="last"></span>
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
        { name: { first: "Bob", last: "Dobalina" } }
      ]
    }
  );
  let want = mk(`
<div>
  <p data-key="name">Name:
    <span data-key="first">Robert</span>
    <span data-key="last">Dobalina</span>
  </p>
  <div data-key="aliases">
    <p>Aliases:</p>
    <ul>
      <li data-key="name">
        <span data-key="first">Bob</span>
        <span data-key="last">Dobalina</span>
      </li>
    </ul>
  </div>
</div>
  `);
  normalize(got);
  normalize(want);
  assert(got.isEqualNode(want), diff(got, want));
});
