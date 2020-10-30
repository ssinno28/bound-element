import BoundElement from "../../bound-element/main"
import * as _ from "lodash";

export default class MutlipleChild extends BoundElement {
    constructor(name, elementType, parent) {
        super(name, elementType, parent);

        this.template((options) => {
            return `
<div bind-as="first-div"></div>
<div bind-as="second-div"></div>
`
        });
    }
}