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
 * @returns Document fragment of the rendered template.
 */
export function render(target: Template, values: Values): DocumentFragment {
  if (typeof target === "string") {
    let template = document.querySelector(target);
    if (template instanceof HTMLTemplateElement) {
      return render(template, values);
    }
    throw new Error(`template not found: ${target}`);
  } else if (target instanceof HTMLTemplateElement) {
    let fragment = render(document.importNode(target.content, true), values);
    if (target.parentElement != null) {
      target.parentElement.insertBefore(fragment, target);
      target.remove();
    }
    return fragment;
  } else {
    let refs: [Element, Values][] = [];
    for (let i = 0; i < target.children.length; i++) {
      refs.push([target.children[i], values]);
    }
    go(refs);
    return target;
  }
}

function go(refs: [Element, Values][]): void {
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
        handler.call(target);
      }
    } else {
      if (target.children.length > 0) {
        for (let i = 0; i < target.children.length; i++) {
          refs.push([target.children[i], value]);
        }
      } else {
        target.textContent = value;
      }
    }
  }
}
