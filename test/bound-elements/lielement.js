import BoundElement from "../../bound-element/main"
import * as _ from "lodash";

export default class LiElement extends BoundElement {
    constructor(name, elementType, parent) {
        super(name, elementType, parent);

        this.onClick(_.bind(this.onClick, this), false);
    }

    onClick(event) {
        const test = 1;
    }
}