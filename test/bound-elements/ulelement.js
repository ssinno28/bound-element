import BoundElement from "../../bound-element/main"
import LiElement from "./lielement";

export default class UlElement extends BoundElement {
    constructor(name, elementType, parent) {
        super(name, elementType, parent);
        this.childElementTypes.push(LiElement);

        this.template((options) => {
            return `
            ${options.map(function (text) {
                return `<li bind-as="li-element">${text}</li>`;
            }).join("")}`
        });
    }
}