import { StackFrame, StackTraceOptions } from "stacktrace-js";
import * as stackTrace from "stacktrace-js";

import { diagnostics } from "./Diag";
import { Errors } from "./Errors";
import { Strings } from "./Strings";

export class Stack {
    public static options: StackTraceOptions = {offline: false};

    // While trying to get our error tracking under control, let's not filter our stacks
    private static async filterStack(stack: StackFrame[]): Promise<StackFrame[]> {
        return stack.filter(function (item: StackFrame) {
            if (!item.fileName) return true;
            if (item.fileName.indexOf("stacktrace") !== -1) return false; // remove stacktrace.js frames
            if (item.fileName.indexOf("stacks.ts") !== -1) return false; // remove stacks.ts frames
            //if (item.functionName === "ShowError") return false;
            //if (item.functionName === "showError") return false;
            //if (item.functionName === "Errors.log") return false; // Logs with Errors.log in them usually have location where it was called from - keep those
            //if (item.functionName === "GetStack") return false;
            if (item.functionName === "Errors.isError") return false; // Not called from anywhere interesting
            if (item.functionName?.indexOf("Promise._immediateFn") !== -1) return false; // only shows in IE stacks
            return true;
        });
    }

    public static async getExceptionStack(exception: unknown): Promise<StackFrame[]> {
        let stack;
        if (!Errors.isError(exception)) {
            stack = await stackTrace.get(Stack.options);
        } else {
            stack = await stackTrace.fromError(exception as Error, Stack.options);
        }

        return Stack.filterStack(stack);
    }

    public static parse(exception: unknown, message: string | null, handler: (eventName: string, stack: string[]) => void): void {
        let stack;
        const exceptionMessage = Errors.getErrorMessage(exception);

        let eventName = Strings.joinArray([message, exceptionMessage], " : ");
        if (!eventName) {
            eventName = "Unknown exception";
        }

        this.getExceptionStack(exception).then((stackframes) => {
            stack = stackframes.map(function (sf) {
                return sf.toString();
            });
            handler(eventName, stack);
        }).catch((err) => {
            diagnostics.trackEvent({ name: "Errors.parse errback" });
            stack = [JSON.stringify(exception, null, 2), "Parsing error:", JSON.stringify(err, null, 2)];
            handler(eventName, stack);
        });
    }
}