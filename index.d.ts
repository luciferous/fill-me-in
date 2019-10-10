/**
 * `Values` is the type of a plain old JavaScript object.
 */
interface Values {
    [key: string]: any;
}
/**
 * `Data` is the type of renderable values;
 */
declare type Data = Values | Values[];
/**
 * `ModEvent` wraps the target element and the incoming value.
 */
interface ModEvent {
    target: Element;
    value: string | Values;
}
/**
 * `Mod` describes how values modify target elements.
 *
 * @param this - is the target element (identical to `e.target`)
 * @param e - an object with `element` and `value`
 */
declare type Mod = (this: Element, e: ModEvent) => boolean | void;
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
export declare function renderFragment(target: DocumentFragment, values: Data, mods?: Mod[]): DocumentFragment;
/**
 * The type of the inputs to the renderer.
 */
declare type State<T> = {
    template: HTMLTemplateElement;
    value: T;
    mods: Mod[];
};
/**
 * The type of functions from `State<A>` to `State<B>`.
 */
declare type Apply<A, B> = (state: State<A>) => State<B>;
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
declare class Render<A> {
    private template;
    private apply;
    private mods;
    constructor(template: HTMLTemplateElement, apply: Apply<any, A>, mods: Mod[]);
    private andThen;
    /**
     * Specify values statically, instead values fetched from `data-src`.
     */
    withValue<B>(value: B): Render<B>;
    /**
     * Map over content transforming it with `f`.
     */
    map<B>(mapFn: (a: A) => B): Render<B>;
    /**
     * Map over content transforming it with `f`.
     */
    mapList<AA extends A[], A, B>(this: Render<AA>, mapFn: (a: A) => B): Render<B[]>;
    /**
     * Fold over the content to transform it with `reduceFn`.
     */
    reduce<AA extends A[], A, B>(this: Render<AA>, reduceFn: (accumulator: B, value: A) => B, initial: B): Render<B>;
    /**
     * Remove content, keeping only that which matches `predicate`.
     */
    filter<AA extends A[], A>(this: Render<AA>, predicate: (value: A) => boolean): Render<A[]>;
    /**
     * Runs render with the built customizations.
     */
    asFragment(): Promise<DocumentFragment>;
    /**
     * Runs asFragment and inserts the document fragment into the target,
     * replacing its contents.
     */
    into(target: string | HTMLElement): Promise<DocumentFragment>;
    /**
     * Exposed for testing.
     *
     * @privateRemarks
     *
     * Runs the renderer, returning the resulting state.
     */
    run(): Promise<State<A>>;
}
/**
 * Initialize the Render API with a selector string or HTMLTemplateElement.
 *
 * @param target - a string representing the template, or the template itself.
 * @returns The initialized renderer.
 */
export declare function render(target: string | HTMLTemplateElement): Render<any>;
export {};
