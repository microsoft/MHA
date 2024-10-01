/**
 * Finds all tab stops within a given HTML element.
 *
 * This function searches for all focusable elements within the specified element
 * and returns an array of those elements that are not disabled, have a non-negative
 * tabIndex, and are visible (i.e., their offsetParent is not null).
 *
 * @param element - The root HTML element within which to search for tab stops.
 * @returns An array of HTMLElements that are focusable and meet the criteria.
 */
export function findTabStops(element: HTMLElement | null): HTMLElement[] {
    // If the element is null, return empty array
    if (element === null) return [];
    const focusableElements = element.querySelectorAll("a, button, input, textarea, select, [tabindex]");
    return Array.from(focusableElements).filter(isFocusableElement);
}

export function isFocusableElement(el: Element): el is HTMLElement {
    if (!(el instanceof HTMLElement)) {
        return false;
    }
    if (el.hasAttribute("disabled")) {
        return false;
    }
    if (el.tabIndex < 0) {
        return false;
    }
    if (el.offsetParent === null) {
        return false;
    }
    return true;
}