/**
 * `Template` is a reference to a template. It can be a selector string,
 * `<template>`, or a document fragment.
 */
type Template = string | HTMLTemplateElement | DocumentFragment;

/**
 * `Values` is the type of a plain old JavaScript object.
 */
type Values = { [key: string]: any };

/**
 * `Mod` describes how values modify target elements.
 *
 * @param this - is the target element (identical to `e.target`)
 * @param e - an object with `element` and `value`
 */
type Mod = (this: Element, e: { target: Element, value: string | Values }) => boolean | void

function newFunction(defn: string): Function {
  let ix0 = defn.indexOf("function(");
  if (ix0 == -1) {
    return new Function(defn);
  }
  ix0 += "function(".length;

  let ix1 = defn.indexOf(")", ix0);
  if (ix1 == -1) {
    throw new Error(`expected ')' after index ${ix0}: ${defn}`);
  }
  ix1 += 1;

  let ix2 = defn.indexOf("{", ix1);
  if (ix2 == -1) {
    throw new Error(`expected '{' after index ${ix1}: ${defn}`);
  }
  ix2 += 1;

  let ix3 = defn.lastIndexOf("}");
  if (ix3 == -1) {
    throw new Error(`expected '}': ${defn}`);
  }

  let args = defn.substring(ix0, ix1 - 1);
  let body = defn.substring(ix2, ix3);
  return new Function(args, body);
}

function textContent(this: Element, e: { target: Element, value: string | Values }): boolean | void {
  this.textContent = e.value.toString();
}

function unpackObject(this: Element, e: { target: Element, value: string | Values }): boolean | void {
  if (typeof e.value !== "object") return false;

  for (let attr of Object.keys(e.value)) {
    if (attr == "textContent") {
      this.textContent = e.value[attr];
    } else {
      this.setAttribute(attr, e.value[attr]);
    }
  }
}

function imageSource(this: Element, e: { target: Element, value: string | Values }): boolean | void {
  if (this.nodeName !== "IMG") return false;
  this.setAttribute("src", e.value.toString());
}

const defaultMods: Mod[] = [
  unpackObject,
  imageSource,
  textContent
];

/**
 * Creates a document fragment from the given template and values.
 *
 * @remarks
 *
 * When passed a selector or a `<template>`, render replaces `<template>` in
 * the DOM with the rendered document fragment. For example, running
 *
 * ```
 * renderFragment(template, { vicks: "wedge" });
 * ```
 *
 * where template is the `HTMLTemplateElement`
 *
 * ```
 * <template id="name"><p slot="vicks"></p></template>
 * ```
 *
 * returns the `DocumentFragment`
 *
 * ```
 * <p>wedge</p>
 * ```
 *
 * @param target - The template.
 * @param values - The values to insert into template slots.
 * @param mods - How values modify the target element.
 * @returns Document fragment of the rendered template.
 */
export function renderFragment(
  target: DocumentFragment,
  values: Values,
  mods: Mod[] = defaultMods
): DocumentFragment {
  let refs: [Element, Values][] = [];
  for (let i = 0; i < target.children.length; i++) {
    refs.push([target.children[i], values]);
  }
  go(refs, mods);
  return target;
}

function go(refs: [Element, Values][], mods: Mod[]): void {
  while (refs.length > 0) {
    let [node, values] = refs.pop()!;

    let target: Element | null;
    if (node.hasAttribute("slot")) {
      target = node;
    } else {
      target = node.querySelector("[slot]");
      if (target) {
        refs.push([node, values]);
      }
    }

    if (!target) continue;

    let value: any;
    let key = target.getAttribute("slot");
    if (key) {
      value = values[key];
    } else {
      value = values;
    }
    target.removeAttribute("slot");

    if (!value) continue;

    if (Array.isArray(value)) {
      let template = target.querySelector("template")!;
      for (let item of value) {
        let clone = document.importNode(template.content, true);
        for (let i = 0; i < clone.children.length; i++) {
          refs.push([clone.children[i], item]);
        }
        template.parentElement!.insertBefore(clone, template);
      }
      template.remove();

      if (target.hasAttribute("onempty") && value.length == 0) {
        let handler = <Mod>newFunction(target.getAttribute("onempty")!);
        target.removeAttribute("onempty");
        handler.call(target, { target: target, value: "" });
      }
    } else {
      if (target.children.length > 0) {
        for (let i = 0; i < target.children.length; i++) {
          refs.push([target.children[i], value]);
        }
      } else {
        let appliedMods: Mod[] = [];
        if (target.hasAttribute("onmodify")) {
          let mod = <Mod>newFunction(target.getAttribute("onmodify")!);
          target.removeAttribute("onmodify");
          appliedMods = [mod].concat(mods);
        } else {
          appliedMods = mods;
        }
        for (let mod of appliedMods) {
          if (mod.call(target, { target: target, value: value }) !== false) break;
        }
      }
    }
  }
}

/**
 * API terms.
 */
interface Render { kind: "render", template: HTMLTemplateElement }
interface WithMods { kind: "withmods", mods: (mods: Mod[]) => Mod[] }
interface WithValues { kind: "withvalues", values: Values }
interface WithProcess { kind: "withprocess", process: (values: Values) => Values }

type Term = Render | WithMods | WithValues | WithProcess

/**
 * State generated while processing API expression.
 */
type State = {
  template?: HTMLTemplateElement,
  values?: Values,
  mods: (mods: Mod[]) => Mod[],
  process: (values: Values) => Values
};

function identity<T>(t: T): T {
  return t;
}

function compose<A, B, C>(g: (b: B) => C, f: (a: A) => B): (a: A) => C {
  return a => g(f(a));
}

