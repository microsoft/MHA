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
    private static readonly debugEnabled = false; // Set to false to disable all debug logging

    // Comprehensive selector that includes both standard and Fluent UI elements
    private static readonly focusableSelector =
        "a, button, input, textarea, select, [tabindex], " +
        "fluent-button, fluent-checkbox, fluent-radio, fluent-text-field, " +
        "fluent-text-area, fluent-select, fluent-combobox, details, [contenteditable]";

    // CSS selectors for common UI elements
    private static readonly selectors = {
        visibleHeaderView: ".header-view[style*=\"display: block\"]"
    } as const;

    // Selectors to try for iframe content area in order of preference
    private static readonly iframeContentSelectors = [
        ".content-main",
        ".page-content",
        ".view",
        "body"
    ] as const;

    // Element IDs for common UI components
    private static readonly elementIds = {
        uiChoice: "uiChoice",
        settingsDiagButton: "actionsSettings-diag",
        settingsOkButton: "actionsSettings-OK",
        diagOkButton: "actionsDiag-OK",
        diagPre: "diagpre",
        copyButton: "copyButton",
        settingsButton: "settingsButton",
        summaryBtn: "summary-btn",
        otherBtn: "other-btn",
        telemetryInput: "telemetryInput",
        privacyLink: "privacy-link"
    } as const;

    /**
     * Finds all focusable elements within a given HTML element or document.
     * Returns elements that are focusable based on:
     * - Standard focusable elements (a[href], button, input, textarea, select, details)
     * - Fluent UI components (fluent-button, fluent-radio, etc.)
     * - Elements with explicit tabindex attribute
     * - Elements with contenteditable
     * Elements must be visible (not disabled, not hidden) to be included.
     * Works across different document contexts (e.g., iframe).
     *
     * @param container - The HTML element, document, or null to search within for focusable elements
     * @returns Array of focusable HTMLElements, empty array if container is null
     */
    public static findTabStops(container: HTMLElement | Document | null): HTMLElement[] {
        if (container === null) {
            return [];
        }

        const focusableElements = container.querySelectorAll(TabNavigation.focusableSelector);

        // For cross-frame compatibility, filter and type-check elements
        // Elements from iframe have different HTMLElement constructor than parent frame
        const htmlElements = Array.from(focusableElements)
            .filter((el): el is HTMLElement => TabNavigation.isHTMLElement(el));

        return htmlElements.filter(TabNavigation.isFocusableElement);
    }

    /**
     * Checks if an element is an HTMLElement in any document context (cross-frame compatible)
     *
     * @param el - The element to check
     * @returns True if the element is an HTMLElement in any document context
     */
    private static isHTMLElement(el: Element): el is HTMLElement {
        // Check if it's an HTMLElement in any document context
        if (el instanceof HTMLElement) return true;

        // Check if it's an HTMLElement in the iframe context
        const element = el as Element;
        const elementDoc = element.ownerDocument;
        const iframeHTMLElement = elementDoc?.defaultView?.HTMLElement;
        return !!(iframeHTMLElement && el instanceof iframeHTMLElement);
    }

    /**
     * Checks if an element is focusable based on various criteria
     * Handles cross-frame elements properly
     *
     * @param el - The element to check for focusability
     * @returns True if the element is focusable and should be included in tab navigation
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
        // Exception: dialog elements may have offsetParent null but still be visible
        if (htmlEl.offsetParent === null) {
            // Special case: elements inside an open dialog should be considered visible
            const parentDialog = htmlEl.closest("fluent-dialog:not([hidden])");
            if (!parentDialog) {
                return false;
            }
        }

        // For fluent components, they are focusable by default unless explicitly disabled
        const tagName = htmlEl.tagName.toLowerCase();
        if (tagName.startsWith("fluent-")) {
            return true;
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
     *
     * @param frame - The iframe window object to enable cross-frame tab navigation, or null to clear
     */
    public static setIFrame(frame: Window | null): void {
        TabNavigation.iFrame = frame;
    }

    /**
     * Initialize tab navigation event listeners
     * Should be called once when the application starts
     * Sets up all keyboard event handling for cross-frame tab navigation
     */
    public static initialize(): void {
        // Add debug CSS class to enable visual focus indicators when debugging
        if (TabNavigation.debugEnabled) {
            document.body.classList.add("tab-navigation-debug");
        }

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
                    const view = document.querySelector(TabNavigation.selectors.visibleHeaderView) as HTMLElement;
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
     * Sets up keyboard event listeners to handle tab navigation between UI elements
     * and cross-frame communication with iframe content
     */
    public static initializeParentFrameTabHandling(): void {
        let lastFocusedBeforeTab: HTMLElement | null = null;

        // Capture the focused element BEFORE tab processing
        document.addEventListener("keydown", function (e) {
            if (e.key === "Tab") {
                lastFocusedBeforeTab = document.activeElement as HTMLElement;
            }
        }, true); // Use capture phase to run BEFORE other handlers

        // Tabbing into the radio buttons doesn't do what we want by default, so watch for tabbing and handle all the cases
        document.addEventListener("keydown", function (e) {
            if (e.key === "Tab") {
                const shiftPressed = e.shiftKey;
                const focused: HTMLElement = lastFocusedBeforeTab || (document.activeElement as HTMLElement);

                // Determine the target element for this tab operation
                let targetResult: TabTargetResult | null = null;

                // Check if we're in a dialog - if so, implement circular tab navigation
                const openDialog = document.querySelector("fluent-dialog:not([hidden])") as HTMLElement;
                if (openDialog && openDialog.contains(focused)) {

                    // Define the dialog tab order
                    const radioGroup = document.getElementById(TabNavigation.elementIds.uiChoice) as FluentRadioGroup;
                    let checkedRadio = radioGroup?.querySelector("fluent-radio[checked]") as HTMLElement;

                    // Find the correct current radio button using Fluent UI Web Components attributes
                    if (!checkedRadio && radioGroup) {
                        const allRadios = radioGroup.querySelectorAll("fluent-radio");

                        // Try to find the actually selected radio button
                        checkedRadio = Array.from(allRadios).find(r =>
                            r.getAttribute("current-checked") === "true" ||
                            r.getAttribute("aria-checked") === "true" ||
                            r.hasAttribute("checked")
                        ) as HTMLElement;

                        // If still not found, use the radio group value to find it
                        if (!checkedRadio && radioGroup.value) {
                            checkedRadio = radioGroup.querySelector(`fluent-radio[current-value="${radioGroup.value}"]`) as HTMLElement;
                        }
                    }

                    const telemetryCheckbox = document.getElementById(TabNavigation.elementIds.telemetryInput);
                    const privacyLink = document.getElementById(TabNavigation.elementIds.privacyLink) as HTMLElement;
                    const settingsDiagButton = document.getElementById(TabNavigation.elementIds.settingsDiagButton);
                    const settingsOkButton = document.getElementById(TabNavigation.elementIds.settingsOkButton);
                    // Cheat and handle both dialogs as one - missing elements doesn't break our logic
                    const diagPre = document.getElementById(TabNavigation.elementIds.diagPre);
                    const diagOkButton = document.getElementById(TabNavigation.elementIds.diagOkButton);

                    const dialogTabOrder = [
                        checkedRadio,
                        telemetryCheckbox,
                        privacyLink,
                        settingsDiagButton,
                        settingsOkButton,
                        diagPre,
                        diagOkButton
                    ].filter(el => el) as HTMLElement[];

                    const currentIndex = dialogTabOrder.indexOf(focused);

                    if (currentIndex !== -1) {
                        // Calculate next/previous index with circular wrap-around
                        let targetIndex;
                        if (shiftPressed) {
                            // Shift+Tab: go to previous element, wrap to last if at first
                            targetIndex = currentIndex === 0 ? dialogTabOrder.length - 1 : currentIndex - 1;
                        } else {
                            // Tab: go to next element, wrap to first if at last
                            targetIndex = currentIndex === dialogTabOrder.length - 1 ? 0 : currentIndex + 1;
                        }

                        const targetElement = dialogTabOrder[targetIndex];
                        if (targetElement) {
                            targetResult = { element: targetElement, routine: "dialogCircularNavigation" };
                        }
                    } else {
                        // Focus is outside the tab order but in dialog - force to first element
                        if (dialogTabOrder.length > 0 && dialogTabOrder[0]) {
                            targetResult = { element: dialogTabOrder[0], routine: "dialogRecovery" };
                        }
                    }
                }
                // Insert the settings and copy buttons into the tab order for the ribbon if we have one
                // This handles tabbing out from these buttons.
                // Tabbing into these buttons is handled in iframe
                else if (!shiftPressed && focused.id === TabNavigation.elementIds.copyButton) {
                    targetResult = TabNavigation.getTabFromCopyButtonTarget();
                }
                else if (!shiftPressed && focused.id === TabNavigation.elementIds.settingsButton) {
                    targetResult = TabNavigation.getTabFromSettingsButtonTarget();
                }
                else if (shiftPressed && focused.id === TabNavigation.elementIds.copyButton) {
                    targetResult = TabNavigation.getShiftTabFromCopyButtonTarget();
                }
                else if (shiftPressed && focused.id === TabNavigation.elementIds.settingsButton) {
                    targetResult = TabNavigation.getShiftTabFromSettingsButtonTarget();
                }

                // If we found a target element, log details and set focus
                if (targetResult?.element) {
                    TabNavigation.logDetailedTabInfo(focused, shiftPressed, "parent", targetResult.element, targetResult.routine);
                    targetResult.element.focus();
                    e.preventDefault();
                    e.stopPropagation();
                } else {
                    TabNavigation.logDetailedTabInfo(focused, shiftPressed, "parent");
                }
            }
        });
    }

    /**
     * Get target element when tabbing from Other button in iframe
     *
     * @returns TabTargetResult containing the copy button element from parent frame
     */
    private static getTabFromOtherButtonTarget(): TabTargetResult {
        return {
            element: window.parent.document.getElementById(TabNavigation.elementIds.copyButton),
            routine: "getTabFromOtherButtonTarget"
        };
    }

    /**
     * Get target element when shift+tabbing from Summary button in iframe
     *
     * @returns TabTargetResult containing the last focusable element in the visible header view
     */
    private static getShiftTabFromSummaryButtonTarget(): TabTargetResult {
        const view = document.querySelector(TabNavigation.selectors.visibleHeaderView) as HTMLElement;
        const tabStops = TabNavigation.findTabStops(view);
        return {
            element: tabStops[tabStops.length - 1] || null,
            routine: "getShiftTabFromSummaryButtonTarget"
        };
    }

    /**
     * Get target element when shift+tabbing from first view element in iframe
     *
     * @returns TabTargetResult containing the settings button from parent frame
     */
    private static getShiftTabFromFirstViewElementTarget(): TabTargetResult {
        return {
            element: window.parent.document.getElementById(TabNavigation.elementIds.settingsButton),
            routine: "getShiftTabFromFirstViewElementTarget"
        };
    }

    /**
     * Get target element when tabbing from last view element in iframe
     *
     * @returns TabTargetResult containing the summary button element
     */
    private static getTabFromLastViewElementTarget(): TabTargetResult {
        return {
            element: document.getElementById(TabNavigation.elementIds.summaryBtn),
            routine: "getTabFromLastViewElementTarget"
        };
    }

    /**
     * Get target element when tabbing from settings button in parent frame
     *
     * @returns TabTargetResult containing the first focusable element in iframe content area
     */
    private static getTabFromSettingsButtonTarget(): TabTargetResult {
        // Find first header-view which is visible, but skip the tab buttons
        let view: HTMLElement | null = null;

        if (TabNavigation.iFrame?.document) {
            for (const selector of TabNavigation.iframeContentSelectors) {
                view = TabNavigation.iFrame.document.querySelector(selector) as HTMLElement | null;
                if (view) break;
            }
        }

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
     * Get target element when shift+tabbing from settings button in parent frame
     */
    private static getShiftTabFromSettingsButtonTarget(): TabTargetResult {
        return {
            element: document.getElementById(TabNavigation.elementIds.copyButton) || null,
            routine: "getShiftTabFromSettingsButtonTarget"
        };
    }

    /**
     * Get target element when tabbing from copy button in parent frame
     */
    private static getTabFromCopyButtonTarget(): TabTargetResult {
        return {
            element: document.getElementById(TabNavigation.elementIds.settingsButton) || null,
            routine: "getTabFromCopyButtonTarget"
        };
    }

    /**
     * Get target element when shift+tabbing from copy button in parent frame
     */
    private static getShiftTabFromCopyButtonTarget(): TabTargetResult {
        return {
            element: TabNavigation.iFrame?.document.getElementById(TabNavigation.elementIds.otherBtn) || null,
            routine: "getShiftTabFromCopyButtonTarget"
        };
    }

    /**
     * Log detailed tab navigation information for debugging
     *
     * @param focused - The currently focused element
     * @param shiftPressed - Whether shift key was pressed (reverse tab direction)
     * @param frameType - The frame context ("parent" or "iframe")
     * @param targetElement - The target element for navigation (optional)
     * @param routine - The name of the routine handling the navigation (optional)
     */
    private static logDetailedTabInfo(focused: HTMLElement, shiftPressed: boolean, frameType: string, targetElement?: HTMLElement | null, routine?: string): void {
        if (!TabNavigation.debugEnabled) return;

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
     * Get readable text content from an element for debugging purposes
     *
     * @param element - The HTML element to extract text from
     * @returns Truncated readable text representation of the element (max 50 chars)
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
     * Log information about natural tab order for debugging
     *
     * @param focused - The currently focused element
     * @param frameType - The frame context ("parent" or "iframe")
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
