import { module, test } from "qunit";
import { findTabStops } from "../findTabStops";

module("findTabStops tests", function() {
    test("finds all focusable elements within the given element", function(assert) {
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
        document.body.appendChild(container);

        // Call the function
        const result = findTabStops(container);

        // Assert the results
        assert.equal(result.length, 6, "Six focusable elements should be found");
        const link = container.querySelector("a");
        assert.ok(link && result.includes(link), "Link should be included");
        const button = container.querySelector("button:not([disabled])") as HTMLElement;
        assert.ok(button && result.includes(button), "Button should be included");
        const input = container.querySelector("input");
        assert.ok(input && result.includes(input), "Input should be included");
        const textarea = container.querySelector("textarea");
        assert.ok(textarea && result.includes(textarea), "Textarea should be included");
        const select = container.querySelector("select");
        assert.ok(select && result.includes(select), "Select should be included");
        const divTabindex0 = container.querySelector("div[tabindex=\"0\"]") as HTMLElement;
        assert.ok(divTabindex0 && result.includes(divTabindex0), "Div with tabindex 0 should be included");
        const divTabindexMinus1 = container.querySelector("div[tabindex=\"-1\"]") as HTMLElement;
        assert.notOk(divTabindexMinus1 && result.includes(divTabindexMinus1), "Div with negative tabindex should not be included");
        const disabledButton = container.querySelector("button[disabled]") as HTMLElement;
        assert.notOk(disabledButton && result.includes(disabledButton), "Disabled button should not be included");
        const hiddenDiv = container.querySelector("div[style=\"display: none;\"]") as HTMLElement;
        assert.notOk(hiddenDiv && result.includes(hiddenDiv), "Hidden div should not be included");

        const result2 = findTabStops(null);
        assert.equal(result2.length, 0, "Should return empty array if the element is null");
    });
});