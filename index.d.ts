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
 * Modifier describes how values modify target elements.
 *
 * @param this an object with `element` and `value`
 */
declare type Modifier = (this: {
    target: Element;
    value: string | Values;
}) => boolean | void;
export declare const Modifiers: {
    [key: string]: Modifier;
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
 * @param modifier - How values modify the target element.
 * @returns Document fragment of the rendered template.
 */
export declare function render(target: Template, values: Values, { replace, modifiers }?: {
    replace?: boolean | undefined;
    modifiers?: Modifier[] | undefined;
}): DocumentFragment;
export {};
