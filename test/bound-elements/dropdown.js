import BoundElement from "../../bound-element/main"
import * as _ from "lodash";

export default class Dropdown extends BoundElement {
    constructor(name, elementType, parent) {
        super(name, elementType, parent);

        this.template((options) => {
            return `<option selector-template-id="0">New</option>
            ${_.map(options, function (selectorTpl) {
                return `<option bind-as="option" value="${selectorTpl.id}">${selectorTpl.name}</option>`;
            }).join("")}`
        });

        this.onChange(_.bind(this.onDropdownChange, this), false);
    }

    onDropdownChange(event) {
        const test = 1;
    }
}