// Fluent UI Web Components interfaces for tab navigation
interface FluentRadioGroup extends HTMLElement {
    value: string;
}

// Result type for tab target determination
interface TabTargetResult {
    element: HTMLElement | null;
    routine: string;
}

export class TabNavigation {
    private static iFrame: Window | null = null;

    /**
     * Finds all focusable elements within a given HTML element or document.
     * This function searches for all focusable elements within the specified container
     * and returns an array of those elements that are not disabled, have a non-negative
     * tabIndex, and are visible. Works across different document contexts (e.g., iframe).
     */
    public static findTabStops(container: HTMLElement | Document | null): HTMLElement[] {
        if (container === null) {
            return [];
        }

        // Comprehensive selector that includes both standard and Fluent UI elements
        const selector = "a, button, input, textarea, select, [tabindex], " +
            "fluent-button, fluent-checkbox, fluent-radio, fluent-text-field, " +
            "fluent-text-area, fluent-select, fluent-combobox, details, [contenteditable]";

        const focusableElements = container.querySelectorAll(selector);

        // For cross-frame compatibility, filter and type-check elements
        // Elements from iframe have different HTMLElement constructor than parent frame
        const htmlElements = Array.from(focusableElements)
            .filter((el): el is HTMLElement => {
                // Check if it's an HTMLElement in any document context
                if (el instanceof HTMLElement) return true;

                // Check if it's an HTMLElement in the iframe context
                const element = el as Element;
                const elementDoc = element.ownerDocument;
                const iframeHTMLElement = elementDoc?.defaultView?.HTMLElement;
                return !!(iframeHTMLElement && el instanceof iframeHTMLElement);
            });

        const focusableResults = htmlElements.filter(TabNavigation.isFocusableElement);
        return focusableResults;
    }

    /**
     * Checks if an element is focusable based on various criteria
     * Handles cross-frame elements properly
     */
    public static isFocusableElement(el: Element): el is HTMLElement {
        // Check if it's an HTMLElement in any document context (cross-frame compatible)
        let isHTMLElement = el instanceof HTMLElement;
        if (!isHTMLElement) {
            // Check if it's an HTMLElement in its own document context (iframe)
            const elementDoc = el.ownerDocument;
            const iframeHTMLElement = elementDoc?.defaultView?.HTMLElement;
            isHTMLElement = !!(iframeHTMLElement && el instanceof iframeHTMLElement);
        }

        if (!isHTMLElement) {
            return false;
        }

        const htmlEl = el as HTMLElement;
        if (htmlEl.hasAttribute("disabled")) {
            return false;
        }

        // Check if element is visible (offsetParent is null for hidden elements)
        if (htmlEl.offsetParent === null) {
            return false;
        }

        // For fluent components, they are focusable by default unless explicitly disabled
        const tagName = htmlEl.tagName.toLowerCase();
        if (tagName.startsWith("fluent-")) {
            return true;
        }

        // For standard HTML elements, check tabIndex
        if (htmlEl.tabIndex < 0) {
            return false;
        }

        // For elements with explicit tabindex, they're focusable
        if (htmlEl.hasAttribute("tabindex")) {
            return true;
        }

        // Standard focusable elements
        const focusableTags = ["a", "button", "input", "textarea", "select", "details"];
        if (focusableTags.includes(tagName)) {
            // Special case: anchor tags need href to be focusable
            if (tagName === "a") {
                return htmlEl.hasAttribute("href");
            }
            return true;
        }

        // Elements with contenteditable are focusable
        if (htmlEl.hasAttribute("contenteditable") && htmlEl.getAttribute("contenteditable") !== "false") {
            return true;
        }

        return false;
    }

    /**
     * Set the iframe reference for cross-frame navigation
     */
    public static setIFrame(frame: Window | null): void {
        TabNavigation.iFrame = frame;
    }

    /**
     * Initialize tab navigation event listeners
     * Should be called once when the application starts
     */
    public static initialize(): void {
        TabNavigation.initializeParentFrameTabHandling();
    }

