function newFunction(defn) {
    var ix0 = defn.indexOf("function(");
    if (ix0 == -1) {
        return new Function(defn);
    }
    ix0 += "function(".length;
    var ix1 = defn.indexOf(")", ix0);
    if (ix1 == -1) {
        throw new Error("expected ')' after index " + ix0 + ": " + defn);
    }
    ix1 += 1;
    var ix2 = defn.indexOf("{", ix1);
    if (ix2 == -1) {
        throw new Error("expected '{' after index " + ix1 + ": " + defn);
    }
    ix2 += 1;
    var ix3 = defn.lastIndexOf("}");
    if (ix3 == -1) {
        throw new Error("expected '}': " + defn);
    }
    var args = defn.substring(ix0, ix1 - 1);
    var body = defn.substring(ix2, ix3);
    return new Function(args, body);
}
function textContent(e) {
    this.textContent = e.value.toString();
}
function unpackObject(e) {
    if (typeof e.value !== "object")
        return false;
    for (var _i = 0, _a = Object.keys(e.value); _i < _a.length; _i++) {
        var attr = _a[_i];
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
export var Modifiers = {
    textContent: textContent,
    unpackObject: unpackObject,
    imageSource: imageSource
};
var defaultModifiers = [
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
        var template = document.querySelector(target);
        if (template instanceof HTMLTemplateElement) {
            return render(template, values, options);
        }
        throw new Error("template not found: " + target);
    }
    else if (target instanceof HTMLTemplateElement) {
        var fragment = render(document.importNode(target.content, true), values, options);
        if (target.parentElement && options.replace) {
            target.parentElement.insertBefore(fragment, target);
            target.remove();
        }
        return fragment;
    }
    var refs = [];
    for (var i = 0; i < target.children.length; i++) {
        refs.push([target.children[i], values]);
    }
    go(refs, options.modifiers);
    return target;
}
function go(refs, modifiers) {
    while (refs.length > 0) {
        var _a = refs.pop(), node = _a[0], values = _a[1];
        var target = void 0;
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
        var value = void 0;
        var key = target.getAttribute("slot");
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
            var template = target.querySelector("template");
            for (var _i = 0, value_1 = value; _i < value_1.length; _i++) {
                var item = value_1[_i];
                var clone = document.importNode(template.content, true);
                for (var i = 0; i < clone.children.length; i++) {
                    refs.push([clone.children[i], item]);
                }
                template.parentElement.insertBefore(clone, template);
            }
            template.remove();
            if (target.hasAttribute("onempty") && value.length == 0) {
                var handler = newFunction(target.getAttribute("onempty"));
                target.removeAttribute("onempty");
                handler.call(target, { target: target, value: "" });
            }
        }
        else {
            if (target.children.length > 0) {
                for (var i = 0; i < target.children.length; i++) {
                    refs.push([target.children[i], value]);
                }
            }
            else {
                var appliedModifiers = void 0;
                if (target.hasAttribute("onmodify")) {
                    var modifier = newFunction(target.getAttribute("onmodify"));
                    target.removeAttribute("onmodify");
                    appliedModifiers = [modifier].concat(modifiers);
                }
                else {
                    appliedModifiers = modifiers;
                }
                for (var _b = 0, appliedModifiers_1 = appliedModifiers; _b < appliedModifiers_1.length; _b++) {
                    var modifier = appliedModifiers_1[_b];
                    if (modifier.call(target, { target: target, value: value }) !== false)
                        break;
                }
            }
        }
    }
}
