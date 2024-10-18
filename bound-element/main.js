import {eventsMixin} from "./mixins/events";

const getClosest = function (elem, selector) {
    elem = elem.parentNode;
    for (; elem && elem !== document; elem = elem.parentNode) {
        if (elem.matches(selector)) return elem;
    }
    return null;
};

const camelCase = function(str) {
    return str
        .replace(/\-(.)/g, function($1) { return $1.toUpperCase(); })
        .replace(/\-/g, '')
        .replace(/^(.)/, function($1) { return $1.toLowerCase(); });
}

function upperFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

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
            if (boundElement === null) return undefined;

            const customElementType = boundElement.childElementTypes.find(function (childElementType) {
                return childElementType.name === typeName;
            });

            if (customElementType) {
                return customElementType;
            }

            return this._getChildElementType(typeName, boundElement.parent);
        }

        this._getBoundElementObject = function (elementName, childElement, index) {
            const customElementType =
                this._getChildElementType(upperFirst(camelCase(elementName)), this);

            const boundElement = customElementType
                ? new customElementType(elementName, childElement, this)
                : new BoundElement(elementName, childElement, this);

            boundElement.index = index;

            const onCreateMethodName = camelCase(`on-${elementName}-create`);
            if (typeof this[onCreateMethodName] === 'function') {
                this[onCreateMethodName](boundElement, index);
            }

            return boundElement;
        }

        this._addBoundElement = function (elementName, childElement) {
            let existingCustomEl = this[camelCase(elementName + 'El')];
            if (existingCustomEl) {
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
        if (this._template === null) {
            console.log(`No template set for element ${this.name}`);
            return;
        }

        this.unbindElements();
        this.element.innerHTML = this._template(...arguments);
        this.bindElements();

        // adding events after render
        this.bindEvents();

        if (typeof this.onRender === 'function') {
            this.onRender();
        }

        return this;
    }

    bindElements() {
        const childElements = this.element.querySelectorAll('[bind-as]');
        childElements.forEach(function (childElement) {
            const parentEl = getClosest(childElement, '[bind-as]');
            if (parentEl !== null) {
                const parentElBindAs = parentEl.getAttribute('bind-as');
                if (parentElBindAs !== this.name) {
                    return;
                }
            }

            const elementName = childElement.getAttribute('bind-as');
            this._addBoundElement(elementName, childElement);
        }.bind(this));

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
        const unbindElement = function (childElement) {
            const name = childElement.element.getAttribute('bind-as');

            delete this[camelCase(name + 'El')];
            childElement.unbindEvents();

            if (childElement.children && childElement.children.length > 0) {
                this.unbindElementsRecursive(childElement.children);
            }
        }.bind(this);

        Object.keys(children).forEach(function (key) {
            const childElement = children[key];
            if (Array.isArray(childElement)) {
                childElement.forEach(function (child) {
                    unbindElement(child);
                });
            } else {
                unbindElement(childElement);
            }
        }.bind(this));

        this.children = {};
        this.unbindEvents();
        return this;
    }

    getParentElement(name) {
        let parent = this.parent;
        for (; parent !== null && parent !== undefined; parent = parent.parent) {
            if (parent.name === name) return parent;
        }

        return null;
    }

    getElement(name) {
        return this.getElementRecursive(name, this.children);
    }

    getElementRecursive(name, children) {
        let element = null;
        Object.keys(children).forEach(function (key) {
            const customElement = children[key];
            if (key === name) {
                element = customElement;
                return;
            }

            if (customElement.children) {
                const foundElement = this.getElementRecursive(name, customElement.children);
                if(foundElement !== null) {
                    element = foundElement;
                }
            }

            if (element !== null) return;
        }.bind(this));

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

Object.assign(BoundElement.prototype, eventsMixin);