    /**
     * Initialize tab navigation for iframe content
     * Should be called from within the iframe
     */
    public static initializeIFrameTabHandling(): void {
        // Insert the settings and copy buttons into the tab order for the ribbon
        // This handles tabbing into from these buttons.
        // Tabbing out from these buttons is handled in parent frame
        document.addEventListener("keydown", function (e) {
            if (e.key === "Tab") {
                const shiftPressed = e.shiftKey;
                const focused: HTMLElement = document.activeElement as HTMLElement;

                // Determine the target element for this tab operation
                let targetResult: TabTargetResult | null = null;

                // Tab from Other goes to copy button
                if (!shiftPressed && focused.id === "other-btn") {
                    targetResult = TabNavigation.getTabFromOtherButtonTarget();
                }
                // Tab back from Summary goes to end of view
                else if (shiftPressed && focused.id === "summary-btn") {
                    targetResult = TabNavigation.getShiftTabFromSummaryButtonTarget();
                }
                // If we're tabbing off of the view, we want to tab to the appropriate ribbon button
                else {
                    const view = document.querySelector(".header-view[style*=\"display: block\"]") as HTMLElement;
                    const tabStops = TabNavigation.findTabStops(view);

                    if (shiftPressed){
                        // If our current focus is the first element in the list, we want to move focus to the settings button
                        if (tabStops.length > 0 && focused === tabStops[0]){
                            targetResult = TabNavigation.getShiftTabFromFirstViewElementTarget();
                        }
                    }
                    else{
                        // If our current focus is the last element in the list, we want to move focus to the summary-btn
                        if (tabStops.length > 0 && focused === tabStops[tabStops.length - 1]){
                            targetResult = TabNavigation.getTabFromLastViewElementTarget();
                        }
                    }
                }

                // If we found a target element, log details and set focus
                if (targetResult?.element) {
                    TabNavigation.logDetailedTabInfo(focused, shiftPressed, "iframe", targetResult.element, targetResult.routine);
                    targetResult.element.focus();
                    e.preventDefault();
                } else {
                    TabNavigation.logDetailedTabInfo(focused, shiftPressed, "iframe");
                }
            }
        });
    }

    /**
     * Initialize tab navigation for the parent frame
     */
    public static initializeParentFrameTabHandling(): void {
        // Tabbing into the radio buttons doesn't do what we want by default, so watch for tabbing and handle all the cases
        document.addEventListener("keydown", function (e) {
            if (e.key === "Tab") {
                const shiftPressed = e.shiftKey;
                const focused: HTMLElement = document.activeElement as HTMLElement;

                // Get the currently checked radio button in Fluent UI
                const radioGroup = document.getElementById("uiChoice") as FluentRadioGroup;
                const checkedRadio = radioGroup?.querySelector("fluent-radio[checked]") as HTMLElement;

                let targetResult: TabTargetResult | null = null;

                // Tab forward from body, or OK should go to radio buttons
                // Tab backwards from telemetry checkbox should go to radio buttons
                if ((!shiftPressed && focused === document.body) ||
                    (!shiftPressed && focused.id === "actionsSettings-OK") ||
                    (shiftPressed && focused.id === "telemetryInput")) {
                    targetResult = { element: checkedRadio, routine: "radioButtonNavigation" };
                }
                // Shift tab from radio buttons or body should go to OK
                else if ((shiftPressed && focused.tagName.toLowerCase() === "fluent-radio") ||
                    (shiftPressed && focused === document.body)) {
                    targetResult = { element: document.getElementById("actionsSettings-OK"), routine: "toOKButton" };
                }
                // Tab or shift tab from diagnostics OK should go to code
                else if (focused.id === "actionsDiag-OK") {
                    targetResult = { element: document.getElementById("diagpre"), routine: "diagnosticsNavigation" };
                }

                // Insert the settings and copy buttons into the tab order for the ribbon if we have one
                // This handles tabbing out from these buttons.
                // Tabbing into these buttons is handled in iframe
                if (!shiftPressed && focused.id === "settingsButton") {
                    targetResult = TabNavigation.getTabFromSettingsButtonTarget();
                }
                else if (shiftPressed && focused.id === "copyButton") {
                    targetResult = TabNavigation.getShiftTabFromCopyButtonTarget();
                }

                // If we found a target element, log details and set focus
                if (targetResult?.element) {
                    TabNavigation.logDetailedTabInfo(focused, shiftPressed, "parent", targetResult.element, targetResult.routine);
                    targetResult.element.focus();
                    e.preventDefault();
                } else {
                    TabNavigation.logDetailedTabInfo(focused, shiftPressed, "parent");
                }
            }
        });
    }

    /**
     * Get target element when tabbing from Other button in iframe
     */
    private static getTabFromOtherButtonTarget(): TabTargetResult {
        return {
            element: window.parent.document.getElementById("copyButton"),
            routine: "getTabFromOtherButtonTarget"
        };
    }

    /**
     * Get target element when shift+tabbing from Summary button in iframe
     */
    private static getShiftTabFromSummaryButtonTarget(): TabTargetResult {
        const view = document.querySelector(".header-view[style*=\"display: block\"]") as HTMLElement;
        const tabStops = TabNavigation.findTabStops(view);
        return {
            element: tabStops.length > 0 ? (tabStops[tabStops.length - 1] || null) : null,
            routine: "getShiftTabFromSummaryButtonTarget"
        };
    }

