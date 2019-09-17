/**
 * Template is a reference to a template. It can be a selector string,
 * `<template>`, or a document fragment.
 */
type Template = string | HTMLTemplateElement | DocumentFragment;

/**
 * Values is the type of a plain old JavaScript object.
 */
type Values = { [key: string]: any };

/**
 * Modifier describes how values modify target elements.
 *
 * @param this an object with `element` and `value`
 */
type Modifier = (this: { target: Element, value: string | Values }) => boolean | void

function textContent(this: { target: Element, value: string | Values }): boolean | void {
  let { target, value } = this;
  target.textContent = value.toString();
}

function unpackObject(this: { target: Element, value: string | Values }): boolean | void {
  let { target, value } = this;
  if (typeof value !== "object") return false;

  for (let attr of Object.keys(value)) {
    if (attr == "textContent") {
      target.textContent = value[attr];
    } else {
      target.setAttribute(attr, value[attr]);
    }
  }
}

function imageSource(this: { target: Element, value: string | Values }): boolean | void {
  let { target, value } = this;
  if (target.nodeName !== "IMG") return false;
  target.setAttribute("src", value.toString());
}

export const Modifiers: { [key:string]: Modifier } = {
  textContent: textContent,
  unpackObject: unpackObject,
  imageSource: imageSource
}

const defaultModifiers: Modifier[] = [
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
 * render("#name" , { vicks: "wedge" });
 * ```
 *
 * on the HTML document
 *
 * ```
 * <div><template id="name"><p slot="vicks"></p></template></div>
 * ```
 *
 * will modify it to
 *
 * ```
 * <div><p>wedge</p></div>
 * ```
 *
 * . However, when passed a document fragment, nothing is automatically modified
 * (mainly because document fragments don't have parent elements).
 *
 * @param target - The template.
 * @param values - The values to insert into template slots.
 * @param modifier - How values modify the target element.
 * @returns Document fragment of the rendered template.
 */
export function render(
  target: Template,
  values: Values,
  { replace = false, modifiers = defaultModifiers } = {}
): DocumentFragment {
  if (typeof target === "string") {
    let template = document.querySelector(target);
    if (template instanceof HTMLTemplateElement) {
      return render(template, values, { replace: replace, modifiers: modifiers });
    }
    throw new Error(`template not found: ${target}`);
  } else if (target instanceof HTMLTemplateElement) {
    let fragment = render(document.importNode(target.content, true), values, { replace: replace, modifiers: modifiers });
    if (target.parentElement && replace) {
      target.parentElement.insertBefore(fragment, target);
      target.remove();
    }
    return fragment;
  } else {
    let refs: [Element, Values][] = [];
    for (let i = 0; i < target.children.length; i++) {
      refs.push([target.children[i], values]);
    }
    go(refs, modifiers);
    return target;
  }
}

function go(refs: [Element, Values][], modifiers: Modifier[]): void {
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
        let handler = new Function(target.getAttribute("onempty")!);
        target.removeAttribute("onempty");
        handler.call(target);
      }
    } else {
      if (target.children.length > 0) {
        for (let i = 0; i < target.children.length; i++) {
          refs.push([target.children[i], value]);
        }
      } else {
        let appliedModifiers: Modifier[];
        if (target.hasAttribute("onmodify")) {
          let modifier = <Modifier>(new Function(target.getAttribute("onmodify")!));
          target.removeAttribute("onmodify");
          appliedModifiers = [modifier].concat(modifiers);
        } else {
          appliedModifiers = modifiers;
        }
        for (let modifier of appliedModifiers) {
          if (modifier.call({ target: target, value: value }) !== false) break;
        }
      }
    }
  }
}
