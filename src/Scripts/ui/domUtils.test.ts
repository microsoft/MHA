/**
 * @jest-environment jsdom
 */

import { DomUtils } from "./domUtils";

describe("DomUtils Class", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    describe("getElement", () => {
        test("returns element when found", () => {
            document.body.innerHTML = "<div id=\"elem\">content</div>";
            const el = DomUtils.getElement("#elem");
            expect(el).not.toBeNull();
            expect(el?.textContent).toBe("content");
        });

        test("returns null when element not found", () => {
            const missing = DomUtils.getElement("#missing");
            expect(missing).toBeNull();
        });

        test("works with different selector types", () => {
            document.body.innerHTML = `
                <div id="test-id">ID selector</div>
                <span class="test-class">Class selector</span>
                <p data-test="value">Attribute selector</p>
            `;

            expect(DomUtils.getElement("#test-id")?.textContent).toBe("ID selector");
            expect(DomUtils.getElement(".test-class")?.textContent).toBe("Class selector");
            expect(DomUtils.getElement("[data-test='value']")?.textContent).toBe("Attribute selector");
        });
    });

    describe("getElements", () => {
        test("returns NodeList of elements", () => {
            document.body.innerHTML = "<div class=\"a\">1</div><div class=\"a\">2</div>";
            const list = DomUtils.getElements(".a");
            expect(list.length).toBe(2);
            expect(list[0]!.textContent).toBe("1");
            expect(list[1]!.textContent).toBe("2");
        });

        test("returns empty NodeList when no elements found", () => {
            const list = DomUtils.getElements(".missing");
            expect(list.length).toBe(0);
        });

        test("returns all matching elements", () => {
            document.body.innerHTML = `
                <div class="item">Item 1</div>
                <div class="item">Item 2</div>
                <div class="item">Item 3</div>
                <span class="item">Item 4</span>
            `;

            const items = DomUtils.getElements(".item");
            expect(items.length).toBe(4);
            expect(items[3]!.tagName).toBe("SPAN");
        });
    });

    describe("clearElement", () => {
        test("clears innerHTML safely", () => {
            document.body.innerHTML = "<div id=\"c\"><span>x</span></div>";
            DomUtils.clearElement("#c");
            expect((document.getElementById("c") as HTMLElement).innerHTML).toBe("");
        });

        test("handles missing element gracefully", () => {
            expect(() => DomUtils.clearElement("#missing")).not.toThrow();
        });

        test("clears different element types", () => {
            document.body.innerHTML = `
                <div id="div-test">
                    <p>Paragraph</p>
                    <span>Span</span>
                    <ul><li>List item</li></ul>
                </div>
                <ul id="list-test">
                    <li>Item 1</li>
                    <li>Item 2</li>
                    <li>Item 3</li>
                </ul>
                <table id="table-test">
                    <tr><td>Cell 1</td><td>Cell 2</td></tr>
                    <tr><td>Cell 3</td><td>Cell 4</td></tr>
                </table>
            `;

            DomUtils.clearElement("#div-test");
            DomUtils.clearElement("#list-test");
            DomUtils.clearElement("#table-test");

            expect((document.getElementById("div-test") as HTMLElement).innerHTML).toBe("");
            expect((document.getElementById("list-test") as HTMLElement).innerHTML).toBe("");
            expect((document.getElementById("table-test") as HTMLElement).innerHTML).toBe("");

            // Elements should still exist but be empty
            expect(document.getElementById("div-test")).not.toBeNull();
            expect(document.getElementById("list-test")).not.toBeNull();
            expect(document.getElementById("table-test")).not.toBeNull();
        });
    });

    describe("setText", () => {
        test("sets text content", () => {
            document.body.innerHTML = "<div id=\"t\">old</div>";
            DomUtils.setText("#t", "new");
            expect((document.getElementById("t") as HTMLElement).textContent).toBe("new");
        });

        test("handles missing element gracefully", () => {
            expect(() => DomUtils.setText("#missing", "test")).not.toThrow();
        });

        test("handles different text content types", () => {
            document.body.innerHTML = `
                <div id="text1">original</div>
                <span id="text2">original</span>
                <p id="text3">original</p>
            `;

            // Test with empty string
            DomUtils.setText("#text1", "");
            expect((document.getElementById("text1") as HTMLElement).textContent).toBe("");

            // Test with simple text
            DomUtils.setText("#text2", "Simple text");
            expect((document.getElementById("text2") as HTMLElement).textContent).toBe("Simple text");

            // Test with special characters and newlines
            DomUtils.setText("#text3", "Text with\nnewlines\tand\ttabs");
            expect((document.getElementById("text3") as HTMLElement).textContent).toBe("Text with\nnewlines\tand\ttabs");
        });

        test("escapes HTML content as text", () => {
            document.body.innerHTML = "<div id=\"html-test\">original</div>";
            DomUtils.setText("#html-test", "<script>alert('test')</script>");
            expect((document.getElementById("html-test") as HTMLElement).textContent).toBe("<script>alert('test')</script>");
            // Should be treated as text, not executed as HTML
        });
    });

    describe("showElement and hideElement", () => {
        test("shows and hides elements", () => {
            document.body.innerHTML = "<div id=\"toggle\">content</div>";

            DomUtils.hideElement("#toggle");
            expect((document.getElementById("toggle") as HTMLElement).style.display).toBe("none");

            DomUtils.showElement("#toggle");
            expect((document.getElementById("toggle") as HTMLElement).style.display).toBe("block");
        });

        test("handles missing elements gracefully", () => {
            expect(() => DomUtils.hideElement("#missing")).not.toThrow();
            expect(() => DomUtils.showElement("#missing")).not.toThrow();
        });

        test("works with different display values", () => {
            document.body.innerHTML = `
                <div id="test1" style="display: flex;">Content 1</div>
                <div id="test2" style="display: inline-block;">Content 2</div>
                <div id="test3" style="display: grid;">Content 3</div>
            `;

            // Hide elements
            DomUtils.hideElement("#test1");
            DomUtils.hideElement("#test2");
            DomUtils.hideElement("#test3");

            expect((document.getElementById("test1") as HTMLElement).style.display).toBe("none");
            expect((document.getElementById("test2") as HTMLElement).style.display).toBe("none");
            expect((document.getElementById("test3") as HTMLElement).style.display).toBe("none");

            // Show elements (should set to block)
            DomUtils.showElement("#test1");
            DomUtils.showElement("#test2");
            DomUtils.showElement("#test3");

            expect((document.getElementById("test1") as HTMLElement).style.display).toBe("block");
            expect((document.getElementById("test2") as HTMLElement).style.display).toBe("block");
            expect((document.getElementById("test3") as HTMLElement).style.display).toBe("block");
        });
    });

    describe("hideAllElements", () => {
        test("hides all matching elements", () => {
            document.body.innerHTML = `
                <div class="group" style="display: table;">Item 1</div>
                <div class="group" style="display: inline;">Item 2</div>
                <span class="group" style="display: block;">Item 3</span>
            `;

            DomUtils.hideAllElements(".group");
            const groupElements = document.querySelectorAll(".group");
            groupElements.forEach(element => {
                expect((element as HTMLElement).style.display).toBe("none");
            });
        });

        test("handles empty selector results gracefully", () => {
            expect(() => DomUtils.hideAllElements(".missing")).not.toThrow();
        });
    });

    describe("cloneTemplate", () => {
        test("clones template content", () => {
            document.body.innerHTML = `
                <template id="tpl">
                    <div class="c"><span class="s">content</span></div>
                </template>
            `;

            const frag = DomUtils.cloneTemplate("tpl");
            expect(frag).toBeInstanceOf(DocumentFragment);
            expect(frag.querySelector(".c")).not.toBeNull();
            expect(frag.querySelector(".s")?.textContent).toBe("content");
        });

        test("throws error for missing template", () => {
            expect(() => DomUtils.cloneTemplate("nonexistent")).toThrow("Template with id \"nonexistent\" not found");
        });

        test("clones complex template structure", () => {
            document.body.innerHTML = `
                <template id="complex-template">
                    <div class="container">
                        <span class="text-target">original</span>
                        <div class="html-target"><p>original</p></div>
                        <input class="attr-target" type="text" value="original">
                    </div>
                </template>
            `;

            const fragment = DomUtils.cloneTemplate("complex-template");
            expect(fragment.querySelector(".container")).not.toBeNull();
            expect(fragment.querySelector(".text-target")?.textContent).toBe("original");
            expect(fragment.querySelector(".html-target")?.innerHTML).toBe("<p>original</p>");
            expect((fragment.querySelector(".attr-target") as HTMLInputElement)?.value).toBe("original");
        });
    });

    describe("appendTemplate", () => {
        test("clones and appends template to parent", () => {
            document.body.innerHTML = `
                <template id="tpl">
                    <div class="c">content</div>
                </template>
                <div id="parent"></div>
            `;

            const parent = document.getElementById("parent") as HTMLElement;
            const result = DomUtils.appendTemplate("tpl", parent);

            expect(result).toBeInstanceOf(DocumentFragment);
            expect(parent.querySelector(".c")).not.toBeNull();
            expect(parent.querySelector(".c")?.textContent).toBe("content");
        });

        test("appends multiple templates to same parent", () => {
            document.body.innerHTML = `
                <template id="item-template">
                    <div class="item">Item</div>
                </template>
                <div id="container"></div>
            `;

            const container = document.getElementById("container") as HTMLElement;
            DomUtils.appendTemplate("item-template", container);
            DomUtils.appendTemplate("item-template", container);
            DomUtils.appendTemplate("item-template", container);

            expect(container.querySelectorAll(".item").length).toBe(3);
        });
    });

    describe("setTemplateText", () => {
        test("sets text content on element within fragment", () => {
            document.body.innerHTML = `
                <template id="tpl">
                    <div class="target">original</div>
                </template>
            `;

            const clone = DomUtils.cloneTemplate("tpl");
            DomUtils.setTemplateText(clone, ".target", "new text");
            expect((clone.querySelector(".target") as HTMLElement).textContent).toBe("new text");
        });

        test("handles missing selector gracefully", () => {
            document.body.innerHTML = `
                <template id="tpl">
                    <div class="target">original</div>
                </template>
            `;

            const clone = DomUtils.cloneTemplate("tpl");
            expect(() => DomUtils.setTemplateText(clone, ".nonexistent", "test")).not.toThrow();
        });

        test("handles special characters and empty strings", () => {
            document.body.innerHTML = `
                <template id="tpl">
                    <div class="target">original</div>
                </template>
            `;

            const clone1 = DomUtils.cloneTemplate("tpl");
            DomUtils.setTemplateText(clone1, ".target", "");
            expect((clone1.querySelector(".target") as HTMLElement).textContent).toBe("");

            const clone2 = DomUtils.cloneTemplate("tpl");
            DomUtils.setTemplateText(clone2, ".target", "Special chars: <>&\"");
            expect((clone2.querySelector(".target") as HTMLElement).textContent).toBe("Special chars: <>&\"");
        });
    });

    describe("setTemplateHTML", () => {
        test("sets HTML content on element within fragment", () => {
            document.body.innerHTML = `
                <template id="tpl">
                    <div class="target"><p>original</p></div>
                </template>
            `;

            const clone = DomUtils.cloneTemplate("tpl");
            DomUtils.setTemplateHTML(clone, ".target", "<b>Bold</b>");
            expect((clone.querySelector(".target") as HTMLElement).innerHTML).toBe("<b>Bold</b>");
        });

        test("handles missing selector gracefully", () => {
            document.body.innerHTML = `
                <template id="tpl">
                    <div class="target">original</div>
                </template>
            `;

            const clone = DomUtils.cloneTemplate("tpl");
            expect(() => DomUtils.setTemplateHTML(clone, ".nonexistent", "<p>test</p>")).not.toThrow();
        });

        test("sets complex HTML content", () => {
            document.body.innerHTML = `
                <template id="tpl">
                    <div class="target">original</div>
                </template>
            `;

            const clone = DomUtils.cloneTemplate("tpl");
            DomUtils.setTemplateHTML(clone, ".target", "<strong>Bold</strong> and <em>italic</em>");
            expect((clone.querySelector(".target") as HTMLElement).innerHTML).toBe("<strong>Bold</strong> and <em>italic</em>");
        });
    });

    describe("setTemplateAttribute", () => {
        test("sets attribute on element within fragment", () => {
            document.body.innerHTML = `
                <template id="tpl">
                    <div class="target">content</div>
                </template>
            `;

            const clone = DomUtils.cloneTemplate("tpl");
            DomUtils.setTemplateAttribute(clone, ".target", "data-test", "abc");
            expect((clone.querySelector(".target") as HTMLElement).getAttribute("data-test")).toBe("abc");
        });

        test("handles missing selector gracefully", () => {
            document.body.innerHTML = `
                <template id="tpl">
                    <div class="target">content</div>
                </template>
            `;

            const clone = DomUtils.cloneTemplate("tpl");
            expect(() => DomUtils.setTemplateAttribute(clone, ".nonexistent", "data-test", "value")).not.toThrow();
        });

        test("sets various attribute types", () => {
            document.body.innerHTML = `
                <template id="tpl">
                    <input class="target" type="text" value="original">
                </template>
            `;

            const clone = DomUtils.cloneTemplate("tpl");
            DomUtils.setTemplateAttribute(clone, ".target", "data-custom", "custom-value");
            DomUtils.setTemplateAttribute(clone, ".target", "aria-label", "Label text");
            DomUtils.setTemplateAttribute(clone, ".target", "class", "new-class");

            const input = clone.querySelector(".target") as HTMLInputElement;
            if (input) {
                expect(input.getAttribute("data-custom")).toBe("custom-value");
                expect(input.getAttribute("aria-label")).toBe("Label text");
                expect(input.getAttribute("class")).toBe("new-class");
            }
        });
    });

    describe("complex selectors", () => {
        test("works with attribute selectors", () => {
            document.body.innerHTML = `
                <div class="container">
                    <div class="item active" data-id="1">Item 1</div>
                    <div class="item" data-id="2">Item 2</div>
                    <div class="item special" data-id="3">Item 3</div>
                </div>
                <form id="form">
                    <input type="text" name="field1" value="value1">
                    <input type="email" name="field2" value="value2">
                </form>
            `;

            DomUtils.setText("[data-id='1']", "Updated Item 1");
            expect((document.querySelector("[data-id='1']") as HTMLElement).textContent).toBe("Updated Item 1");

            DomUtils.hideElement(".item.special");
            expect((document.querySelector(".item.special") as HTMLElement).style.display).toBe("none");

            DomUtils.showElement(".item.special");
            expect((document.querySelector(".item.special") as HTMLElement).style.display).toBe("block");
        });

        test("works with descendant selectors", () => {
            document.body.innerHTML = `
                <div class="container">
                    <div class="special">Special Item</div>
                </div>
            `;

            DomUtils.setText(".container .special", "Special Item Updated");
            expect((document.querySelector(".container .special") as HTMLElement).textContent).toBe("Special Item Updated");
        });

        test("hideAllElements works with complex selectors", () => {
            document.body.innerHTML = `
                <div class="container">
                    <div class="item">Item 1</div>
                    <div class="item">Item 2</div>
                    <div class="item">Item 3</div>
                </div>
            `;

            DomUtils.hideAllElements(".container .item");
            const items = document.querySelectorAll(".container .item");
            items.forEach(item => {
                expect((item as HTMLElement).style.display).toBe("none");
            });
        });
    });
});