    /**
     * Get target element when shift+tabbing from first view element in iframe
     */
    private static getShiftTabFromFirstViewElementTarget(): TabTargetResult {
        return {
            element: window.parent.document.getElementById("settingsButton"),
            routine: "getShiftTabFromFirstViewElementTarget"
        };
    }

    /**
     * Get target element when tabbing from last view element in iframe
     */
    private static getTabFromLastViewElementTarget(): TabTargetResult {
        return {
            element: document.getElementById("summary-btn"),
            routine: "getTabFromLastViewElementTarget"
        };
    }

    /**
     * Get target element when tabbing from settings button in parent frame
     */
    private static getTabFromSettingsButtonTarget(): TabTargetResult {
        // Find first header-view which is visible, but skip the tab buttons
        const view = TabNavigation.iFrame?.document.querySelector(".content-main") as HTMLElement | null;
        if (view) {
            const tabStops = TabNavigation.findTabStops(view);

            return {
                element: tabStops[0] || null,
                routine: "getTabFromSettingsButtonTarget"
            };
        }

        return {
            element: null,
            routine: "getTabFromSettingsButtonTarget"
        };
    }

    /**
     * Get target element when shift+tabbing from copy button in parent frame
     */
    private static getShiftTabFromCopyButtonTarget(): TabTargetResult {
        return {
            element: TabNavigation.iFrame?.document.getElementById("other-btn") || null,
            routine: "getShiftTabFromCopyButtonTarget"
        };
    }

    /**
     * Log detailed tab navigation information for debugging
     */
    private static logDetailedTabInfo(focused: HTMLElement, shiftPressed: boolean, frameType: string, targetElement?: HTMLElement | null, routine?: string): void {
        const handlerType = frameType === "parent" ? "PARENT FRAME" : "IFRAME";
        console.group(`� ${handlerType} Tab Handler Triggered`);

        // Log basic info
        // Log direction-specific information
        if (shiftPressed) {
            console.log("🔙 Shift+Tab direction: Moving to previous element");
        } else {
            console.log("🔜 Tab direction: Moving to next element");
        }

        console.log(`🔍 Current Focus Element: ${focused.tagName.toLowerCase()}#${focused.id || "no-id"} "${TabNavigation.getElementText(focused)}"`);

        // Log iframe info
        if (frameType === "parent") {
            if (TabNavigation.iFrame) {
                console.log(`🌐 iFrame URL: ${TabNavigation.iFrame.location.href}`);
            }
        } else {
            console.log(`🖼️ Frame Type: iframe content, 🏠 Parent Available: ${window.parent ? "Yes" : "No"}`);
        }

        // Log natural tab order information
        TabNavigation.logNaturalTabOrder(focused, frameType);

        // Log target element if provided
        if (targetElement) {
            console.log(`🎯 Target Element: ${targetElement.tagName.toLowerCase()}#${targetElement.id || "no-id"} "${TabNavigation.getElementText(targetElement)}"`);
            if (routine) {
                console.log(`🔧 Chosen by routine: ${routine}`);
            }
        }
        else
        {
            console.log("🎯 Target Element decided by browser");
        }

        console.groupEnd();
    }

    /**
     * Get readable text content from an element
     */
    private static getElementText(element: HTMLElement): string {
        if (!element) return "N/A";

        // Try various ways to get meaningful text
        let text = element.textContent?.trim() ||
                   element.innerText?.trim() ||
                   element.getAttribute("aria-label") ||
                   element.getAttribute("title") ||
                   element.getAttribute("alt") ||
                   element.getAttribute("placeholder") ||
                   element.getAttribute("value") ||
                   element.id ||
                   "No readable text";

        // Replace any newlines, tabs, or multiple spaces with single spaces to ensure single line
        text = text.replace(/\s+/g, " ");

        return text.substring(0, 50) + (text.length > 50 ? "..." : "");
    }

    /**
     * Log information about natural tab order
     */
    private static logNaturalTabOrder(focused: HTMLElement, frameType: string): void {
        try {
            const targetDocument = frameType === "parent" ? document :
                (TabNavigation.iFrame?.document || document);

            // Get all focusable elements in the document
            const allFocusable = TabNavigation.findTabStops(targetDocument);
            const currentIndex = allFocusable.indexOf(focused);

            // Debug: Log all focusable elements found
            console.log(`🔍 Found ${allFocusable.length} focusable elements in ${frameType}:`);
            allFocusable.forEach((el, i) => {
                const isCurrent = el === focused;
                const marker = isCurrent ? "👉" : "  ";
                console.log(`  ${marker} ${i + 1}: ${el.tagName.toLowerCase()}#${el.id || "no-id"} "${TabNavigation.getElementText(el)}"`);
            });

            if (currentIndex < 0) {
                console.log("❌ Current element not found in natural tab order");
            }
        } catch (error) {
            console.log(`⚠️ Error getting tab order info: ${error}`);
        }
    }
}
