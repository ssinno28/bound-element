import * as _ from "lodash";
import {eventsMixin} from "./mixins/events";

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
            if (_.isNull(boundElement)) return undefined;

            const customElementType =
                _.find(boundElement.childElementTypes, function (childElementType) {
                    return childElementType.name === typeName;
                });

            if (!_.isUndefined(customElementType)) {
                return customElementType;
            }

            return this._getChildElementType(typeName, boundElement.parent);
        }

        this._getBoundElementObject = function (elementName, childElement) {
            const customElementType =
                this._getChildElementType(_.upperFirst(_.camelCase(elementName)), this);

            const boundElement = !_.isUndefined(customElementType)
                ? new customElementType(elementName, childElement, this)
                : new BoundElement(elementName, childElement, this);

            return boundElement;
        }

        this._addBoundElement = function (elementName, childElement) {
            let existingCustomEl = this[_.camelCase(elementName + 'El')];
            if (!_.isUndefined(existingCustomEl)) {
                console.log(`element with name ${elementName} is already defined`);

                const boundElement = this._getBoundElementObject(elementName, childElement);
                if (Array.isArray(existingCustomEl)) {
                    existingCustomEl.push(boundElement);
                } else {
                    const elementArray = [existingCustomEl];
                    elementArray.push(boundElement);
                    this[_.camelCase(elementName + 'El')] = elementArray;
                    this.children[elementName] = elementArray;
                }

                return boundElement;
            } else {
                const boundElement = this._getBoundElementObject(elementName, childElement);

                this[_.camelCase(elementName) + 'El'] = boundElement;

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
        if (_.isNull(this._template)) {
            console.log(`No template set for element ${this.name}`);
            return;
        }

        this.unbindElements();
        this.element.innerHTML = this._template(...arguments);
        this.bindElements();

        // adding events after render
        this.bindEvents();

        if (_.isFunction(this.onRender)) {
            this.onRender();
        }

        return this;
    }

    bindElements() {
        const childElements = this.element.querySelectorAll('[bind-as]');
        _.each(childElements, _.bind(function (childElement) {
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

    setInnerHtml(html) {
        this.element.innerHTML = html;
        return this;
    }

    setValue(value) {
        this.element.value = value;
        return this;
    }

    setName(name) {
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

    setAttribute(name, value) {
        this.element.setAttribute(name, value);
        return this;
    }

    unbindElements() {
        return this.unbindElementsRecursive(this.children);
    }

    unbindElementsRecursive(children) {
        const unbindElement = _.bind(function (childElement) {
            const name = childElement.element.getAttribute('bind-as');

            delete this[_.camelCase(name + 'El')];
            childElement.unbindEvents();

            if (!_.isEmpty(childElement.children)) {
                this.unbindElementsRecursive(childElement.children);
            }
        }, this);

        _.each(Object.keys(children), _.bind(function (key) {
            const childElement = children[key];
            if (Array.isArray(childElement)) {
                _.each(childElement, function (child) {
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
        for (; !_.isNil(parent); parent = parent.parent) {
            if (parent.name === name) return parent;
        }

        return null;
    }

    getElement(name) {
        return this.getElementRecursive(name, this.children);
    }

    getElementRecursive(name, children) {
        let element = null;
        _.each(Object.keys(children), _.bind(function (key) {
            const customElement = children[key];
            if (key === name) {
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

_.extend(BoundElement.prototype, eventsMixin);