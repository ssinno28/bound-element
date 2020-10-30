# Bound Element

![CI](https://github.com/ssinno28/bound-element/workflows/CI/badge.svg)

The purpose of this library is to have the ability two work with elements without having to query them in the dom. It is setup in a manner
to easily work with server side frameworks that generate most of the markup. 

The first think you'll want to do is bind the body element (or any parent element that contains elements with bind-as):

```javascript
const bodyEl = document.querySelector('body');
const bodyBoundElement = new BoundElement('body', bodyEl);
```  

By binding the body element, we have now setup a top level bound element that will then quickly
run through its child elements and bind any elements that are necessary.

Next you'll want to create a class that extends BoundElement:

```javascript
export default class Dropdown extends BoundElement {
    constructor(name, elementType, parent) {
        super(name, elementType, parent);

        this.template((options) => {
            return `<option selector-template-id="0">New</option>
            ${_.map(options, function (option) {
                return `<option value="${option.id}">${option.name}</option>`;
            }).join("")}`
        });

        this.onChange(_.bind(this.onDropdownChange, this), false);
    }

    onDropdownChange(event) {
        const test = 1;
    }
}
``` 

By doing this you can add your own custom functionality to an element that includes listening to events and
setting the template.

```html
<body>
<select bind-as="dropdown"></select>
</body>
```

Now if you want to reference child elements you can easily do that since the child elements are added
as properties:
```javascript
bodyBoundElement.dropdown
```

