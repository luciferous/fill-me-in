/**
 * `Template` is a reference to a template. It can be a selector string,
 * `<template>`, or a document fragment.
 */
type Template = string | HTMLTemplateElement | DocumentFragment;

/**
 * `Values` is the type of a plain old JavaScript object.
 */
interface Values {
  [key: string]: any
};

/**
 * `Data` is the type of renderable values;
 */
type Data = Values | Values[];

/**
 * `ModEvent` wraps the target element and the incoming value.
 */
interface ModEvent {
  target: Element
  value: string | Values
}

/**
 * `Mod` describes how values modify target elements.
 *
 * @param this - is the target element (identical to `e.target`)
 * @param e - an object with `element` and `value`
 */
type Mod = (this: Element, e: ModEvent) => boolean | void

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

function textContent(this: Element, e: ModEvent): boolean | void {
  this.textContent = e.value.toString();
}

function unpackObject(this: Element, e: ModEvent): boolean | void {
  if (typeof e.value !== "object") return false;

  for (let attr of Object.keys(e.value)) {
    if (attr == "textContent") {
      this.textContent = e.value[attr];
    } else {
      this.setAttribute(attr, e.value[attr]);
    }
  }
}

function imageSource(this: Element, e: ModEvent): boolean | void {
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
  values: Data,
  mods: Mod[] = defaultMods
): DocumentFragment {
  let refs: [Element, Data][] = [];
  for (let i = 0; i < target.children.length; i++) {
    refs.push([target.children[i], values]);
  }
  go(refs, mods);
  return target;
}

function go(refs: [Element, Data][], mods: Mod[]): void {
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
    if (key && !Array.isArray(values)) {
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

// Render API //////////////////////////////////

/**
 * The type of the inputs to the renderer.
 */
type State<T> = {
  template: HTMLTemplateElement
  value: T
  mods: Mod[]
}

/**
 * The type of functions from `State<A>` to `State<B>`.
 */
type Apply<A, B> = (state: State<A>) => State<B>

/**
 * Render is a builder API for customizing the render.
 *
 * @remarks
 * 
 * For example, this expression,
 *
 * ```
 * render("#album-template")
 *   .filter(album => album.rating >= 4.5)
 *   .into("#content");
 * ```
 *
 * When executed (via into), does the following:
 *
 * - Finds the DOM element by the ID album-template
 * - Fetches JSON from the URL specified in its data-src attribute
 * - Removes albums that have a rating lower than 4.5
 * - Renders the remaining albums with the #album-template and inserts it into #content
 */
class Render<A> {
  private template: HTMLTemplateElement
  private apply: Apply<any, A>
  private mods: Mod[]

  constructor(template: HTMLTemplateElement, apply: Apply<any, A>, mods: Mod[]) {
    this.template = template;
    this.apply = apply;
    this.mods = mods;
  }

  private andThen<B>(fn: Apply<A, B>): Render<B> {
    return new Render(this.template, a => fn(this.apply(a)), this.mods);
  }

  /**
   * Specify values statically, instead values fetched from `data-src`.
   */
  withValue<B>(value: B): Render<B> {
    return this.andThen(
      state => Object.assign(state, { value: value }));
  }

  /**
   * Map over content transforming it with `f`.
   */
  map<B>(mapFn: (a: A) => B): Render<B> {
    return this.andThen(
      state => Object.assign(state, { value: mapFn(state.value) }));
  }

  /**
   * Map over content transforming it with `f`.
   */
  mapList<AA extends A[], A, B>(
    this: Render<AA>,
    mapFn: (a: A) => B
  ): Render<B[]> {
    return this.andThen(
      state => Object.assign(state, { value: state.value.map(mapFn) }));
  }

  /**
   * Fold over the content to transform it with `reduceFn`.
   */
  reduce<AA extends A[], A, B>(
    this: Render<AA>,
    reduceFn: (accumulator: B, value: A) => B, initial: B
  ): Render<B> {
    return this.andThen(
      state => Object.assign(state, { value: state.value.reduce(reduceFn, initial) }));
  }


  /**
   * Remove content, keeping only that which matches `predicate`.
   */
  filter<AA extends A[], A>(
    this: Render<AA>,
    predicate: (value: A) => boolean
  ): Render<A[]> {
    return this.andThen(
      state => Object.assign(state, { value: state.value.filter(predicate) }));
  }

  /**
   * Runs render with the built customizations.
   */
  async asFragment(): Promise<DocumentFragment> {
    const state = await this.run();
    const value = state.value;
    const mods = state.mods;

    if (Array.isArray(value)) {
      let fragment = document.createDocumentFragment();
      for (let i = 0; i < value.length; i++) {
        let target = document.importNode(state.template.content, true);
        fragment.appendChild(renderFragment(target, value[i], mods));
      }
      return fragment;
    }

    let target = document.importNode(state.template.content, true);
    return renderFragment(target, value, mods);
  }

  /**
   * Runs asFragment and inserts the document fragment into the target,
   * replacing its contents.
   */
  async into(target: string | HTMLElement): Promise<DocumentFragment> {
    if (typeof target === "string") {
      let element = document.querySelector(target);
      if (element instanceof HTMLElement) {
        return this.into(element);
      }
      throw new Error(`target not found: ${target}`);
    }

    const fragment = await this.asFragment();
    target.innerHTML = "";
    target.appendChild(fragment);
    return fragment;
  }

  /**
   * Exposed for testing.
   *
   * @privateRemarks
   *
   * Runs the renderer, returning the resulting state.
   */
  async run(): Promise<State<A>> {
    let url = this.template.getAttribute("data-src");
    if (!url) {
      return this.apply({
        template: this.template,
        value: undefined,
        mods: this.mods
      });
    }

    const response = await fetch(url);
    const json = await response.json();
    return this.apply({
      template: this.template,
      value: json,
      mods: this.mods
    });
  }
}

/**
 * Initialize the Render API with a selector string or HTMLTemplateElement.
 *
 * @param target - a string representing the template, or the template itself.
 * @returns The initialized renderer.
 */
export function render(target: string | HTMLTemplateElement): Render<any> {
  if (typeof target === "string") {
    let template = document.querySelector(target);
    if (template instanceof HTMLTemplateElement) {
      return render(template);
    }
    throw new Error(`template not found: ${target}`);
  }
  return new Render(target, state => state, defaultMods);
}

// Automatically do things.
document.querySelectorAll("template[data-embed]").forEach(async function(template) {
  if (!(template instanceof HTMLTemplateElement)) return;
  if (!template.parentElement) return;
  const fragment = await render(template).asFragment();
  template.parentElement.appendChild(fragment);
});
