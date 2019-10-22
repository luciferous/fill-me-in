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
const defaultMods = [
    textContent
];
function nullLogger(message, value, ...args) { }
function consoleLogger(message, value, ...args) {
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
function hasSlotAttributes(node) {
    for (let name of node.getAttributeNames()) {
        if (name.startsWith("slot-"))
            return true;
    }
    return false;
}
function findNextSlot(nodes) {
    while (nodes.length > 0) {
        let node = nodes.pop();
        if (node.hasAttribute("slot"))
            return node;
        for (let name of node.getAttributeNames()) {
            if (name.startsWith("slot-"))
                return node;
        }
        nodes.push(...node.children);
    }
    return null;
}
function go(refs, mods, logger) {
    while (refs.length > 0) {
        let [node, values] = refs.pop();
        let target;
        if (node.hasAttribute("slot")) {
            target = node;
        }
        else if (hasSlotAttributes(node)) {
            target = node;
            refs.push([node, values]);
        }
        else {
            target = findNextSlot([node]);
            if (target) {
                refs.push([node, values]);
            }
        }
        if (!target)
            continue;
        for (let name of target.getAttributeNames()) {
            if (!name.startsWith("slot-"))
                continue;
            let attr = target.getAttribute(name);
            target.removeAttribute(name);
            let key = name.slice("slot-".length);
            if (attr && attr in values) {
                target.setAttribute(key, values[attr].toString());
            }
            else if (key in values) {
                target.setAttribute(key, values[key].toString());
            }
        }
        if (!target.hasAttribute("slot"))
            continue;
        let key = target.getAttribute("slot");
        if (target.hasAttribute("print")) {
            logger((key !== null && key !== void 0 ? key : ""), values);
        }
        else if (target.hasAttribute("pprint")) {
            logger((key !== null && key !== void 0 ? key : ""), values, null, " ");
        }
        let value;
        if (key && !Array.isArray(values) && typeof values === "object") {
            if (key in values) {
                value = values[key];
            }
            else if (!target.hasChildNodes()) {
                throw new Error(`'${key}' not found: ${JSON.stringify(values)}`);
            }
        }
        else {
            value = values;
        }
        target.removeAttribute("slot");
        if (!value)
            continue;
        if (Array.isArray(value)) {
            let template = (target instanceof HTMLTemplateElement) ? target : target.querySelector("template");
            if (!template) {
                throw new Error("expected <template> for list items");
            }
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
    constructor(template, apply, mods, value) {
        this.template = template;
        this.apply = apply;
        this.mods = mods;
        this.value = value;
    }
    andThen(fn) {
        return new Render(this.template, a => fn(this.apply(a)), this.mods, this.value);
    }
    /**
     * Specify values statically, instead values fetched from `data-src`.
     */
    withValue(value) {
        return this.andThen(state => Object.assign(state, { value: value }));
    }
    /**
     * Map over content transforming it with `mapFn`.
     */
    map(mapFn) {
        return this.andThen(state => Object.assign(state, { value: mapFn(state.value) }));
    }
    /**
     * Map over a list transforming it with `mapFn`.
     */
    mapList(mapFn) {
        return this.andThen(state => Object.assign(state, { value: state.value.map(mapFn) }));
    }
    /**
     * FlatMap over a list transforming it with `flatMapFn`.
     */
    flatMapList(flatMapFn) {
        return this.andThen(state => Object.assign(state, { value: state.value.flatMap(flatMapFn) }));
    }
    /**
     * Fold over the content to transform it with `reduceFn`.
     */
    reduce(reduceFn, initial) {
        return this.andThen(state => Object.assign(state, { value: state.value.reduce(reduceFn, initial) }));
    }
    /**
     * Groups elements of a list by `groupFn`.
     */
    groupBy(groupFn) {
        return this.andThen(state => Object.assign(state, { value: state.value.reduce(reduceFn, {}) }));
        function reduceFn(groups, b) {
            const key = groupFn(b);
            if (!(key in groups))
                groups[key] = [];
            groups[key].push(b);
            return groups;
        }
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
        try {
            const state = await this.run();
            const values = state.value;
            const mods = state.mods;
            let value;
            if (this.template.hasAttribute("slot")) {
                let key = this.template.getAttribute("slot");
                if (key && this.template.hasAttribute("print")) {
                    logger(key + ":", values);
                }
                else if (key && this.template.hasAttribute("pprint")) {
                    logger(key + ":", values, null, " ");
                }
                if (key && !Array.isArray(values) && typeof values === "object") {
                    value = values[key];
                }
                else {
                    value = values;
                }
                this.template.removeAttribute("slot");
            }
            else {
                value = values;
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
        catch (err) {
            logger(err.stack);
            throw err;
        }
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
        let url = this.template.getAttribute("data-src");
        if (!url || typeof this.value !== "undefined") {
            return this.apply({
                value: this.value,
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
        return new Render(this.template, a => a, state.mods, state.value);
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
document.querySelectorAll("template[embed]").forEach(async function (template) {
    if (!(template instanceof HTMLTemplateElement))
        return;
    if (!template.parentElement)
        return;
    const fragment = await render(template).asFragment();
    template.parentElement.insertBefore(fragment, template);
});
