export function render(target, data) {
    if (typeof target === "string") {
        var template = document.querySelector(target);
        if (template instanceof HTMLTemplateElement) {
            return render(template, data);
        }
        throw new Error("template not found: " + target);
    }
    else if (target instanceof HTMLTemplateElement) {
        var fragment = render(document.importNode(target.content, true), data);
        if (target.parentElement != null) {
            target.parentElement.appendChild(fragment);
            target.remove();
        }
        return fragment;
    }
    else {
        var refs = [];
        for (var i = 0; i < target.children.length; i++) {
            refs.push([target.children[i], data]);
        }
        go(refs);
        return target;
    }
}
function go(refs) {
    while (refs.length > 0) {
        var _a = refs.pop(), node = _a[0], data = _a[1];
        var target = void 0;
        if (node.hasAttribute("slot")) {
            target = node;
        }
        else {
            target = node.querySelector("[slot]");
        }
        if (!target)
            continue;
        var value = void 0;
        var key = target.getAttribute("slot");
        if (key) {
            value = data[key];
        }
        else {
            value = data;
        }
        target.removeAttribute("slot");
        if (Array.isArray(value)) {
            var template = target.querySelector("template");
            for (var _i = 0, value_1 = value; _i < value_1.length; _i++) {
                var item = value_1[_i];
                var clone = document.importNode(template.content, true);
                for (var i = 0; i < clone.children.length; i++) {
                    refs.push([clone.children[i], item]);
                }
                template.parentElement.appendChild(clone);
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
                target.textContent = value;
            }
        }
    }
}
