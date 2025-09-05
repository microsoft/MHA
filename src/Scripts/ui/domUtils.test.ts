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

    describe("Accessibility Methods", () => {
        describe("focusableElements constant", () => {
            test("contains expected focusable element selectors", () => {
                expect(DomUtils.focusableElements).toBe("a, button, input, textarea, select, [tabindex]:not([tabindex=\"-1\"])");
            });
        });

        describe("makeFocusableElementsNonTabbable", () => {
            test("sets tabindex=-1 on focusable elements within containers", () => {
                document.body.innerHTML = `
                    <div class="container">
                        <a href="#" id="link1">Link 1</a>
                        <button id="btn1">Button 1</button>
                        <input id="input1" type="text" />
                        <textarea id="textarea1"></textarea>
                        <select id="select1"><option>Option</option></select>
                        <div tabindex="0" id="tabbable1">Tabbable Div</div>
                    </div>
                    <div class="other-container">
                        <a href="#" id="link2">Link 2</a>
                        <button id="btn2">Button 2</button>
                    </div>
                `;

                DomUtils.makeFocusableElementsNonTabbable(".container");

                // Elements in .container should have tabindex=-1
                expect(document.getElementById("link1")?.getAttribute("tabindex")).toBe("-1");
                expect(document.getElementById("btn1")?.getAttribute("tabindex")).toBe("-1");
                expect(document.getElementById("input1")?.getAttribute("tabindex")).toBe("-1");
                expect(document.getElementById("textarea1")?.getAttribute("tabindex")).toBe("-1");
                expect(document.getElementById("select1")?.getAttribute("tabindex")).toBe("-1");
                expect(document.getElementById("tabbable1")?.getAttribute("tabindex")).toBe("-1");

                // Elements in .other-container should not be affected
                expect(document.getElementById("link2")?.getAttribute("tabindex")).toBeNull();
                expect(document.getElementById("btn2")?.getAttribute("tabindex")).toBeNull();
            });

            test("handles elements that already have tabindex=-1", () => {
                document.body.innerHTML = `
                    <div class="container">
                        <a href="#" tabindex="-1" id="already-non-tabbable">Already Non-tabbable</a>
                        <button id="btn">Button</button>
                    </div>
                `;

                DomUtils.makeFocusableElementsNonTabbable(".container");

                expect(document.getElementById("already-non-tabbable")?.getAttribute("tabindex")).toBe("-1");
                expect(document.getElementById("btn")?.getAttribute("tabindex")).toBe("-1");
            });

            test("handles multiple containers", () => {
                document.body.innerHTML = `
                    <div class="container">
                        <button id="btn1">Button 1</button>
                    </div>
                    <div class="container">
                        <button id="btn2">Button 2</button>
                    </div>
                `;

                DomUtils.makeFocusableElementsNonTabbable(".container");

                expect(document.getElementById("btn1")?.getAttribute("tabindex")).toBe("-1");
                expect(document.getElementById("btn2")?.getAttribute("tabindex")).toBe("-1");
            });

            test("does nothing when no containers found", () => {
                document.body.innerHTML = "<button id=\"btn\">Button</button>";

                expect(() => {
                    DomUtils.makeFocusableElementsNonTabbable(".nonexistent");
                }).not.toThrow();

                expect(document.getElementById("btn")?.getAttribute("tabindex")).toBeNull();
            });
        });

        describe("restoreFocusableElements", () => {
            test("removes tabindex=-1 from elements within containers", () => {
                document.body.innerHTML = `
                    <div class="container">
                        <a href="#" tabindex="-1" id="link1">Link 1</a>
                        <button tabindex="-1" id="btn1">Button 1</button>
                        <input tabindex="-1" id="input1" type="text" />
                        <div tabindex="5" id="custom-tabindex">Custom Tabindex</div>
                    </div>
                    <div class="other-container">
                        <a href="#" tabindex="-1" id="link2">Link 2</a>
                    </div>
                `;

                DomUtils.restoreFocusableElements(".container");

                // Elements in .container with tabindex=-1 should have it removed
                expect(document.getElementById("link1")?.hasAttribute("tabindex")).toBe(false);
                expect(document.getElementById("btn1")?.hasAttribute("tabindex")).toBe(false);
                expect(document.getElementById("input1")?.hasAttribute("tabindex")).toBe(false);

                // Elements with other tabindex values should not be affected
                expect(document.getElementById("custom-tabindex")?.getAttribute("tabindex")).toBe("5");

                // Elements in other containers should not be affected
                expect(document.getElementById("link2")?.getAttribute("tabindex")).toBe("-1");
            });

            test("handles multiple containers", () => {
                document.body.innerHTML = `
                    <div class="container">
                        <button tabindex="-1" id="btn1">Button 1</button>
                    </div>
                    <div class="container">
                        <button tabindex="-1" id="btn2">Button 2</button>
                    </div>
                `;

                DomUtils.restoreFocusableElements(".container");

                expect(document.getElementById("btn1")?.hasAttribute("tabindex")).toBe(false);
                expect(document.getElementById("btn2")?.hasAttribute("tabindex")).toBe(false);
            });

            test("does nothing when no containers found", () => {
                document.body.innerHTML = "<button tabindex=\"-1\" id=\"btn\">Button</button>";

                expect(() => {
                    DomUtils.restoreFocusableElements(".nonexistent");
                }).not.toThrow();

                expect(document.getElementById("btn")?.getAttribute("tabindex")).toBe("-1");
            });
        });

        describe("setAccessibilityState", () => {
            test("sets aria-hidden and visibility on elements", () => {
                document.body.innerHTML = `
                    <div class="content" id="content1">Content 1</div>
                    <div class="content" id="content2">Content 2</div>
                    <div class="other" id="other1">Other Content</div>
                `;

                DomUtils.setAccessibilityState(".content", true, false);

                // Elements with .content class should be hidden
                expect(document.getElementById("content1")?.getAttribute("aria-hidden")).toBe("true");
                expect(document.getElementById("content1")?.style.visibility).toBe("hidden");
                expect(document.getElementById("content2")?.getAttribute("aria-hidden")).toBe("true");
                expect(document.getElementById("content2")?.style.visibility).toBe("hidden");

                // Other elements should not be affected
                expect(document.getElementById("other1")?.getAttribute("aria-hidden")).toBeNull();
                expect(document.getElementById("other1")?.style.visibility).toBe("");
            });

            test("sets elements as visible and accessible", () => {
                document.body.innerHTML = `
                    <div class="content" id="content1" aria-hidden="true" style="visibility: hidden;">Content 1</div>
                    <div class="content" id="content2" aria-hidden="true" style="visibility: hidden;">Content 2</div>
                `;

                DomUtils.setAccessibilityState(".content", false, true);

                expect(document.getElementById("content1")?.getAttribute("aria-hidden")).toBe("false");
                expect(document.getElementById("content1")?.style.visibility).toBe("visible");
                expect(document.getElementById("content2")?.getAttribute("aria-hidden")).toBe("false");
                expect(document.getElementById("content2")?.style.visibility).toBe("visible");
            });

            test("handles different combinations of hidden and visible states", () => {
                document.body.innerHTML = `
                    <div class="test" id="test1">Test 1</div>
                    <div class="test" id="test2">Test 2</div>
                `;

                // Hidden from screen readers but visually visible
                DomUtils.setAccessibilityState(".test", true, true);
                expect(document.getElementById("test1")?.getAttribute("aria-hidden")).toBe("true");
                expect(document.getElementById("test1")?.style.visibility).toBe("visible");

                // Accessible to screen readers but visually hidden
                DomUtils.setAccessibilityState(".test", false, false);
                expect(document.getElementById("test1")?.getAttribute("aria-hidden")).toBe("false");
                expect(document.getElementById("test1")?.style.visibility).toBe("hidden");
            });

            test("does nothing when no elements found", () => {
                document.body.innerHTML = "<div id=\"test\">Test</div>";

                expect(() => {
                    DomUtils.setAccessibilityState(".nonexistent", true, false);
                }).not.toThrow();

                expect(document.getElementById("test")?.getAttribute("aria-hidden")).toBeNull();
            });
        });

        describe("Integration tests for accordion accessibility", () => {
            test("full accordion accessibility workflow", () => {
                document.body.innerHTML = `
                    <div class="accordion-item">
                        <div class="accordion-item-content">
                            <a href="#" id="link">Link</a>
                            <button id="button">Button</button>
                            <input id="input" type="text" />
                        </div>
                    </div>
                    <div class="accordion-item accordion-item-expanded">
                        <div class="accordion-item-content">
                            <a href="#" id="expanded-link">Expanded Link</a>
                            <button id="expanded-button">Expanded Button</button>
                        </div>
                    </div>
                `;

                // Initial state: make collapsed content non-accessible
                const collapsedSelector = ".accordion-item:not(.accordion-item-expanded) .accordion-item-content";
                DomUtils.setAccessibilityState(collapsedSelector, true, false);
                DomUtils.makeFocusableElementsNonTabbable(collapsedSelector);

                // Check collapsed accordion content is properly hidden
                const collapsedContent = document.querySelector(".accordion-item:not(.accordion-item-expanded) .accordion-item-content") as HTMLElement;
                expect(collapsedContent.getAttribute("aria-hidden")).toBe("true");
                expect(collapsedContent.style.visibility).toBe("hidden");
                expect(document.getElementById("link")?.getAttribute("tabindex")).toBe("-1");
                expect(document.getElementById("button")?.getAttribute("tabindex")).toBe("-1");
                expect(document.getElementById("input")?.getAttribute("tabindex")).toBe("-1");

                // Check expanded accordion content is not affected
                expect(document.getElementById("expanded-link")?.getAttribute("tabindex")).toBeNull();
                expect(document.getElementById("expanded-button")?.getAttribute("tabindex")).toBeNull();

                // Simulate accordion opening: restore accessibility
                const expandedContent = document.querySelector(".accordion-item-expanded .accordion-item-content") as HTMLElement;
                expandedContent.setAttribute("aria-hidden", "false");
                expandedContent.style.visibility = "visible";
                DomUtils.restoreFocusableElements(".accordion-item-expanded .accordion-item-content");

                // All elements should still work as expected
                expect(document.getElementById("expanded-link")?.getAttribute("tabindex")).toBeNull();
                expect(document.getElementById("expanded-button")?.getAttribute("tabindex")).toBeNull();
            });
        });
    });
});
