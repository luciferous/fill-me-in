function textContent() {
    var _a = this, target = _a.target, value = _a.value;
    target.textContent = value.toString();
}
function unpackObject() {
    var _a = this, target = _a.target, value = _a.value;
    if (typeof value !== "object")
        return false;
    for (var _i = 0, _b = Object.keys(value); _i < _b.length; _i++) {
        var attr = _b[_i];
        if (attr == "textContent") {
            target.textContent = value[attr];
        }
        else {
            target.setAttribute(attr, value[attr]);
        }
    }
}
function imageSource() {
    var _a = this, target = _a.target, value = _a.value;
    if (target.nodeName !== "IMG")
        return false;
    target.setAttribute("src", value.toString());
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
 * @param modifier - How values modify the target element.
 * @returns Document fragment of the rendered template.
 */
export function render(target, values, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.replace, replace = _c === void 0 ? false : _c, _d = _b.modifiers, modifiers = _d === void 0 ? defaultModifiers : _d;
    if (typeof target === "string") {
        var template = document.querySelector(target);
        if (template instanceof HTMLTemplateElement) {
            return render(template, values, { replace: replace, modifiers: modifiers });
        }
        throw new Error("template not found: " + target);
    }
    else if (target instanceof HTMLTemplateElement) {
        var fragment = render(document.importNode(target.content, true), values, { replace: replace, modifiers: modifiers });
        if (target.parentElement && replace) {
            target.parentElement.insertBefore(fragment, target);
            target.remove();
        }
        return fragment;
    }
    else {
        var refs = [];
        for (var i = 0; i < target.children.length; i++) {
            refs.push([target.children[i], values]);
        }
        go(refs, modifiers);
        return target;
    }
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
                var handler = new Function(target.getAttribute("onempty"));
                target.removeAttribute("onempty");
                handler.call(target);
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
                    var modifier = (new Function(target.getAttribute("onmodify")));
                    target.removeAttribute("onmodify");
                    appliedModifiers = [modifier].concat(modifiers);
                }
                else {
                    appliedModifiers = modifiers;
                }
                for (var _b = 0, appliedModifiers_1 = appliedModifiers; _b < appliedModifiers_1.length; _b++) {
                    var modifier = appliedModifiers_1[_b];
                    if (modifier.call({ target: target, value: value }) !== false)
                        break;
                }
            }
        }
    }
}
