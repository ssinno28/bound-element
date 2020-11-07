import BoundElement from "../../bound-element/main"
import * as _ from "lodash";
import Dropdown from "./dropdown";

export default class MutlipleChild extends BoundElement {
    constructor(name, elementType, parent) {
        super(name, elementType, parent);
        this.childElementTypes.push(Dropdown);

        this.template((options) => {
            return `
<div bind-as="first-div">
<select bind-as="dropdown"></select>
</div>
<div bind-as="second-div"></div>
`
        });
    }
}