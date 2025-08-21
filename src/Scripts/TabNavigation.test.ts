import { TabNavigation } from "./TabNavigation";

describe("TabNavigation.findTabStops finds all focusable elements within the given element", () => {
    // Create a container element
    const container = document.createElement("div");
    container.innerHTML = `
        <a href="#">Link</a>
        <button>Button</button>
        <input type="text" />
        <textarea></textarea>
        <select><option>Option</option></select>
        <div tabindex="0">Div with tabindex</div>
        <div tabindex="-1">Div with negative tabindex</div>
        <button disabled>Disabled Button</button>
        <div style="display: none;">Hidden Div</div>
    `;

    // Mock the offsetParent property to make the test work in JSDOM
    Object.defineProperty(HTMLElement.prototype, "offsetParent", { get() { return this.parentNode; } });

    // Call the function
    const result = TabNavigation.findTabStops(container);

    test("Six focusable elements should be found", () => { expect(result.length).toBe(6); });
    test("Link should be included", () => {
        const link = container.querySelector("a");
        expect(link && result.includes(link)).toBeTruthy();
    });
    test("Button should be included", () => {
        const button = container.querySelector("button:not([disabled])") as HTMLElement;
        expect(button && result.includes(button)).toBeTruthy();
    });
    test("Input should be included", () => {
        const input = container.querySelector("input");
        expect(input && result.includes(input)).toBeTruthy();
    });
    test("Textarea should be included", () => {
        const textarea = container.querySelector("textarea");
        expect(textarea && result.includes(textarea)).toBeTruthy();
    });
    test("Select should be included", () => {
        const select = container.querySelector("select");
        expect(select && result.includes(select)).toBeTruthy();
    });
    test("Div with tabindex 0 should be included", () => {
        const divTabindex0 = container.querySelector("div[tabindex=\"0\"]") as HTMLElement;
        expect(divTabindex0 && result.includes(divTabindex0)).toBeTruthy();
    });
    test("Div with negative tabindex should be included", () => {
        const divTabindexMinus1 = container.querySelector("div[tabindex=\"-1\"]") as HTMLElement;
        expect(divTabindexMinus1 && result.includes(divTabindexMinus1)).toBeFalsy();
    });
    test("Disabled button should be included", () => {
        const disabledButton = container.querySelector("button[disabled]") as HTMLElement;
        expect(disabledButton && result.includes(disabledButton)).toBeFalsy();
    });
    test("Hidden div should be included", () => {
        const hiddenDiv = container.querySelector("div[style=\"display: none;\"]") as HTMLElement;
        expect(hiddenDiv && result.includes(hiddenDiv)).toBeFalsy();
    });
    test("Should return empty array if the element is null", () => {
        const result2 = TabNavigation.findTabStops(null);
        expect(result2.length).toBe(0);
    });
});

describe("TabNavigation.isFocusableElement correctly identifies focusable elements", () => {
    test("Element is not an HTMLElement", () => {
        const element = document.createElementNS("https://www.w3.org/2000/svg", "svg");
        expect(TabNavigation.isFocusableElement(element)).toBeFalsy();
    });

    test("Element is disabled", () => {
        const element = document.createElement("button");
        element.setAttribute("disabled", "true");
        expect(TabNavigation.isFocusableElement(element)).toBeFalsy();
    });

    test("Element has negative tabIndex", () => {
        const element = document.createElement("div");
        element.tabIndex = -1;
        expect(TabNavigation.isFocusableElement(element)).toBeFalsy();
    });

    test("Element is not visible (offsetParent is null)", () => {
        const element = document.createElement("div");
        Object.defineProperty(element, "offsetParent", { get() { return null; } });
        expect(TabNavigation.isFocusableElement(element)).toBeFalsy();
    });

    test("Element without offsetParent is not focusable", () => {
        const element = document.createElement("button");
        expect(element.offsetParent).toBeNull();
        expect(TabNavigation.isFocusableElement(element)).toBeFalsy();
    });

    test("Element with positive tabIndex should be focusable", () => {
        const element = document.createElement("div");
        Object.defineProperty(element, "offsetParent", { value: document.body });
        element.tabIndex = 0;
        expect(TabNavigation.isFocusableElement(element)).toBeTruthy();
    });

    test("Anchor with href should be focusable", () => {
        const element = document.createElement("a");
        element.href = "https://example.com";
        Object.defineProperty(element, "offsetParent", { value: document.body });
        expect(TabNavigation.isFocusableElement(element)).toBeTruthy();
    });

    test("Button should be focusable", () => {
        const element = document.createElement("button");
        Object.defineProperty(element, "offsetParent", { value: document.body });
        expect(TabNavigation.isFocusableElement(element)).toBeTruthy();
    });

    test("Input should be focusable", () => {
        const element = document.createElement("input");
        Object.defineProperty(element, "offsetParent", { value: document.body });
        expect(TabNavigation.isFocusableElement(element)).toBeTruthy();
    });

    test("Select should be focusable", () => {
        const element = document.createElement("select");
        Object.defineProperty(element, "offsetParent", { value: document.body });
        expect(TabNavigation.isFocusableElement(element)).toBeTruthy();
    });

    test("Textarea should be focusable", () => {
        const element = document.createElement("textarea");
        Object.defineProperty(element, "offsetParent", { value: document.body });
        expect(TabNavigation.isFocusableElement(element)).toBeTruthy();
    });

    test("Fluent component should be focusable", () => {
        const element = document.createElement("fluent-button");
        Object.defineProperty(element, "offsetParent", { value: document.body });
        expect(TabNavigation.isFocusableElement(element)).toBeTruthy();
    });
});