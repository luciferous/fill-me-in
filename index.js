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
export const Modifiers = {
    textContent: textContent,
    unpackObject: unpackObject,
    imageSource: imageSource
};
const defaultModifiers = [
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
 * @param replace - When true, replace the template with the rendered fragment.
 * @param modifiers - How values modify the target element.
 * @returns Document fragment of the rendered template.
 */
export function render(target, values, options) {
    options = Object.assign({
        replace: false,
        modifiers: defaultModifiers
    }, options || {});
    if (typeof target === "string") {
        let template = document.querySelector(target);
        if (template instanceof HTMLTemplateElement) {
            return render(template, values, options);
        }
        throw new Error(`template not found: ${target}`);
    }
    else if (target instanceof HTMLTemplateElement) {
        let fragment = render(document.importNode(target.content, true), values, options);
        if (target.parentElement && options.replace) {
            target.parentElement.insertBefore(fragment, target);
            target.remove();
        }
        return fragment;
    }
    let refs = [];
    for (let i = 0; i < target.children.length; i++) {
        refs.push([target.children[i], values]);
    }
    go(refs, options.modifiers);
    return target;
}
function go(refs, modifiers) {
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
        if (key) {
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
                let appliedModifiers;
                if (target.hasAttribute("onmodify")) {
                    let modifier = newFunction(target.getAttribute("onmodify"));
                    target.removeAttribute("onmodify");
                    appliedModifiers = [modifier].concat(modifiers);
                }
                else {
                    appliedModifiers = modifiers;
                }
                for (let modifier of appliedModifiers) {
                    if (modifier.call(target, { target: target, value: value }) !== false)
                        break;
                }
            }
        }
    }
}
