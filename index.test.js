"use strict";

import { render, renderFragment } from "./index.js";

function mk(html, skipFragment) {
  let template = document.createElement("template");
  template.innerHTML = html.trim();
  if (skipFragment) return template;
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

suite("Render");

test("template slot", async () => {
  let div = document.createElement("div");
  div.innerHTML = `
<template slot="fruit">
  <p slot></p>
</template>
`;
  let got = await render(
    div.querySelector("template")
  ).withValue(
    {
      fruit: [
        "apple",
        "orange"
      ]
    }
  ).asFragment();
  let want = mk(`
<p>apple</p>
<p>orange</p>
  `);
  normalize(got);
  normalize(want);
  assert(got.isEqualNode(want), diff(got, want));
});

test("withValue: array", async () => {
  let e =
    render(document.createElement("template"))
      .withValue([
        "apple",
        "orange"
      ]);
  const state = await e.run();
  assert.deepEqual(state.value, ["apple", "orange"]);
});

test("withValue: object", async () => {
  let e =
    render(document.createElement("template"))
      .withValue({ fruit: ["apple", "orange"] });
  const state = await e.run();
  assert.deepEqual(state.value, { fruit: ["apple", "orange"] });
});

test("filter", async () => {
  let e =
    render(document.createElement("template"))
      .withValue([1, 2, 3])
      .filter(n => n > 1);
  const state = await e.run();
  assert.deepEqual(state.value, [2, 3]);
});

test("reduce", async () => {
  let e =
    render(document.createElement("template"))
      .withValue([1, 2, 3])
      .reduce((acc, n) => acc + n, 0);
  const state = await e.run();
  assert.equal(state.value, 1 + 2 + 3);
});

test("map", async () => {
  let e =
    render(document.createElement("template"))
      .withValue([1, 2, 3])
      .map(n => n.length);
  const state = await e.run();
  assert.deepEqual(state.value, 3);
});

test("mapList", async () => {
  let e =
    render(document.createElement("template"))
      .withValue([1, 2, 3])
      .mapList(n => n * 2);
  const state = await e.run();
  assert.deepEqual(state.value, [2, 4, 6]);
});

test("cache", async () => {
  let worksOnce = function(n) {
    if (worksOnce.fail) throw new Error("boo");
    worksOnce.fail = true;
    return n * 2;
  };

  let e =
    await render(document.createElement("template"))
      .withValue(1)
      .map(worksOnce)
      .cache();

  const state = await e.map(n => n + 3).run();
  assert.equal(state.value, 5);
  await e.run();
});

test("into: object", async () => {
  let got = await render(
    mk(`
<div slot="greeting"></div>
    `, /* skipFragment */ true)
  ).withValue(
    {
      greeting: "hello"
    }
  ).asFragment();
  let want = mk(`
<div>hello</div>
  `);
  assert(got.isEqualNode(want), diff(got, want));
});

test("into: array", async () => {
  let got = await render(
    mk(`
<li slot></li>
    `, /* skipFragment */ true)
  ).withValue(
    [
      "apple",
      "orange"
    ]
  ).asFragment();
  let want = mk(`
<li>apple</li>
<li>orange</li>
  `);
  normalize(got);
  normalize(want);
  assert(got.isEqualNode(want), diff(got, want));
});

suite("renderFragment");

test("object", () => {
  let got = renderFragment(
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
  let got = renderFragment(
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
        ja: "こんにちは"
      }
    }
  );
  let want = mk(`
<div>
  <div>
    <div>hello</div>
    <div>こんにちは</div>
  </div>
</div>
  `);
  assert(got.isEqualNode(want), diff(got, want));
});


test("template slot", () => {
  let got = renderFragment(
    mk(`
<ul>
  <template slot="fruit"><li slot></li></template>
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

test("arrays", () => {
  let got = renderFragment(
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

test("bare array", async () => {
  ;
  let got = await render(
    mk(`
<li slot></li>
    `, /* skipFragment */ true)
  ).withValue(
    [
      "apple",
      "orange"
    ]
  ).asFragment();
  let want = mk(`
<li>apple</li>
<li>orange</li>
  `);
  normalize(got);
  normalize(want);
  assert(got.isEqualNode(want), diff(got, want));
});

test("nested arrays", () => {
  let got = renderFragment(
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
  let got = renderFragment(
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
  let got = renderFragment(
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
  let got = renderFragment(
    mk(`
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
    `),
     {
       albums: [
         { name: "Dr. Feelgood", year: 1989, artist: "Mötley Crüe" },
         { name: "Appetite For Destruction", year: 1987, artist: "Guns N' Roses" }
       ]
     }
  );
  let want = mk(`
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
  `);
  normalize(got);
  normalize(want);
  assert(got.isEqualNode(want), diff(got, want));
});

test("slot-*", () => {
  let got = renderFragment(
    mk(`
<a slot-href="link"><img slot-src="thumbnail"></a>
    `),
    {
      link: "/hello",
      thumbnail: "logo.png"
    }
  );
  let want = mk(`
<a href="/hello"><img src="logo.png"></a>
  `);
  assert(got.isEqualNode(want), diff(got, want));
});

test("onmodify", () => {
  let got = renderFragment(
    mk(`
<div slot="greeting" onmodify="function(e) { this.textContent = e.value['ja'] }">Default text.</div>
    `),
    {
      greeting: {
        en: "hello",
        ja: "こんにちは"
      }
    }
  );
  let want = mk(`
<div>こんにちは</div>
  `);
  assert(got.isEqualNode(want), diff(got, want));
});

test("newFunction", () => {
  let test = function(js) {
    renderFragment(mk(`<p slot="test" onmodify="${js}"></p>`), { test: "hi" });
  }

  test("");
  test("function(){}");
  test("function(e){}");

  assert.throws(() => test("a"), Error);
  assert.throws(() => test("function("), Error);
  assert.throws(() => test("function(){"), Error);
});
