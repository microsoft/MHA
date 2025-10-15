import { GetHeadersAPI } from "./GetHeadersAPI";
import { GetHeadersEWS } from "./GetHeadersEWS";
import { GetHeadersRest } from "./GetHeadersRest";
import { LogError, ShowError } from "../uiToggle";

/*
 * GetHeaders.js
 *
 * Selector for switching between EWS and Rest logic
 */

export class GetHeaders {
    public static permissionLevel(): number {
        if (typeof (Office) === "undefined") return 0;
        if (!Office) return 0;
        if (!Office.context) return 0;
        if (!Office.context.mailbox) return 0;
        // @ts-expect-error early version of initialData
        if (Office.context.mailbox._initialData$p$0) return Office.context.mailbox._initialData$p$0._permissionLevel$p$0;
        // @ts-expect-error initialData is missing from the type file
        if (Office.context.mailbox.initialData) return Office.context.mailbox.initialData.permissionLevel;
        return 0;
    }

    public static sufficientPermission(strict: boolean): boolean {
        if (typeof (Office) === "undefined") return false;
        if (!Office) return false;
        if (!Office.context) return false;
        if (!Office.context.mailbox) return false;
        // In strict mode, we must find permissions to conclude we have them
        // In non-strict mode, if we don't find permissions, we assume we might have them
        // Some down level clients (such as we would use EWS on) don't have _initialData$p$0 or initialData at all.
        // @ts-expect-error initialData is missing from the type file
        if (!Office.context.mailbox._initialData$p$0 && !Office.context.mailbox.initialData) return !strict;
        if (GetHeaders.permissionLevel() < 1) return false;
        return true;
    }

    public static canUseAPI(apiType: string, minset: string): boolean {
        // if (apiType === "API") { return false; }
        // if (apiType === "Rest") { return false; }
        if (typeof (Office) === "undefined") { return false; }
        if (!Office) { return false; }
        if (!Office.context) { return false; }
        if (!Office.context.requirements) { return false; }
        if (!Office.context.requirements.isSetSupported("Mailbox", minset)) { return false; }
        if (!GetHeaders.sufficientPermission(true)) { return false; }
        if (!Office.context.mailbox) { return false; }
        if (!Office.context.mailbox.getCallbackTokenAsync) { return false; }
        return true;
    }

    public static validItem(): boolean {
        if (typeof (Office) === "undefined") return false;
        if (!Office) return false;
        if (!Office.context) return false;
        if (!Office.context.mailbox) return false;
        if (!Office.context.mailbox.item) return false;
        if (!Office.context.mailbox.item.itemId) return false;
        return true;
    }

    public static async send(headersLoadedCallback: (_headers: string, apiUsed: string) => void) {
        if (!GetHeaders.validItem()) {
            ShowError(null, "No item selected", true);
            return;
        }

        if (!GetHeaders.sufficientPermission(false)) {
            ShowError(null, "Insufficient permissions to request headers", false);
            return;
        }

        try {
            let headers:string = await GetHeadersAPI.send();
            if (headers !== "") {
                headersLoadedCallback(headers, "API");
                return;
            }

            LogError(null, "API failed, trying REST", true);
            headers = await GetHeadersRest.send();
            if (headers !== "") {
                headersLoadedCallback(headers, "REST");
                return;
            }

            LogError(null, "REST failed, trying EWS", true);
            headers = await GetHeadersEWS.send();
            if (headers !== "") {
                headersLoadedCallback(headers, "EWS");
                return;
            }
        } catch (e) {
            ShowError(e, "Could not send header request", false);
        }
    }
}

// Legacy compatibility wrapper - maintains old interface for existing code
export function sendHeadersRequest(headersLoadedCallback: (_headers: string, apiUsed: string) => void): void {
    GetHeaders.send(headersLoadedCallback);
}
