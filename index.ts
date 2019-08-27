export function templater(template: string, data: object, removeTemplate?: boolean): Element
export function templater(template: HTMLTemplateElement, data: object, removeTemplate?: boolean): Element
export function templater(
  template: any,
  data: object,
  removeTemplate = true
): Element {
  if (typeof template == "string") {
    let templateElement = document.querySelector(template);
    if (templateElement instanceof HTMLTemplateElement) {
      return templater(templateElement, data, removeTemplate);
    }
    throw new Error(`template not found: ${template}`);
  }

  const clone: Element = document.importNode(template.content, true);
  const node: Element = render(clone, data);
  if (template.parentElement != null) {
    template.parentElement.appendChild(node, template);
    if (removeTemplate) {
      template.remove();
    }
  }
  return node;
}

export function render(
  node: Element,
  data: { [_: string]: any; }
): Element {
  for (var i = 0; i < node.children.length; i++) {
    const child = node.children[i];

    let value: any;
    if (child.hasAttribute("data-value")) {
      value = data;
    } else {
      let key = child.getAttribute("data-key");
      if (key) {
        value = data[key];
      } else if (child.children.length > 0) {
        return render(child, data);
      }
    }

    if (!value) {
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length == 0 && child.hasAttribute("data-omit-empty")) {
        child.remove();
      } else {
        let element = child.querySelector("template");
        if (!(element instanceof HTMLTemplateElement)) {
          throw new Error(`found list without template: ${child}`);
        }

        let template = element as HTMLTemplateElement;

        for (var j = 0; j < value.length; j++) {
          let clone = document.importNode(template.content, true) as unknown;
          let fragment = render(clone as Element, value[j]);
          if (template.parentElement != null) {
            template.parentElement.appendChild(fragment);
          }
        }

        template.remove();
      }
    } else if (typeof value == "object") {
      render(child, value);
    } else {
      child.textContent = value;
    }
  }
  return node;
}
