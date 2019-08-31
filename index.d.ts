declare type Data = {
    [_: string]: any;
};
export declare function render(template: string, data: Data): DocumentFragment;
export declare function render(template: HTMLTemplateElement, data: Data): DocumentFragment;
export declare function render(fragment: DocumentFragment, data: Data): DocumentFragment;
export {};
