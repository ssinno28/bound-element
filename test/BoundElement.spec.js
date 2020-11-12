import DropdownElement from "./bound-elements/dropdown";
import {JSDOM} from "jsdom"
import BoundElement from "../bound-element/main";
import UlElement from "./bound-elements/ulelement";
import MutlipleChild from "./bound-elements/multipleChild";
import multipleChild from "./bound-elements/multipleChild";

const dom = new JSDOM()

describe('Main', () => {
    let dropdown;
    beforeEach(() => {
        dropdown = new DropdownElement('my-bound-element', 'select', null);
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
            new BoundElement('my-bound-element', 'select', null);

        expect(customElement.element.tagName).toBe('SELECT');
    });

    test('creates element when dom element passed in', () => {
        const selectElement = document.createElement('select');
        const customElement =
            new BoundElement('my-bound-element', selectElement, null);

        expect(customElement.element.tagName).toBe('SELECT');
    });

    test('render binds elements and events', () => {
        const customElement =
            new BoundElement('my-bound-element', 'select', null);

        customElement.bindElements = jest.fn();
        customElement.bindEvents = jest.fn();

        customElement.template(() => `<select></select>`);
        customElement.render();

        expect(customElement.bindElements).toHaveBeenCalled();
        expect(customElement.bindEvents).toHaveBeenCalled();
    });

    test('bindElements creates custom element instances', () => {
        const customElement =
            new BoundElement('my-bound-element', 'div', null);

        customElement.setInnerHtml(`<input bind-as="text-input" type="text" />`);
        customElement.bindElements();

        expect(customElement.textInputEl).toBeTruthy();
    });

    test('remove unbinds and destroys all children', () => {
        const ulElement = new UlElement('ul-element', 'ul', null);
        ulElement.render(['test', 'test2']);

        const evt = document.createEvent("HTMLEvents");
        evt.initEvent("click", false, true);

        const firstLi = ulElement.liElementEl[0];
        firstLi.onClick = jest.fn();

        ulElement.remove();
        firstLi.element.dispatchEvent(evt);

        const boundElements = dom.window.document.querySelectorAll('[bind-as]');
        const queriedUlElement = dom.window.document.querySelectorAll('ul');
        expect(firstLi.onClick).toHaveBeenCalledTimes(0);
        expect(boundElements.length).toBe(0);
        expect(queriedUlElement.length).toBe(0);
    });

    test('adding multiple children with same bind-as creates array', () => {
        const ulElement = new UlElement('ul-element', 'ul', null);
        ulElement.render(['test', 'test2']);

        expect(Array.isArray(ulElement.liElementEl)).toBeTruthy();
    });

    test('adding multiple children with different bind-as creates object', () => {
        const mutlipleChild = new MutlipleChild('mutliple-child', 'div', null);
        mutlipleChild.render();

        expect(!Array.isArray(mutlipleChild.firstDivEl)).toBeTruthy();
        expect(!Array.isArray(mutlipleChild.secondDivEl)).toBeTruthy();
    });

    test('calling render again unbinds child elements', () => {
        const multipleChild = new MutlipleChild('mutliple-child', 'div', null);
        multipleChild.unbindElements = jest.fn();

        multipleChild.render();

        expect(multipleChild.unbindElements).toHaveBeenCalled();
    });

    test('binds all child elements correctly', () => {
        const boundElement =
            new BoundElement('bound-element', 'div', null);

        boundElement.template(() => `
        <div bind-as="first-test">
            <div bind-as="third-test"></div>
        </div>
        <div>
        <div bind-as="second-test"></div>
        </div>
        `);

        boundElement.render();

        expect(boundElement.secondTestEl).toBeTruthy();
        expect(boundElement.thirdTestEl).toBeFalsy();
    });

    test('recursively finds parent', () => {
        const boundElement =
            new BoundElement('bound-element', 'div', null);

        boundElement.template(() => `
        <div bind-as="first-test">
            <div bind-as="third-test">
            <div bind-as="forth-test"></div>
</div>
        </div>
        <div>
        <div bind-as="second-test"></div>
        </div>
        `);

        boundElement.render();

        const forthTestEl = boundElement.getElement('forth-test');
        const parentEl = forthTestEl.getParentElement('first-test');

        expect(parentEl.name).toBe('first-test');
    });

    test('recursively finds child element type', () => {
        const multipleChild =
            new MutlipleChild('mutliple-child', 'div', null);
        multipleChild.render();

        expect(multipleChild.firstDivEl.dropdownEl.constructor.name).toBe('Dropdown');
    });

    test('calls onRender when method specified', () => {
        const boundElement =
            new BoundElement('bound-element', 'div', null);

        boundElement.template(() => `
        <div bind-as="first-test"></div>
        `);

        boundElement.onRender = jest.fn();
        boundElement.render();

        expect(boundElement.onRender).toHaveBeenCalled();
    });
});