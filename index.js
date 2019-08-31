function textContent(target, value) {
    target.textContent = value.toString();
    return true;
}
function unpackObject(target, value) {
    if (typeof value !== "object")
        return false;
    for (var _i = 0, _a = Object.keys(value); _i < _a.length; _i++) {
        var attr = _a[_i];
        if (attr == "textContent") {
            target.textContent = value[attr];
        }
        else {
            target.setAttribute(attr, value[attr]);
        }
    }
    return true;
}
function imageSource(target, value) {
    if (target.nodeName !== "IMG")
        return false;
    target.setAttribute("src", value.toString());
    return true;
}
export var Modifiers = {
    default: function (target, value) {
        if (unpackObject(target, value))
            return true;
        if (imageSource(target, value))
            return true;
        if (textContent(target, value))
            return true;
        return false;
    },
    textContent: textContent,
    unpackObject: unpackObject,
    imageSource: imageSource
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
export function render(target, values, modifier) {
    if (modifier === void 0) { modifier = Modifiers.default; }
    if (typeof target === "string") {
        var template = document.querySelector(target);
        if (template instanceof HTMLTemplateElement) {
            return render(template, values);
        }
        throw new Error("template not found: " + target);
    }
    else if (target instanceof HTMLTemplateElement) {
        var fragment = render(document.importNode(target.content, true), values);
        if (target.parentElement != null) {
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
        go(refs, modifier);
        return target;
    }
}
function go(refs, modifier) {
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
                modifier(target, value);
            }
        }
    }
}
