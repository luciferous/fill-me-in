export function templater(template, data, removeTemplate) {
    if (removeTemplate === void 0) { removeTemplate = true; }
    if (typeof template == "string") {
        var templateElement = document.querySelector(template);
        if (templateElement instanceof HTMLTemplateElement) {
            return templater(templateElement, data, removeTemplate);
        }
        throw new Error("template not found: " + template);
    }
    var clone = document.importNode(template.content, true);
    var node = render(clone, data);
    if (template.parentElement != null) {
        template.parentElement.appendChild(node, template);
        if (removeTemplate) {
            template.remove();
        }
    }
    return node;
}
export function render(node, data) {
    for (var i = 0; i < node.children.length; i++) {
        var child = node.children[i];
        var value = void 0;
        if (child.hasAttribute("data-value")) {
            value = data;
        }
        else {
            var key = child.getAttribute("data-key");
            if (key) {
                value = data[key];
            }
            else if (child.children.length > 0) {
                return render(child, data);
            }
        }
        if (!value) {
            continue;
        }
        if (Array.isArray(value)) {
            if (value.length == 0 && child.hasAttribute("data-omit-empty")) {
                child.remove();
            }
            else {
                var element = child.querySelector("template");
                if (!(element instanceof HTMLTemplateElement)) {
                    throw new Error("found list without template: " + child);
                }
                var template = element;
                for (var j = 0; j < value.length; j++) {
                    var clone = document.importNode(template.content, true);
                    var fragment = render(clone, value[j]);
                    if (template.parentElement != null) {
                        template.parentElement.appendChild(fragment);
                    }
                }
                template.remove();
            }
        }
        else if (typeof value == "object") {
            render(child, value);
        }
        else {
            child.textContent = value;
        }
    }
    return node;
}