/**
 * API is series of API terms, that when run, produces a DocumentFragment.
 */
abstract class API {
  abstract async run(state: State): Promise<DocumentFragment>

  abstract withMods(mods: (mods: Mod[]) => Mod[]): API
  abstract withValues(values: Values): API
  abstract withProcess(process: (values: Values) => Values): API
  abstract equals(other: API): boolean
  abstract toString(): string

  async asFragment(): Promise<DocumentFragment> {
    return this.run({ mods: identity, process: identity });
  }

  async into(target: string | HTMLElement): Promise<DocumentFragment> {
    if (typeof target === "string") {
      let element = document.querySelector(target);
      if (element instanceof HTMLElement) {
        return this.into(element);
      } else {
        return Promise.reject(new Error(`target not found: ${target}`));
      }
    }
    const fragment = await this.asFragment();
    target.innerHTML = "";
    target.appendChild(fragment);
    return fragment;
  }
}

/**
 * AndThen is combinator for sequencing API terms.
 */
class AndThen extends API {
  term: Term
  next: API
  constructor(term: Term, next: API) {
    super();
    this.term = term;
    this.next = next;
  }
  withMods(mods: (mods: Mod[]) => Mod[]): API {
    return new AndThen(this.term, this.next.withMods(mods));
  }
  withValues(values: Values): API {
    return new AndThen(this.term, this.next.withValues(values));
  }
  withProcess(process: (values: Values) => Values): API {
    return new AndThen(this.term, this.next.withProcess(process));
  }
  async run(state: State): Promise<DocumentFragment> {
    switch (this.term.kind) {
      case "render":
        state.template = this.term.template;
        let self = this;
        const values = await fetchValues(this.term.template);
        if (values) state.values = values;
        return self.next.run(state);
      case "withvalues":
        state.values = this.term.values;
        return this.next.run(state);
      case "withmods":
        state.mods = this.term.mods;
        return this.next.run(state);
      case "withprocess":
        let current = state.process;
        let process = this.term.process;
        state.process = (values: Values) => process(current(values));
        return this.next.run(state);
    }
  }
  equals(other: API): boolean {
    return other instanceof AndThen &&
      other.term === this.term &&
      this.next.equals(other.next);
  }
  toString(): string {
    return `AndThen(${this.term.toString()}, ${this.next.toString()})`;
  }
}

/**
 * Done is the last term in an API term sequence.
 */
class Done extends API {
  term: Term
  constructor(term: Term) {
    super();
    this.term = term;
  }
  withMods(mods: (mods: Mod[]) => Mod[]): API {
    return new AndThen(this.term, new Done({ kind: "withmods", mods: mods }));
  }
  withValues(values: Values): API {
    return new AndThen(this.term, new Done({ kind: "withvalues", values: values }));
  }
  withProcess(process: (values: Values) => Values): API {
    return new AndThen(this.term, new Done({ kind: "withprocess", process: process }));
  }
  async run(state: State): Promise<DocumentFragment> {
    switch (this.term.kind) {
      case "render":
        state.template = this.term.template;
        const values = await fetchValues(state.template);
        if (values) state.values = values;
        return runState(state);
      case "withvalues":
        state.values = this.term.values;
        return runState(state);
      case "withmods":
        state.mods = this.term.mods;
        return runState(state);
      case "withprocess":
        state.process = compose(this.term.process, state.process);
        return runState(state);
    }
  }
  equals(other: API): boolean {
    return other instanceof Done && other.term === this.term;
  }
  toString(): string {
    return `Done(${this.term.toString()})`;
  }
}

/**
 * runState runs renderFragment with arguments sourced from State.
 */
async function runState(state: State): Promise<DocumentFragment> {
  if (!state.template) return Promise.reject(new Error("missing template"));
  if (!state.values) return Promise.reject(new Error("missing values"));

  let values = state.process(state.values);
  let mods = state.mods(defaultMods);

  if (Array.isArray(values)) {
    let fragment = document.createDocumentFragment();
    for (let i = 0; i < values.length; i++) {
      let target = document.importNode(state.template.content, true);
      fragment.appendChild(renderFragment(target, values[i], mods));
    }
    return fragment;
  }

  let target = document.importNode(state.template.content, true);
  return renderFragment(target, values, mods);
}

/**
 * fetchValues fetches JSON from an element's `data-src` attribute, if present.
 */
async function fetchValues(element: HTMLElement): Promise<Values | undefined> {
  let dataURL = element.getAttribute("data-src");
  if (!dataURL) {
    return Promise.resolve(undefined);
  }

  return fetch(dataURL).then(function(response) {
    return response.json().then(function(values) {
      return Promise.resolve(values);
    });
  });
}

/**
 * `render` initializes an API expression.
 *
 * ```
 * render("#template").withValues({ hello: "world" }).into("#content");
 * ```
 *
 * @param target - a string representing the template, or the template itself.
 */
export function render(target: string | HTMLTemplateElement): API {
  if (typeof target === "string") {
    let template = document.querySelector(target);
    if (template instanceof HTMLTemplateElement) {
      return render(template);
    } else {
      throw new Error(`template not found: ${target}`);
    }
  }
  return new Done({ kind: "render", template: target });
}

// Automatically do things.
document.querySelectorAll("template[data-embed]").forEach(function(template) {
  if (!(template instanceof HTMLTemplateElement)) return;
  if (!template.parentElement) return;
  let parentElement: Element = template.parentElement;
  render(template).asFragment().then(function(fragment: DocumentFragment) {
    parentElement.appendChild(fragment);
  });
});
