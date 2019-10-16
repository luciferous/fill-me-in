/**
 * `ModEvent` wraps the target element and the incoming value.
 */
interface ModEvent {
    target: Element;
    value: any;
}
/**
 * `Mod` describes how values modify target elements.
 *
 * @param this - is the target element (identical to `e.target`)
 * @param e - an object with `element` and `value`
 */
declare type Mod = (this: Element, e: ModEvent) => boolean | void;
declare type Logger = (message: string, value?: any, ...args: any[]) => void;
/**
 * Creates a document fragment from the given template and a value.
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
 * @param value - The value to insert into template slots.
 * @param mods - How the value modifies the target element.
 * @returns Document fragment of the rendered template.
 */
export declare function renderFragment<T>(target: DocumentFragment, value: T, mods?: Mod[], logger?: Logger): DocumentFragment;
/**
 * The type of the inputs to the renderer.
 */
declare type State<T> = {
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
    private value?;
    constructor(template: HTMLTemplateElement, apply: Apply<any, A>, mods: Mod[], value?: any);
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
    mapList<B, C>(this: Render<B[]>, mapFn: (b: B) => C): Render<C[]>;
    /**
     * Fold over the content to transform it with `reduceFn`.
     */
    reduce<B, C>(this: Render<B[]>, reduceFn: (accumulator: C, value: B) => C, initial: C): Render<C>;
    /**
     * Remove content, keeping only that which matches `predicate`.
     */
    filter<B>(this: Render<B[]>, predicate: (value: B) => boolean): Render<B[]>;
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
    /**
     * Runs the renderer and creates a save point for its state.
     *
     * @remarks
     *
     * Consider this example, where albums are processed through an expensive
     * operation, which is then filtered by album rating, a comparatively cheap
     * operation.
     *
     * ```
     * render("#album-template")
     *   .mapList(expensiveOperation)
     *   .filter(album => album.rating >= minimumRating)
     *   .into("#content");
     * ```
     *
     * Every time `minimumRating` changes, we want to refresh the albums
     * displayed, but this means running the expensive operation too.
     *
     * What we want is to run the expensive operation just once, and for each
     * `minimumRating` change, just update the filter.
     *
     * ```
     * let albums = render("#album-template")
     *   .mapList(expensiveOperation)
     *   .cache();
     *
     * // Then, on minimumRating changes...
     *
     * albums.
     *   .filter(album => album.rating >= minimumRating)
     *   .into("#content");
     * ```
     */
    cache(): Promise<Render<A>>;
}
/**
 * Initialize the Render API with a selector string or HTMLTemplateElement.
 *
 * @param target - a string representing the template, or the template itself.
 * @returns The initialized renderer.
 */
export declare function render(target: string | HTMLTemplateElement): Render<any>;
export {};
