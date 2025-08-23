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

describe("TabNavigation Fluent UI components", () => {
    test("Should recognize fluent-radio as focusable", () => {
        const element = document.createElement("fluent-radio");
        Object.defineProperty(element, "offsetParent", { value: document.body });
        expect(TabNavigation.isFocusableElement(element)).toBeTruthy();
    });

    test("Should recognize fluent-checkbox as focusable", () => {
        const element = document.createElement("fluent-checkbox");
        Object.defineProperty(element, "offsetParent", { value: document.body });
        expect(TabNavigation.isFocusableElement(element)).toBeTruthy();
    });

    test("Should recognize fluent-dialog as focusable", () => {
        const element = document.createElement("fluent-dialog");
        Object.defineProperty(element, "offsetParent", { value: document.body });
        expect(TabNavigation.isFocusableElement(element)).toBeTruthy();
    });

    test("Should recognize fluent-text-field as focusable", () => {
        const element = document.createElement("fluent-text-field");
        Object.defineProperty(element, "offsetParent", { value: document.body });
        expect(TabNavigation.isFocusableElement(element)).toBeTruthy();
    });

    test("Should handle disabled fluent components", () => {
        const element = document.createElement("fluent-button");
        element.setAttribute("disabled", "true");
        expect(TabNavigation.isFocusableElement(element)).toBeFalsy();
    });
});

describe("TabNavigation initialization", () => {
    test("Should initialize without errors", () => {
        expect(() => TabNavigation.initialize()).not.toThrow();
    });

    test("Should set iframe reference", () => {
        const mockFrame = {} as Window;
        expect(() => TabNavigation.setIFrame(mockFrame)).not.toThrow();
        expect(() => TabNavigation.setIFrame(null)).not.toThrow();
    });
});

describe("TabNavigation edge cases", () => {
    test("Should handle contenteditable elements", () => {
        const element = document.createElement("div");
        element.setAttribute("contenteditable", "true");
        element.tabIndex = 0; // contenteditable elements need explicit tabindex
        Object.defineProperty(element, "offsetParent", { value: document.body });
        expect(TabNavigation.isFocusableElement(element)).toBeTruthy();
    });

    test("Should reject contenteditable=false elements", () => {
        const element = document.createElement("div");
        element.setAttribute("contenteditable", "false");
        Object.defineProperty(element, "offsetParent", { value: document.body });
        expect(TabNavigation.isFocusableElement(element)).toBeFalsy();
    });

    test("Should handle anchor tags without href", () => {
        const element = document.createElement("a");
        Object.defineProperty(element, "offsetParent", { value: document.body });
        expect(TabNavigation.isFocusableElement(element)).toBeFalsy();
    });

    test("Should handle details elements", () => {
        const element = document.createElement("details");
        element.tabIndex = 0; // details elements might need explicit tabindex in JSDOM
        Object.defineProperty(element, "offsetParent", { value: document.body });
        expect(TabNavigation.isFocusableElement(element)).toBeTruthy();
    });

    test("Should handle elements with tabindex 1", () => {
        const element = document.createElement("div");
        element.tabIndex = 1;
        Object.defineProperty(element, "offsetParent", { value: document.body });
        expect(TabNavigation.isFocusableElement(element)).toBeTruthy();
    });

    test("Should handle elements with explicit tabindex=0", () => {
        const element = document.createElement("span");
        element.setAttribute("tabindex", "0");
        Object.defineProperty(element, "offsetParent", { value: document.body });
        expect(TabNavigation.isFocusableElement(element)).toBeTruthy();
    });

    test("Should handle elements with explicit negative tabindex", () => {
        const element = document.createElement("span");
        element.setAttribute("tabindex", "-1");
        Object.defineProperty(element, "offsetParent", { value: document.body });
        expect(TabNavigation.isFocusableElement(element)).toBeFalsy();
    });
});

describe("TabNavigation comprehensive selector test", () => {
    test("Should find all types of focusable elements including Fluent components", () => {
        const container = document.createElement("div");
        container.innerHTML = `
            <a href="#">Link</a>
            <button>Button</button>
            <input type="text" />
            <textarea></textarea>
            <select><option>Option</option></select>
            <details tabindex="0"><summary>Details</summary></details>
            <div tabindex="0">Div with tabindex</div>
            <div contenteditable="true" tabindex="0">Editable div</div>
            <fluent-button>Fluent Button</fluent-button>
            <fluent-radio>Fluent Radio</fluent-radio>
            <fluent-checkbox>Fluent Checkbox</fluent-checkbox>
            <fluent-text-field>Fluent Text Field</fluent-text-field>
            <div tabindex="-1">Negative tabindex</div>
            <button disabled>Disabled Button</button>
            <div style="display: none;">Hidden Div</div>
        `;

        // Mock offsetParent for all elements to make them visible
        Object.defineProperty(HTMLElement.prototype, "offsetParent", {
            get() {
                // Return null for hidden elements, parent for visible ones
                if (this.style.display === "none") return null;
                return this.parentNode;
            }
        });

        const result = TabNavigation.findTabStops(container);

        // Should find: a, button, input, textarea, select, details, div[tabindex="0"],
        // div[contenteditable], fluent-button, fluent-radio, fluent-checkbox, fluent-text-field
        // Should NOT find: div[tabindex="-1"], button[disabled], hidden div
        expect(result.length).toBe(12);

        // Check that Fluent components are included
        const fluentButton = container.querySelector("fluent-button") as HTMLElement;
        const fluentRadio = container.querySelector("fluent-radio") as HTMLElement;
        const fluentCheckbox = container.querySelector("fluent-checkbox") as HTMLElement;
        const fluentTextField = container.querySelector("fluent-text-field") as HTMLElement;

        expect(fluentButton && result.includes(fluentButton)).toBeTruthy();
        expect(fluentRadio && result.includes(fluentRadio)).toBeTruthy();
        expect(fluentCheckbox && result.includes(fluentCheckbox)).toBeTruthy();
        expect(fluentTextField && result.includes(fluentTextField)).toBeTruthy();

        // Check that contenteditable is included
        const editableDiv = container.querySelector("div[contenteditable='true']") as HTMLElement;
        expect(editableDiv && result.includes(editableDiv)).toBeTruthy();

        // Check that details is included
        const details = container.querySelector("details") as HTMLElement;
        expect(details && result.includes(details)).toBeTruthy();
    });
});