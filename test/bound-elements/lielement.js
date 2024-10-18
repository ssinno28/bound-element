import BoundElement from "../../bound-element/main"

export default class LiElement extends BoundElement {
    constructor(name, elementType, parent) {
        super(name, elementType, parent);

        this.onClick(this.onClick.bind(this), false);
    }

    onClick(event) {
        const test = 1;
    }
}