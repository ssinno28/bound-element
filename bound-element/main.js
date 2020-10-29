import * as _ from "lodash";
import {eventsMixin} from "./mixins/events";

export default class BoundElement {
    get children() {
        return this._children;
    }

    set children(value) {
        this._children = value;
    }

    get childElementTypes() {
        return this._childElementTypes;
    }

    get element() {
        return this._element;
    }

    set element(value) {
        this._element = value;
    }

    get name() {
        return this._name;
    }

    get parent() {
        return this._parent;
    }

    get id() {
        return this._id;
    }

    constructor(name, elementType, parent) {
        this._parent = parent;
        this._children = [];
        this._childElementTypes = [];
        this._eventRemovals = [];
        this._eventAdditions = [];
        this._template = null;
        this._name = name;

        if (typeof elementType === 'string') {
            this._element = document.createElement(elementType);
        } else {
            this._element = elementType;
        }

        this._id = this.getUniqueSelector();
    }

    generateId() {
        // Math.random should be unique because of its seeding algorithm.
        // Convert it to base 36 (numbers + letters), and grab the first 9 characters
        // after the decimal.
        return '_' + Math.random().toString(36).substr(2, 9);
    };

    render() {
        if (_.isNull(this._template)) {
            console.log(`No template set for element ${this.name}`);
            return;
        }

        // this.unbindElements();
        this.element.innerHTML = this._template(...arguments);
        this.bindElements();

        // adding events after render
        this.bindEvents();

        return this;
    }

    bindElements() {
        const childElements = this.element.querySelectorAll('[element-name]');
        _.each(childElements, _.bind(function (childElement) {
            const elementName = childElement.getAttribute('element-name');

            const existingCustomEl = this[_.camelCase(elementName + 'El')];
            if (!_.isUndefined(existingCustomEl)) {
                console.log(`element with name ${elementName} is already defined`);
                existingCustomEl.element = childElement;
            } else {
                const customElementType =
                    _.find(this.childElementTypes, function (childElementType) {
                        return childElementType.name === _.upperFirst(_.camelCase(elementName));
                    });

                const customElement = !_.isUndefined(customElementType)
                    ? new customElementType(elementName, childElement, this)
                    : new BoundElement(elementName, childElement, this);

                this[_.camelCase(elementName) + 'El'] = customElement;
                this.children.push(customElement);
            }
        }, this));

        return this;
    }

    setInnerHtml(html) {
        this.element.innerHTML = html;
        return this;
    }

    setValue(value){
        this.element.value = value;
        return this;
    }

    setName(name){
        this.element.name = name;
        return this;
    }

    setInnerText(text) {
        this.element.innerText = text;
        return this;
    }

    template(func) {
        this._template = func;
        return this;
    }

    toggleClass(cssClass) {
        this.element.classList.toggle(cssClass);
        return this;
    }

    hasClass(cssClass) {
        return this.element.classList.contains(cssClass);
    }

    addClass(cssClass) {
        this.element.classList.add(cssClass);
        return this;
    }

    removeClass(cssClass) {
        this.element.classList.remove(cssClass);
        return this;
    }

    addChildElement(childElement) {
        if (!_.isUndefined(this[_.camelCase(childElement.name + 'El')])) {
            throw new Error(`element with name ${childElement.name} is already defined`);
        }

        this[_.camelCase(childElement.name + 'El')] = childElement;
        this.element.append(childElement.element);
        this.children.push(childElement);

        return this;
    }

    setAttribute(name, value) {
        this.element.setAttribute(name, value);
        return this;
    }

    removeChild(childElement) {
        const name = childElement.name;
        delete this[_.camelCase(name + 'El')];

        _.remove(this.children, childElement);

        childElement.destroy();
        childElement.element.remove();
        return this;
    }

    addChild(childElement){
        const name = childElement.name;
        this[_.camelCase(name + 'El')] = childElement;

        this.element.appendChild(childElement.element);
        this.children.push(childElement);
    }

    unbindElements() {
        return this.unbindElementsRecursive(this.children);
    }

    unbindElementsRecursive(children) {
        _.each(children, _.bind(function (childElement) {
            const name = childElement.element.getAttribute('element-name');

            delete this[_.camelCase(name + 'El')];
            childElement.destroy();

            if (!_.isEmpty(childElement.children)) {
                this.unbindElementsRecursive(childElement.children);
            }
        }, this));

        this.children = [];
        this.destroy();
        return this;
    }

    createChildElement(name, type, prepend, func) {
        if (!_.isUndefined(this[_.camelCase(name + 'El')])) {
            throw new Error(`element with name ${name} is already defined`);
        }

        const childElement = new BoundElement(name, type, this);

        if (prepend) {
            this.element.prepend(childElement.element);
        } else {
            this.element.append(childElement.element);
        }

        this.children.push(childElement);
        this[_.camelCase(childElement.name + 'El')] = childElement;

        func(childElement);
        return this;
    }

    getElement(name) {
        return this.getElementRecursive(name, this.children);
    }

    getElementRecursive(name, children) {
        let element = null;
        _.each(children, _.bind(function (customElement) {
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

    getElements(name) {
        return this.getElementsRecursive(name, [], this.children);
    }

    getElementsRecursive(name, elements, children) {
        _.each(children, _.bind(function (customElement) {
            if (customElement.name === name) {
                elements.push(customElement);
            }

            if (!_.isEmpty(customElement.children)) {
                this.getElementsRecursive(name, elements, customElement.children);
            }
        }, this));

        return elements;
    }

    destroy() {
        _.each(this._eventRemovals, function (eventRemoval) {
            eventRemoval();
        });
    }

    getUniqueSelector() {
        let selector = "";

        let elementSelector = this.element;
        while (elementSelector.parentElement) {
            const siblings =
                Array.from(elementSelector.parentElement.children)
                    .filter(e => e.tagName === elementSelector.tagName);

            selector =
                (siblings.indexOf(elementSelector)
                    ? `${elementSelector.tagName}:nth-of-type(${siblings.indexOf(elementSelector) + 1})`
                    : `${elementSelector.tagName}`) + `${selector ? " > " : ""}${selector}`;
            elementSelector = elementSelector.parentElement;
        }

        return `${selector.toLowerCase()}`;
    }
}

_.extend(BoundElement.prototype, eventsMixin);