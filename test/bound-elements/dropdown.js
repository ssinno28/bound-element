import BoundElement from "../../bound-element/main"

export default class Dropdown extends BoundElement {
    constructor(name, elementType, parent) {
        super(name, elementType, parent);

        this.template((options) => {
            return `<option selector-template-id="0">New</option>
            ${options.map(function (selectorTpl) {
                return `<option bind-as="option" value="${selectorTpl.id}">${selectorTpl.name}</option>`;
            }).join("")}`
        });

        this.onChange(this.onDropdownChange.bind(this), false);
    }

    onDropdownChange(event) {
        const test = 1;
    }
}