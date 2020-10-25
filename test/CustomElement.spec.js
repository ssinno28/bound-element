import DropdownElement from "./custom-elements/dropdown";
import {JSDOM} from "jsdom"
import CustomElement from "../base-web-component/custom-element/customElement";

const dom = new JSDOM()

describe('CustomElement', () => {
    let dropdown;
    beforeEach(() => {
        dropdown = new DropdownElement('my-custom-element', 'select', dom.window.document);
        dropdown.render([
            {
                id: 1,
                name: "test"
            }
        ]);
    });

    test('renders template', () => {
        const options = dropdown.element.querySelectorAll('option');
        expect(options.length).toBe(2);
    });

    test('calls on change', () => {
        const onDropdownChangeMock = jest.fn();
        dropdown.onChange(onDropdownChangeMock, false);

        const evt = document.createEvent("HTMLEvents");
        evt.initEvent("change", false, true);
        dropdown.element.dispatchEvent(evt);
        expect(onDropdownChangeMock).toHaveBeenCalled();
    });

    test('calls on click', () => {
        const onClickMock = jest.fn();
        dropdown.onClick(onClickMock, false);

        const evt = document.createEvent("HTMLEvents");
        evt.initEvent("click", false, true);
        dropdown.element.dispatchEvent(evt);
        expect(onClickMock).toHaveBeenCalled();
    });

    test('calls on mouse over', () => {
        const onMouseOver = jest.fn();
        dropdown.onMouseOver(onMouseOver, false);

        const evt = document.createEvent("HTMLEvents");
        evt.initEvent("mouseover", false, true);
        dropdown.element.dispatchEvent(evt);
        expect(onMouseOver).toHaveBeenCalled();
    });

    test('calls on mouse out', () => {
        const onMouseOut = jest.fn();
        dropdown.onMouseOut(onMouseOut, false);

        const evt = document.createEvent("HTMLEvents");
        evt.initEvent("mouseout", false, true);
        dropdown.element.dispatchEvent(evt);
        expect(onMouseOut).toHaveBeenCalled();
    });

    test('creates element when string name is passed in', () => {
        const customElement =
            new CustomElement('my-custom-element', 'select', dom.window.document);

        expect(customElement.element.tagName).toBe('SELECT');
    });

    test('creates element when dom element passed in', () => {
        const selectElement = document.createElement('select');
        const customElement =
            new CustomElement('my-custom-element', selectElement, dom.window.document);

        expect(customElement.element.tagName).toBe('SELECT');
    });

    test('render binds elements and events', () => {
        const customElement =
            new CustomElement('my-custom-element', 'select', dom.window.document);

        customElement.bindElements = jest.fn();
        customElement.bindEvents = jest.fn();

        customElement.template(() => `<select></select>`);
        customElement.render();

        expect(customElement.bindElements).toHaveBeenCalled();
        expect(customElement.bindEvents).toHaveBeenCalled();
    });

    test('bindElements creates custom element instances', () => {
        const customElement =
            new CustomElement('my-custom-element', 'div', dom.window.document);

        customElement.setInnerHtml(`<input element-name="text-input" type="text" />`);
        customElement.bindElements();

        expect(customElement.textInputEl).toBeTruthy();
    });
});