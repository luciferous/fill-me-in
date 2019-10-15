function newFunction(defn) {
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
function textContent(e) {
    this.textContent = e.value.toString();
}
function unpackObject(e) {
    if (typeof e.value !== "object")
        return false;
    for (let attr of Object.keys(e.value)) {
        if (attr == "textContent") {
            this.textContent = e.value[attr];
        }
        else {
            this.setAttribute(attr, e.value[attr]);
        }
    }
}
function imageSource(e) {
    if (this.nodeName !== "IMG")
        return false;
    this.setAttribute("src", e.value.toString());
}
const defaultMods = [
    unpackObject,
    imageSource,
    textContent
];
function nullLogger(message, value) { }
function consoleLogger(message, value) {
    console.log(message, value);
}
function elementLogger(e) {
    return (message, value, ...args) => {
        let pre = document.createElement("pre");
        pre.textContent = `${message} ${JSON.stringify(value, ...args)}`;
        e.appendChild(pre);
    };
}
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
export function renderFragment(target, value, mods = defaultMods, logger = nullLogger) {
    let refs = [];
    for (let i = 0; i < target.children.length; i++) {
        refs.push([target.children[i], value]);
    }
    go(refs, mods, logger);
    return target;
}
function go(refs, mods, logger) {
    while (refs.length > 0) {
        let [node, values] = refs.pop();
        let target;
        if (node.hasAttribute("slot")) {
            target = node;
        }
        else {
            target = node.querySelector("[slot]");
            if (target) {
                refs.push([node, values]);
            }
        }
        if (!target)
            continue;
        let value;
        let key = target.getAttribute("slot");
        if (key && target.hasAttribute("print")) {
            logger(key + ":", values);
        }
        else if (key && target.hasAttribute("pprint")) {
            logger(key + ":", values, null, " ");
        }
        if (key && !Array.isArray(values) && typeof values === "object") {
            value = values[key];
        }
        else {
            value = values;
        }
        target.removeAttribute("slot");
        if (!value)
            continue;
        if (Array.isArray(value)) {
            let template = target.querySelector("template");
            for (let item of value) {
                let clone = document.importNode(template.content, true);
                for (let i = 0; i < clone.children.length; i++) {
                    refs.push([clone.children[i], item]);
                }
                template.parentElement.insertBefore(clone, template);
            }
            template.remove();
            if (target.hasAttribute("onempty") && value.length == 0) {
                let handler = newFunction(target.getAttribute("onempty"));
                target.removeAttribute("onempty");
                handler.call(target, { target: target, value: "" });
            }
        }
        else {
            if (target.children.length > 0) {
                for (let i = 0; i < target.children.length; i++) {
                    refs.push([target.children[i], value]);
                }
            }
            else {
                let appliedMods = [];
                if (target.hasAttribute("onmodify")) {
                    let mod = newFunction(target.getAttribute("onmodify"));
                    target.removeAttribute("onmodify");
                    appliedMods = [mod].concat(mods);
                }
                else {
                    appliedMods = mods;
                }
                for (let mod of appliedMods) {
                    if (mod.call(target, { target: target, value: value }) !== false)
                        break;
                }
            }
        }
    }
}
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
class Render {
    constructor(template, apply, mods) {
        this.template = template;
        this.apply = apply;
        this.mods = mods;
    }
    andThen(fn) {
        return new Render(this.template, a => fn(this.apply(a)), this.mods);
    }
    /**
     * Specify values statically, instead values fetched from `data-src`.
     */
    withValue(value) {
        return this.andThen(state => Object.assign(state, { value: value }));
    }
    /**
     * Map over content transforming it with `f`.
     */
    map(mapFn) {
        return this.andThen(state => Object.assign(state, { value: mapFn(state.value) }));
    }
    /**
     * Map over content transforming it with `f`.
     */
    mapList(mapFn) {
        return this.andThen(state => Object.assign(state, { value: state.value.map(mapFn) }));
    }
    /**
     * Fold over the content to transform it with `reduceFn`.
     */
    reduce(reduceFn, initial) {
        return this.andThen(state => Object.assign(state, { value: state.value.reduce(reduceFn, initial) }));
    }
    /**
     * Remove content, keeping only that which matches `predicate`.
     */
    filter(predicate) {
        return this.andThen(state => Object.assign(state, { value: state.value.filter(predicate) }));
    }
    /**
     * Runs render with the built customizations.
     */
    async asFragment() {
        const state = await this.run();
        const value = state.value;
        const mods = state.mods;
        let logger = nullLogger;
        if (this.template.hasAttribute("debug")) {
            logger = consoleLogger;
            let arg = this.template.getAttribute("debug");
            if (arg) {
                let element = document.querySelector(arg);
                if (element)
                    logger = elementLogger(element);
            }
        }
        if (Array.isArray(value)) {
            let fragment = document.createDocumentFragment();
            for (let i = 0; i < value.length; i++) {
                let target = document.importNode(this.template.content, true);
                fragment.appendChild(renderFragment(target, value[i], mods, logger));
            }
            return fragment;
        }
        let target = document.importNode(this.template.content, true);
        return renderFragment(target, value, mods, logger);
    }
    /**
     * Runs asFragment and inserts the document fragment into the target,
     * replacing its contents.
     */
    async into(target) {
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
    async run() {
        if (this.apply.fromCache) {
            return this.apply({
                value: undefined,
                mods: this.mods
            });
        }
        let url = this.template.getAttribute("data-src");
        if (!url) {
            return this.apply({
                value: undefined,
                mods: this.mods
            });
        }
        const response = await fetch(url);
        const json = await response.json();
        return this.apply({
            value: json,
            mods: this.mods
        });
    }
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
    async cache() {
        const state = await this.run();
        let k = (_) => state;
        k.fromCache = true;
        return new Render(this.template, k, state.mods);
    }
}
/**
 * Initialize the Render API with a selector string or HTMLTemplateElement.
 *
 * @param target - a string representing the template, or the template itself.
 * @returns The initialized renderer.
 */
export function render(target) {
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
document.querySelectorAll("template[data-embed]").forEach(async function (template) {
    if (!(template instanceof HTMLTemplateElement))
        return;
    if (!template.parentElement)
        return;
    const fragment = await render(template).asFragment();
    template.parentElement.insertBefore(fragment, template);
});
