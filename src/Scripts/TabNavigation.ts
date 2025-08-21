// Fluent UI Web Components interfaces for tab navigation
interface FluentRadioGroup extends HTMLElement {
    value: string;
}

export class TabNavigation {
    private static iFrame: Window | null = null;

    /**
     * Finds all focusable elements within a given HTML element or document.
     * This function searches for all focusable elements within the specified container
     * and returns an array of those elements that are not disabled, have a non-negative
     * tabIndex, and are visible.
     */
    public static findTabStops(container: HTMLElement | Document | null): HTMLElement[] {
        if (container === null) return [];

        // Comprehensive selector that includes both standard and Fluent UI elements
        const focusableElements = container.querySelectorAll(
            "a, button, input, textarea, select, [tabindex], " +
            "fluent-button, fluent-checkbox, fluent-radio, fluent-text-field, " +
            "fluent-text-area, fluent-select, fluent-combobox, details, [contenteditable]"
        );

        return Array.from(focusableElements).filter(TabNavigation.isFocusableElement);
    }

    /**
     * Checks if an element is focusable based on various criteria
     */
    public static isFocusableElement(el: Element): el is HTMLElement {
        if (!(el instanceof HTMLElement)) {
            return false;
        }
        if (el.hasAttribute("disabled")) {
            return false;
        }

        // Check if element is visible (offsetParent is null for hidden elements)
        if (el.offsetParent === null) {
            return false;
        }

        // For fluent components, they are focusable by default unless explicitly disabled
        const tagName = el.tagName.toLowerCase();
        if (tagName.startsWith("fluent-")) {
            return true;
        }

        // For standard HTML elements, check tabIndex
        if (el.tabIndex < 0) {
            return false;
        }

        // For elements with explicit tabindex, they're focusable
        if (el.hasAttribute("tabindex")) {
            return true;
        }

        // Standard focusable elements
        const focusableTags = ["a", "button", "input", "textarea", "select", "details"];
        if (focusableTags.includes(tagName)) {
            // Special case: anchor tags need href to be focusable
            if (tagName === "a") {
                return el.hasAttribute("href");
            }
            return true;
        }

        // Elements with contenteditable are focusable
        if (el.hasAttribute("contenteditable") && el.getAttribute("contenteditable") !== "false") {
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
                let targetElement: HTMLElement | null = null;

                // Tab from Other goes to copy button
                if (!shiftPressed && focused.id === "other-btn") {
                    targetElement = TabNavigation.getTabFromOtherButtonTarget();
                }
                // Tab back from Summary goes to end of view
                else if (shiftPressed && focused.id === "summary-btn") {
                    targetElement = TabNavigation.getShiftTabFromSummaryButtonTarget();
                }
                // If we're tabbing off of the view, we want to tab to the appropriate ribbon button
                else {
                    const view = document.querySelector(".header-view[style*=\"display: block\"]") as HTMLElement;
                    const tabStops = TabNavigation.findTabStops(view);

                    if (shiftPressed){
                        // If our current focus is the first element in the list, we want to move focus to the settings button
                        if (tabStops.length > 0 && focused === tabStops[0]){
                            targetElement = TabNavigation.getShiftTabFromFirstViewElementTarget();
                        }
                    }
                    else{
                        // If our current focus is the last element in the list, we want to move focus to the summary-btn
                        if (tabStops.length > 0 && focused === tabStops[tabStops.length - 1]){
                            targetElement = TabNavigation.getTabFromLastViewElementTarget();
                        }
                    }
                }

                // If we found a target element, log details and set focus
                if (targetElement) {
                    TabNavigation.logDetailedTabInfo(focused, shiftPressed, "iframe", targetElement);
                    targetElement.focus();
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

                let targetElement: HTMLElement | null = null;

                // Tab forward from body, or OK should go to radio buttons
                // Tab backwards from telemetry checkbox should go to radio buttons
                if ((!shiftPressed && focused === document.body) ||
                    (!shiftPressed && focused.id === "actionsSettings-OK") ||
                    (shiftPressed && focused.id === "telemetryInput")) {
                    targetElement = checkedRadio;
                }
                // Shift tab from radio buttons or body should go to OK
                else if ((shiftPressed && focused.tagName.toLowerCase() === "fluent-radio") ||
                    (shiftPressed && focused === document.body)) {
                    targetElement = document.getElementById("actionsSettings-OK");
                }
                // Tab or shift tab from diagnostics OK should go to code
                else if (focused.id === "actionsDiag-OK") {
                    targetElement = document.getElementById("diagpre");
                }

                // Insert the settings and copy buttons into the tab order for the ribbon if we have one
                // This handles tabbing out from these buttons.
                // Tabbing into these buttons is handled in iframe
                if (!shiftPressed && focused.id === "settingsButton") {
                    targetElement = TabNavigation.getTabFromSettingsButtonTarget();
                }
                else if (shiftPressed && focused.id === "copyButton") {
                    targetElement = TabNavigation.getShiftTabFromCopyButtonTarget();
                }

                // If we found a target element, log details and set focus
                if (targetElement) {
                    TabNavigation.logDetailedTabInfo(focused, shiftPressed, "parent", targetElement);
                    targetElement.focus();
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
    private static getTabFromOtherButtonTarget(): HTMLElement | null {
        return window.parent.document.getElementById("copyButton");
    }

    /**
     * Get target element when shift+tabbing from Summary button in iframe
     */
    private static getShiftTabFromSummaryButtonTarget(): HTMLElement | null {
        const view = document.querySelector(".header-view[style*=\"display: block\"]") as HTMLElement;
        const tabStops = TabNavigation.findTabStops(view);
        return tabStops.length > 0 ? (tabStops[tabStops.length - 1] || null) : null;
    }

    /**
     * Get target element when shift+tabbing from first view element in iframe
     */
    private static getShiftTabFromFirstViewElementTarget(): HTMLElement | null {
        return window.parent.document.getElementById("settingsButton");
    }

    /**
     * Get target element when tabbing from last view element in iframe
     */
    private static getTabFromLastViewElementTarget(): HTMLElement | null {
        return document.getElementById("summary-btn");
    }

    /**
     * Get target element when tabbing from settings button in parent frame
     */
    private static getTabFromSettingsButtonTarget(): HTMLElement | null {
        // Find first header-view which is visible, but skip the tab buttons
        const view = TabNavigation.iFrame?.document.querySelector(".header-view[style*=\"display: block\"]") as HTMLElement;
        if (view) {
            // Look for focusable elements in the content area, excluding the tab buttons
            const contentArea = view.querySelector(".ms-Pivot-content, .header-view-content, [role='tabpanel']") as HTMLElement;
            const targetArea = contentArea || view;

            const tabStops = TabNavigation.findTabStops(targetArea);
            // Filter out any tab buttons from the focusable elements
            const contentTabStops = tabStops.filter(el =>
                !el.classList.contains("ms-Pivot-link") &&
                !el.classList.contains("ms-Button--pivot") &&
                !el.id.includes("-btn") &&
                !el.getAttribute("role")?.includes("tab")
            );

            return contentTabStops.length > 0 ? (contentTabStops[0] || null) : null;
        }
        return null;
    }

    /**
     * Get target element when shift+tabbing from copy button in parent frame
     */
    private static getShiftTabFromCopyButtonTarget(): HTMLElement | null {
        return TabNavigation.iFrame?.document.getElementById("other-btn") || null;
    }

    /**
     * Log detailed tab navigation information for debugging
     */
    private static logDetailedTabInfo(focused: HTMLElement, shiftPressed: boolean, frameType: string, targetElement?: HTMLElement | null): void {
        const handlerType = frameType === "parent" ? "PARENT FRAME" : "IFRAME";
        console.group(`� ${handlerType} Tab Handler Triggered`);

        // Log basic info
        // Log direction-specific information
        if (shiftPressed) {
            console.log("🔙 Shift+Tab direction: Moving to previous element");
        } else {
            console.log("🔜 Tab direction: Moving to next element");
        }
        console.log(`🎯 Current Focus Control Type: ${focused?.tagName?.toLowerCase() || "unknown"}`);
        console.log(`📝 Current Focus Text: "${TabNavigation.getElementText(focused)}"`);

        // Log iframe info
        if (frameType === "parent") {
            console.log(`🖼️ Using iFrame: ${TabNavigation.iFrame ? "Available" : "Not set"}`);
            if (TabNavigation.iFrame) {
                console.log(`🌐 iFrame URL: ${TabNavigation.iFrame.location.href}`);
            }
        } else {
            console.log("🖼️ Frame Type: iframe content");
            console.log(`🏠 Parent Available: ${window.parent ? "Yes" : "No"}`);
        }

        // Log natural tab order information
        TabNavigation.logNaturalTabOrder(focused, frameType);

        // Log target element if provided
        if (targetElement) {
            console.log(`🎯 Target Element Type: ${targetElement.tagName?.toLowerCase() || "unknown"}`);
            console.log(`📝 Target Element Text: "${TabNavigation.getElementText(targetElement)}"`);
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
        const text = element.textContent?.trim() ||
                    element.innerText?.trim() ||
                    element.getAttribute("aria-label") ||
                    element.getAttribute("title") ||
                    element.getAttribute("alt") ||
                    element.getAttribute("placeholder") ||
                    element.getAttribute("value") ||
                    element.id ||
                    "No readable text";

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
                console.log(`${marker} ${i + 1}: ${el.tagName.toLowerCase()}#${el.id || "no-id"} "${TabNavigation.getElementText(el)}"`);
            });

            if (currentIndex >= 0) {
                console.log(`📊 Current position in tab order: ${currentIndex + 1} of ${allFocusable.length}`);

                // Log previous element
                const prevIndex = currentIndex - 1;
                if (prevIndex >= 0 && allFocusable[prevIndex]) {
                    const prevElement = allFocusable[prevIndex];
                    console.log(`⬅️ Previous in tab order: ${prevElement.tagName.toLowerCase()}#${prevElement.id || "no-id"} "${TabNavigation.getElementText(prevElement)}"`);
                } else {
                    console.log("⬅️ Previous in tab order: [NONE - at beginning]");
                }

                // Log next element
                const nextIndex = currentIndex + 1;
                if (nextIndex < allFocusable.length && allFocusable[nextIndex]) {
                    const nextElement = allFocusable[nextIndex];
                    console.log(`➡️ Next in tab order: ${nextElement.tagName.toLowerCase()}#${nextElement.id || "no-id"} "${TabNavigation.getElementText(nextElement)}"`);
                } else {
                    console.log("➡️ Next in tab order: [NONE - at end]");
                }
            } else {
                console.log("❌ Current element not found in natural tab order");
            }
        } catch (error) {
            console.log(`⚠️ Error getting tab order info: ${error}`);
        }
    }
}
