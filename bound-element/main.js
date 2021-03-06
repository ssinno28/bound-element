import {eventsMixin} from "./mixins/events";
import bind from 'lodash/bind';
import each from 'lodash/each';
import isEmpty from 'lodash/isEmpty';
import find from 'lodash/find';
import extend from 'lodash/extend';
import camelCase from 'lodash/camelCase';
import isFunction from 'lodash/isFunction';
import isNil from 'lodash/isNil';
import isNull from 'lodash/isNull';
import isUndefined from 'lodash/isUndefined';
import upperFirst from 'lodash/upperFirst';

const getClosest = function (elem, selector) {
    elem = elem.parentNode;
    for (; elem && elem !== document; elem = elem.parentNode) {
        if (elem.matches(selector)) return elem;
    }
    return null;
};

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
        this._children = {};
        this._childElementTypes = [];
        this._eventRemovals = [];
        this._eventAdditions = [];
        this._template = null;
        this._name = name;

        if (typeof elementType === 'string') {
            this._element = document.createElement(elementType);
            this._element.setAttribute('bind-as', name);
        } else {
            this._element = elementType;
        }

        this._id = this.getUniqueSelector();

        this._getChildElementType = function (typeName, boundElement) {
            if (isNull(boundElement)) return undefined;

            const customElementType =
                find(boundElement.childElementTypes, function (childElementType) {
                    return childElementType.name === typeName;
                });

            if (!isUndefined(customElementType)) {
                return customElementType;
            }

            return this._getChildElementType(typeName, boundElement.parent);
        }

        this._getBoundElementObject = function (elementName, childElement, index) {
            const customElementType =
                this._getChildElementType(upperFirst(camelCase(elementName)), this);

            const boundElement = !isUndefined(customElementType)
                ? new customElementType(elementName, childElement, this)
                : new BoundElement(elementName, childElement, this);

            boundElement.index = index;

            const onCreateMethodName = camelCase(`on-${elementName}-create`);
            if (isFunction(this[onCreateMethodName])) {
                this[onCreateMethodName](boundElement, index);
            }

            return boundElement;
        }

        this._addBoundElement = function (elementName, childElement) {
            let existingCustomEl = this[camelCase(elementName + 'El')];
            if (!isUndefined(existingCustomEl)) {
                console.log(`element with name ${elementName} is already defined`);

                let boundElement;
                if (Array.isArray(existingCustomEl)) {
                    boundElement = this._getBoundElementObject(elementName, childElement, existingCustomEl.length);
                    existingCustomEl.push(boundElement);
                } else {
                    boundElement = this._getBoundElementObject(elementName, childElement, 1)
                    const elementArray = [existingCustomEl];
                    elementArray.push(boundElement);
                    this[camelCase(elementName + 'El')] = elementArray;
                    this.children[elementName] = elementArray;
                }

                return boundElement;
            } else {
                const boundElement = this._getBoundElementObject(elementName, childElement, 0);

                this[camelCase(elementName) + 'El'] = boundElement;

                this.children[elementName] = boundElement;
                return boundElement;
            }
        }

        this.bindElements();
    }

    generateId() {
        // Math.random should be unique because of its seeding algorithm.
        // Convert it to base 36 (numbers + letters), and grab the first 9 characters
        // after the decimal.
        return '_' + Math.random().toString(36).substr(2, 9);
    };

    render() {
        if (isNull(this._template)) {
            console.log(`No template set for element ${this.name}`);
            return;
        }

        this.unbindElements();
        this.element.innerHTML = this._template(...arguments);
        this.bindElements();

        // adding events after render
        this.bindEvents();

        if (isFunction(this.onRender)) {
            this.onRender();
        }

        return this;
    }

    bindElements() {
        const childElements = this.element.querySelectorAll('[bind-as]');
        each(childElements, bind(function (childElement) {
            const parentEl = getClosest(childElement, '[bind-as]');
            if (parentEl !== null) {
                const parentElBindAs = parentEl.getAttribute('bind-as');
                if (parentElBindAs !== this.name) {
                    return;
                }
            }

            const elementName = childElement.getAttribute('bind-as');
            this._addBoundElement(elementName, childElement);
        }, this));

        return this;
    }

    template(func) {
        this._template = func;
        return this;
    }

    setAttribute(name, value) {
        this.element.setAttribute(name, value);
        return this;
    }

    unbindElements() {
        return this.unbindElementsRecursive(this.children);
    }

    unbindElementsRecursive(children) {
        const unbindElement = bind(function (childElement) {
            const name = childElement.element.getAttribute('bind-as');

            delete this[camelCase(name + 'El')];
            childElement.unbindEvents();

            if (!isEmpty(childElement.children)) {
                this.unbindElementsRecursive(childElement.children);
            }
        }, this);

        each(Object.keys(children), bind(function (key) {
            const childElement = children[key];
            if (Array.isArray(childElement)) {
                each(childElement, function (child) {
                    unbindElement(child);
                })
            } else {
                unbindElement(childElement);
            }
        }, this));

        this.children = {};
        this.unbindEvents();
        return this;
    }

    getParentElement(name) {
        let parent = this.parent;
        for (; !isNil(parent); parent = parent.parent) {
            if (parent.name === name) return parent;
        }

        return null;
    }

    getElement(name) {
        return this.getElementRecursive(name, this.children);
    }

    getElementRecursive(name, children) {
        let element = null;
        each(Object.keys(children), bind(function (key) {
            const customElement = children[key];
            if (key === name) {
                element = customElement;
                return false;
            }

            if (!isEmpty(customElement.children)) {
                element = this.getElementRecursive(name, customElement.children);
            }

            if (!isNull(element)) return false;
        }, this));

        return element;
    }

    remove() {
        this.unbindEvents();
        this.unbindElements();
        this.element.remove();
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

extend(BoundElement.prototype, eventsMixin);