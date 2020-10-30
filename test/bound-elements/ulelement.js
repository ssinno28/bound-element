import BoundElement from "../../bound-element/main"
import * as _ from "lodash";
import LiElement from "./lielement";

export default class UlElement extends BoundElement {
    constructor(name, elementType, parent) {
        super(name, elementType, parent);
        this.childElementTypes.push(LiElement);

        this.template((options) => {
            return `
            ${_.map(options, function (text) {
                return `<li bind-as="li-element">${text}</li>`;
            }).join("")}`
        });
    }
}