/**
 * Values is the type of a plain old JavaScript object.
 */
declare type Values = {
    [key: string]: any;
};
/**
 * Mod describes how values modify target elements.
 *
 * @param this is the target element (identical to `e.target`)
 * @param e an object with `element` and `value`
 */
declare type Mod = (this: Element, e: {
    target: Element;
    value: string | Values;
}) => boolean | void;
/**
 * Creates a document fragment from the given template and values.
 *
 * @remarks
 *
 * When passed a selector or a `<template>`, render replaces `<template>` in
 * the DOM with the rendered document fragment. For example, running
 *
 * ```
 * renderFragment("#name" , { vicks: "wedge" });
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
 * @param mods - How values modify the target element.
 * @returns Document fragment of the rendered template.
 */
export declare function renderFragment(target: DocumentFragment, values: Values, mods?: Mod[]): DocumentFragment;
/**
 * State generated while processing API expression.
 */
declare type State = {
    template?: HTMLTemplateElement;
    values?: Values;
    mods: (mods: Mod[]) => Mod[];
    process: (values: Values) => Values;
};
/**
 * API is series of API terms, that when run, produces a DocumentFragment.
 */
declare abstract class API {
    abstract run(state: State): Promise<DocumentFragment>;
    abstract withMods(mods: (mods: Mod[]) => Mod[]): API;
    abstract withValues(values: Values): API;
    abstract withProcess(process: (values: Values) => Values): API;
    abstract equals(other: API): boolean;
    abstract toString(): string;
    asFragment(): Promise<DocumentFragment>;
    into(target: string | HTMLElement): Promise<DocumentFragment>;
}
/**
 * render initializes an API expression.
 *
 * ```
 * render("#template").withValues({ hello: "world" }).into("#content");
 * ```
 *
 * @param target a string representing the template, or the template itself.
 */
export declare function render(target: string | HTMLTemplateElement): API;
export {};
