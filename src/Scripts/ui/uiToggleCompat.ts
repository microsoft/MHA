// Compatibility exports for legacy GetHeaders modules that import these functions
// Separated from uiToggle.ts to avoid circular dependencies

import { ParentFrame } from "../ParentFrame";

export function ShowError(error: unknown, message: string, suppressTracking?: boolean): void {
    // Delegate to ParentFrame's error handling
    if (ParentFrame && ParentFrame.showError) {
        ParentFrame.showError(error, message, suppressTracking);
    } else {
        console.error("ShowError:", message, error);
    }
}

export function LogError(error: unknown, message: string, suppressTracking?: boolean): void {
    // For now just use showError since ParentFrame doesn't have logError
    if (ParentFrame && ParentFrame.showError) {
        ParentFrame.showError(error, message, suppressTracking);
    } else {
        console.error("LogError:", message, error);
    }
}

export function UpdateStatus(statusText: string): void {
    // Delegate to ParentFrame's status updates
    if (ParentFrame && ParentFrame.updateStatus) {
        ParentFrame.updateStatus(statusText);
    } else {
        console.log("UpdateStatus:", statusText);
    }
}