import { findTabStops } from "./findTabStops";

// Fluent UI Web Components interfaces for tab navigation
interface FluentRadioGroup extends HTMLElement {
    value: string;
}

export class TabNavigation {
    private static iFrame: Window | null = null;

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

                // Tab from Other goes to copy button
                if (!shiftPressed && focused.id === "other-btn") {
                    window.parent.document.getElementById("copyButton")!.focus();
                    e.preventDefault();
                }
                // Tab back from Summary goes to end of view
                else if (shiftPressed && focused.id === "summary-btn") {
                    const view = document.querySelector(".header-view[style*=\"display: block\"]") as HTMLElement;
                    const tabStops = findTabStops(view);
                    // Set focus on last element in the list if we can
                    if (tabStops.length > 0){
                        tabStops[tabStops.length - 1]?.focus();
                        e.preventDefault();
                    }
                }
                // If we're tabbing off of the view, we want to tab to the appropriate ribbon button
                else {
                    const view = document.querySelector(".header-view[style*=\"display: block\"]") as HTMLElement;
                    const tabStops = findTabStops(view);

                    if (shiftPressed){
                        // If our current focus is the first element in the list, we want to move focus to the settings button
                        if (tabStops.length > 0 && focused === tabStops[0]){
                            window.parent.document.getElementById("settingsButton")!.focus();
                            e.preventDefault();
                        }
                    }
                    else{
                        // If our current focus is the last element in the list, we want to move focus to the summary-btn
                        if (tabStops.length > 0 && focused === tabStops[tabStops.length - 1]){
                            document.getElementById("summary-btn")!.focus();
                            e.preventDefault();
                        }
                    }
                }
            }
        });
    }

    /**
     * Initialize tab navigation for the parent frame
     */
    private static initializeParentFrameTabHandling(): void {
        // Tabbing into the radio buttons doesn't do what we want by default, so watch for tabbing and handle all the cases
        document.addEventListener("keydown", function (e) {
            if (e.key === "Tab") {
                const shiftPressed = e.shiftKey;
                const focused: HTMLElement = document.activeElement as HTMLElement;
                TabNavigation.logElement("focused", focused);
                console.log("Shift pressed = " + shiftPressed);

                // Get the currently checked radio button in Fluent UI
                const radioGroup = document.getElementById("uiChoice") as FluentRadioGroup;
                const checkedRadio = radioGroup?.querySelector("fluent-radio[checked]") as HTMLElement;

                // Tab forward from body, or OK should go to radio buttons
                // Tab backwards from telemetry checkbox should go to radio buttons
                if ((!shiftPressed && focused === document.body) ||
                    (!shiftPressed && focused.id === "actionsSettings-OK") ||
                    (shiftPressed && focused.id === "telemetryInput")) {
                    if (checkedRadio) {
                        checkedRadio.focus();
                        e.preventDefault();
                    }
                }
                // Shift tab from radio buttons or body should go to OK
                else if ((shiftPressed && focused.tagName.toLowerCase() === "fluent-radio") ||
                    (shiftPressed && focused === document.body)) {
                    const okButton: HTMLElement = document.getElementById("actionsSettings-OK")!;
                    okButton.focus();
                    e.preventDefault();
                }
                // Tab or shift tab from diagnostics OK should go to code
                else if (focused.id === "actionsDiag-OK") {
                    const diagButton: HTMLElement = document.getElementById("diagpre")!;
                    diagButton.focus();
                    e.preventDefault();
                }

                // Insert the settings and copy buttons into the tab order for the ribbon if we have one
                // This handles tabbing out from these buttons.
                // Tabbing into these buttons is handled in iframe
                if (!shiftPressed && focused.id === "settingsButton") {
                    TabNavigation.handleTabFromSettingsButton(e);
                }
                else if (shiftPressed && focused.id === "copyButton") {
                    TabNavigation.handleShiftTabFromCopyButton(e);
                }
            }
        });
    }

    /**
     * Handle tab navigation from the settings button
     */
    private static handleTabFromSettingsButton(e: KeyboardEvent): void {
        // Find first header-view which is visible, but skip the tab buttons
        const view = TabNavigation.iFrame?.document.querySelector(".header-view[style*=\"display: block\"]") as HTMLElement;
        if (view) {
            // Look for focusable elements in the content area, excluding the tab buttons
            const contentArea = view.querySelector(".ms-Pivot-content, .header-view-content, [role='tabpanel']") as HTMLElement;
            const targetArea = contentArea || view;

            const tabStops = findTabStops(targetArea);
            // Filter out any tab buttons from the focusable elements
            const contentTabStops = tabStops.filter(el =>
                !el.classList.contains("ms-Pivot-link") &&
                !el.classList.contains("ms-Button--pivot") &&
                !el.id.includes("-btn") &&
                !el.getAttribute("role")?.includes("tab")
            );

            // Set focus on first content element if we can
            if (contentTabStops.length > 0){
                contentTabStops[0]?.focus();
                e.preventDefault();
            }
        }
    }

    /**
     * Handle shift+tab navigation from the copy button
     */
    private static handleShiftTabFromCopyButton(e: KeyboardEvent): void {
        const otherButton = TabNavigation.iFrame?.document.getElementById("other-btn");
        if (otherButton) {
            otherButton.focus();
            e.preventDefault();
        }
    }

    /**
     * Log element information for debugging
     */
    private static logElement(title: string, element: HTMLElement): void {
        let out = title + " element:" + element;
        // make sure element isn't null
        if (element) {
            if (element.id) out += " id:" + element.id;
            if (element.className) out += " class:" + element.className;
            if (element.getAttribute("role")) out += " role:" + element.getAttribute("role");
            if (element.title) out += " title:" + element.title;
            if (element.getAttribute("aria-checked")) out += " aria-checked:" + element.getAttribute("aria-checked");
            if (element.getAttribute("for")) out += " for:" + element.getAttribute("for");
            if (element.getAttribute("name")) out += " name:" + element.getAttribute("name");
        }

        console.log(out);
    }
}
