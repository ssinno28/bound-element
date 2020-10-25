import CustomElement from "./custom-element/customElement";
import * as _ from "lodash"; 

export default class BaseComponent extends HTMLElement {
    constructor() {
        super();

        this._customElements = [];

        const container =
            this.addElement('container', 'div');

        // attaches shadow tree and returns shadow root reference
        // https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow
        const shadow = this.attachShadow({mode: 'open'});
        shadow.append(container.element);
    }

    addElement(name, elementType) {
        if (!_.isNull(this.getElement(name))) {
            throw new Error(`element with name ${name} is already defined`);
        }

        const customElement = new CustomElement(name, elementType);
        this[_.camelCase(name) + 'El'] = customElement;
        this.customElements.push(customElement);

        return customElement;
    }

    getElement(name) {
        return this.getElementRecursive(name, this.customElements);
    }

    getElementRecursive(name, customElements) {
        let element = null;
        _.each(customElements, _.bind(function (customElement) {
            if (customElement.name === name) {
                element = customElement;
                return false;
            }

            if (!_.isEmpty(customElement.children)) {
                element = this.getElementRecursive(name, customElement.children);
            }

            if (!_.isNull(element)) return false;
        }, this));

        return element;
    }

    get customElements() {
        return this._customElements;
    }

    getChildren() {
        return this.getElementRecursive(this.customElements);
    }

    getChildrenRecursive(customElements) {
        let children = [];
        _.each(customElements, _.bind(function (customElement) {
            if (!_.isEmpty(customElement.children)) {
                children = children.concat(this.getChildrenRecursive(customElement.children));
            }
        }, this));

        return children;
    }

    disconnectedCallback() {
        _.each(this.getChildren(), function (child) {
            child.destroy();
        });
    }
}