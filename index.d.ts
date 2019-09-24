/**
 * Template is a reference to a template. It can be a selector string,
 * `<template>`, or a document fragment.
 */
declare type Template = string | HTMLTemplateElement | DocumentFragment;
/**
 * Values is the type of a plain old JavaScript object.
 */
declare type Values = {
    [key: string]: any;
};
/**
 * Handler describes how values modify target elements.
 *
 * @param this is the target element (identical to `e.target`)
 * @param e an object with `element` and `value`
 */
declare type Handler = (this: Element, e: {
    target: Element;
    value: string | Values;
}) => boolean | void;
export declare const Modifiers: {
    [key: string]: Handler;
};
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
 * @param replace - When true, replace the template with the rendered fragment.
 * @param modifiers - How values modify the target element.
 * @returns Document fragment of the rendered template.
 */
export declare function render(target: Template, values: Values, { replace, modifiers }?: {
    replace?: boolean | undefined;
    modifiers?: Handler[] | undefined;
}): DocumentFragment;
export {};
