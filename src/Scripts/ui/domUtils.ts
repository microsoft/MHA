/**
 * DOM utility class for HTML manipulation
 * Provides a clean API for common DOM operations with null safety
 */
export class DomUtils {
    /**
     * Get a single element by CSS selector
     * @param selector CSS selector string
     * @returns HTMLElement or null if not found
     */
    static getElement(selector: string): HTMLElement | null {
        return document.querySelector(selector) as HTMLElement;
    }

    /**
     * Get multiple elements by CSS selector
     * @param selector CSS selector string
     * @returns Array of HTMLElements
     */
    static getElements(selector: string): HTMLElement[] {
        return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    }

    /**
     * Clear the innerHTML of an element
     * @param selector CSS selector string
     */
    static clearElement(selector: string): void {
        const element = this.getElement(selector);
        if (element) element.innerHTML = "";
    }

    /**
     * Set the text content of an element
     * @param selector CSS selector string
     * @param text Text content to set
     */
    static setText(selector: string, text: string): void {
        const element = this.getElement(selector);
        if (element) element.textContent = text;
    }

    /**
     * Get the text content of an element
     * @param selector CSS selector string
     * @returns The text content or empty string if not found
     */
    static getText(selector: string): string {
        const element = this.getElement(selector);
        return element ? element.textContent || "" : "";
    }

    /**
     * Show an element by setting display to block
     * @param selector CSS selector string
     */
    static showElement(selector: string): void {
        const element = this.getElement(selector);
        if (element) element.style.display = "block";
    }

    /**
     * Hide an element by setting display to none
     * @param selector CSS selector string
     */
    static hideElement(selector: string): void {
        const element = this.getElement(selector);
        if (element) element.style.display = "none";
    }

    /**
     * Hide all elements matching selector by setting display to none
     * @param selector CSS selector string
     */
    static hideAllElements(selector: string): void {
        const elements = this.getElements(selector);
        elements.forEach(element => element.style.display = "none");
    }

    /**
     * Clone a template element's content
     * @param templateId ID of the template element
     * @returns DocumentFragment containing cloned content
     * @throws Error if template not found
     */
    static cloneTemplate(templateId: string): DocumentFragment {
        const template = document.getElementById(templateId) as HTMLTemplateElement;
        if (!template) {
            throw new Error(`Template with id "${templateId}" not found`);
        }
        return template.content.cloneNode(true) as DocumentFragment;
    }

    /**
     * Clone a template and append it to a parent element
     * @param templateId ID of the template element
     * @param parent Parent element to append to
     * @returns DocumentFragment that was appended
     */
    static appendTemplate(templateId: string, parent: HTMLElement): DocumentFragment {
        const clone = this.cloneTemplate(templateId);
        parent.appendChild(clone);
        return clone;
    }

    /**
     * Set text content on an element within a DocumentFragment
     * @param clone DocumentFragment to search within
     * @param selector CSS selector string
     * @param text Text content to set
     */
    static setTemplateText(clone: DocumentFragment, selector: string, text: string): void {
        const element = clone.querySelector(selector) as HTMLElement;
        if (element) {
            element.textContent = text;
        }
    }

    /**
     * Set HTML content on an element within a DocumentFragment
     * @param clone DocumentFragment to search within
     * @param selector CSS selector string
     * @param html HTML content to set
     */
    static setTemplateHTML(clone: DocumentFragment, selector: string, html: string): void {
        const element = clone.querySelector(selector) as HTMLElement;
        if (element) {
            element.innerHTML = html;
        }
    }

    /**
     * Set an attribute on an element within a DocumentFragment
     * @param clone DocumentFragment to search within
     * @param selector CSS selector string
     * @param attribute Attribute name
     * @param value Attribute value
     */
    static setTemplateAttribute(clone: DocumentFragment, selector: string, attribute: string, value: string): void {
        const element = clone.querySelector(selector) as HTMLElement;
        if (element) {
            element.setAttribute(attribute, value);
        }
    }

    /**
     * Hide an element within a DocumentFragment
     * @param clone DocumentFragment to search within
     * @param selector CSS selector string
     */
    static hideTemplateElement(clone: DocumentFragment, selector: string): void {
        const element = clone.querySelector(selector) as HTMLElement;
        if (element) {
            element.style.display = "none";
        }
    }

    /**
     * Common focusable element selector
     */
    static readonly focusableElements = "a, button, input, textarea, select, [tabindex]:not([tabindex=\"-1\"])";

    /**
     * Make elements non-tabbable by setting tabindex to -1
     * @param selector CSS selector string
     */
    static makeFocusableElementsNonTabbable(selector: string): void {
        const elements = this.getElements(selector);
        elements.forEach(container => {
            const focusableElements = container.querySelectorAll(this.focusableElements);
            focusableElements.forEach((el) => {
                (el as HTMLElement).setAttribute("tabindex", "-1");
            });
        });
    }

    /**
     * Restore tabbing by removing tabindex=-1 from elements
     * @param selector CSS selector string
     */
    static restoreFocusableElements(selector: string): void {
        const elements = this.getElements(selector);
        elements.forEach(container => {
            const focusableElements = container.querySelectorAll("[tabindex=\"-1\"]");
            focusableElements.forEach((el) => {
                (el as HTMLElement).removeAttribute("tabindex");
            });
        });
    }

    /**
     * Set accessibility attributes on elements
     * @param selector CSS selector string
     * @param hidden Whether elements should be hidden from screen readers
     * @param visible Whether elements should be visible
     */
    static setAccessibilityState(selector: string, hidden: boolean, visible: boolean): void {
        const elements = this.getElements(selector);
        elements.forEach(element => {
            element.setAttribute("aria-hidden", hidden.toString());
            element.style.visibility = visible ? "visible" : "hidden";
        });
    }

    /**
     * Get the value of an input element
     * @param selector CSS selector string
     * @returns The input value or empty string if not found
     */
    static getValue(selector: string): string {
        const element = this.getElement(selector) as HTMLInputElement;
        return element ? element.value : "";
    }

    /**
     * Set the value of an input element
     * @param selector CSS selector string
     * @param value Value to set
     */
    static setValue(selector: string, value: string): void {
        const element = this.getElement(selector) as HTMLInputElement;
        if (element) element.value = value;
    }

    /**
     * Add a CSS class to an element
     * @param selector CSS selector string
     * @param className Class name to add
     */
    static addClass(selector: string, className: string): void {
        const element = this.getElement(selector);
        if (element) element.classList.add(className);
    }

    /**
     * Remove a CSS class from an element
     * @param selector CSS selector string
     * @param className Class name to remove
     */
    static removeClass(selector: string, className: string): void {
        const element = this.getElement(selector);
        if (element) element.classList.remove(className);
    }

    /**
     * Toggle a CSS class on an element
     * @param selector CSS selector string
     * @param className Class name to toggle
     */
    static toggleClass(selector: string, className: string): void {
        const element = this.getElement(selector);
        if (element) element.classList.toggle(className);
    }

    /**
     * Check if an element has a CSS class
     * @param selector CSS selector string
     * @param className Class name to check
     * @returns True if element has the class, false otherwise
     */
    static hasClass(selector: string, className: string): boolean {
        const element = this.getElement(selector);
        return element ? element.classList.contains(className) : false;
    }
}
