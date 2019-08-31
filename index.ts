type Data = { [_: string]:any; };

export function render(template: string, data: Data): DocumentFragment
export function render(template: HTMLTemplateElement, data: Data): DocumentFragment
export function render(fragment: DocumentFragment, data: Data): DocumentFragment
export function render(
  target: any,
  data: Data
): DocumentFragment {
  if (typeof target === "string") {
    let template = document.querySelector(target);
    if (template instanceof HTMLTemplateElement) {
      return render(template, data);
    }
    throw new Error(`template not found: ${target}`);
  } else if (target instanceof HTMLTemplateElement) {
    let fragment = render(document.importNode(target.content, true), data);
    if (target.parentElement != null) {
      target.parentElement.appendChild(fragment);
      target.remove();
    }
    return fragment;
  } else {
    let refs: [Element, Data][] = [];
    for (let i = 0; i < target.children.length; i++) {
      refs.push([target.children[i], data]);
    }
    go(refs);
    return target;
  }
}

function go(refs: [Element, Data][]): void {
  while (refs.length > 0) {
    let [node, data] = refs.pop()!;

    let target: Element | null;
    if (node.hasAttribute("slot")) {
      target = node;
    } else {
      target = node.querySelector("[slot]");
    }

    if (!target) continue;

    let value: any;
    let key = target.getAttribute("slot");
    if (key) {
      value = data[key];
    } else {
      value = data;
    }
    target.removeAttribute("slot");

    if (Array.isArray(value)) {
      let template = target.querySelector("template")!;
      for (let item of value) {
        let clone = document.importNode(template.content, true);
        for (let i = 0; i < clone.children.length; i++) {
          refs.push([clone.children[i], item]);
        }
        template.parentElement!.appendChild(clone);
      }
      template.remove();

      if (target.hasAttribute("onempty") && value.length == 0) {
        let handler = new Function(target.getAttribute("onempty")!);
        handler.call(target);
      }
    } else {
      if (target.children.length > 0) {
        for (let i = 0; i < target.children.length; i++) {
          refs.push([target.children[i], value]);
        }
      } else {
        target.textContent = value;
      }
    }
  }
}
