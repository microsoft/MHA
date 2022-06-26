import { GetHeadersAPI } from "./GetHeadersAPI";
import { ParentFrame } from "./parentFrame";
import { Diagnostics } from "./diag";

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
        // @ts-ignore early version of initialData
        if (Office.context.mailbox._initialData$p$0) return Office.context.mailbox._initialData$p$0._permissionLevel$p$0;
        // @ts-ignore initialData is missing from the type file
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
        // @ts-ignore initialData is missing from the type file
        if (!Office.context.mailbox._initialData$p$0 && !Office.context.mailbox.initialData) return !strict;
        if (GetHeaders.permissionLevel() < 1) return false;
        return true;
    }

    public static canUseAPI(apiType: string, minset: string): boolean {
        if (typeof (Office) === "undefined") { Diagnostics.set(`no${apiType}reason`, "Office undefined"); return false; }
        if (!Office) { Diagnostics.set(`no${apiType}reason`, "Office false"); return false; }
        if (!Office.context) { Diagnostics.set("noUseRestReason", "context false"); return false; }
        if (!Office.context.requirements) { Diagnostics.set("noUseRestReason", "requirements false"); return false; }
        if (!Office.context.requirements.isSetSupported("Mailbox", minset)) { Diagnostics.set(`no${apiType}reason`, "requirements too low"); return false; }
        if (!GetHeaders.sufficientPermission(true)) { Diagnostics.set(`no${apiType}reason`, "sufficientPermission false"); return false; }
        if (!Office.context.mailbox) { Diagnostics.set(`no${apiType}reason`, "mailbox false"); return false; }
        if (!Office.context.mailbox.getCallbackTokenAsync) { Diagnostics.set(`no${apiType}reason`, "getCallbackTokenAsync false"); return false; }
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

    public static send(headersLoadedCallback: Function) {
        if (!GetHeaders.validItem()) {
            ParentFrame.showError(null, "No item selected", true);
            return;
        }

        if (!GetHeaders.sufficientPermission(false)) {
            ParentFrame.showError(null, "Insufficient permissions to request headers", false);
            return;
        }

        try {
            GetHeadersAPI.send(headersLoadedCallback);
        } catch (e) {
            ParentFrame.showError(e, "Could not send header request");
        }
    }
}