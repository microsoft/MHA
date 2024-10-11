import { StackFrame, StackTraceOptions } from "stacktrace-js";
import * as stackTrace from "stacktrace-js";

import { diagnostics } from "./Diag";
import { Strings } from "./Strings";

let errorArray: string[] = [];

export class Errors {
    public static clear(): void { errorArray = []; }

    public static get() { return errorArray; }

    public static add(eventName: string, stack: string[], suppressTracking: boolean): void {
        if (eventName || stack) {
            const stackString = Strings.joinArray(stack, "\n");
            errorArray.push(Strings.joinArray([eventName, stackString], "\n"));

            if (!suppressTracking) {
                diagnostics.trackEvent({ name: eventName },
                    {
                        stack: stackString,
                        source: "Errors.add"
                    });
            }
        }
    }

    public static isError(error: unknown): boolean {
        if (!error) return false;

        // We can't afford to throw while checking if we're processing an error
        // So just swallow any exception and fail.
        try {
            if (typeof (error) === "string") return false;
            if (typeof (error) === "number") return false;
            if (typeof error === "object" && "stack" in error) return true;
        } catch (e) {
            diagnostics.trackEvent({ name: "isError exception with error", properties: { error: JSON.stringify(e) } });
        }

        return false;
    }

    // error - an exception object
    // message - a string describing the error
    // suppressTracking - boolean indicating if we should suppress tracking
    public static log(error: unknown, message: string, suppressTracking?: boolean): void {
        if (error && !suppressTracking) {
            const event = { name: "Errors.log" };
            const props = {
                message: message,
                error: JSON.stringify(error, null, 2),
                source: "",
                stack: "",
                description: "",
                errorMessage: ""
            };

            if (Errors.isError(error) && (error as { exception?: unknown }).exception) {
                props.source = "Error.log Exception";
                event.name = "Exception";
            }
            else {
                props.source = "Error.log Event";
                if (typeof error === "object" && "description" in error) props.description = (error as { description: string }).description;
                if (typeof error === "object" && "message" in error) props.errorMessage = (error as { message: string }).message;
                if (typeof error === "object" && "stack" in error) props.stack = (error as { stack: string }).stack;
                if (typeof error === "object" && "description" in error) {
                    event.name = (error as { description: string }).description;
                } else if (typeof error === "object" && "message" in error) {
                    event.name = (error as { message: string }).message;
                } else if (props.message) {
                    event.name = props.message;
                } else {
                    event.name = "Unknown error object";
                }
            }

            diagnostics.trackException(event, props);
        }

        Errors.parse(error, message, function (eventName: string, stack: string[]): void {
            Errors.add(eventName, stack, suppressTracking ?? false);
        });
    }

    // exception - an exception object
    // message - a string describing the error
    // handler - function to call with parsed error
    public static parse(exception: unknown, message: string | null, handler: (eventName: string, stack: string[]) => void): void {
        let stack;
        const exceptionMessage = Errors.getErrorMessage(exception);

        let eventName = Strings.joinArray([message, exceptionMessage], " : ");
        if (!eventName) {
            eventName = "Unknown exception";
        }

        // While trying to get our error tracking under control, let's not filter our stacks
        function filterStack(stack: StackFrame[]) {
            return stack.filter(function (item: StackFrame) {
                if (!item.fileName) return true;
                if (item.fileName.indexOf("stacktrace") !== -1) return false; // remove stacktrace.js frames
                //if (item.functionName === "ShowError") return false;
                //if (item.functionName === "showError") return false;
                //if (item.functionName === "Errors.log") return false; // Logs with Errors.log in them usually have location where it was called from - keep those
                //if (item.functionName === "GetStack") return false;
                if (item.functionName === "Errors.parse") return false; // Only ever called from Errors.log
                if (item.functionName === "Errors.isError") return false; // Not called from anywhere interesting
                if (item.functionName?.indexOf("Promise._immediateFn") !== -1) return false; // only shows in IE stacks
                return true;
            });
        }

        function callback(stackframes: StackFrame[]) {
            stack = filterStack(stackframes).map(function (sf) {
                return sf.toString();
            });
            handler(eventName, stack);
        }

        function errback(err: Error) {
            diagnostics.trackEvent({ name: "Errors.parse errback" });
            stack = [JSON.stringify(exception, null, 2), "Parsing error:", JSON.stringify(err, null, 2)];
            handler(eventName, stack);
        }

        // TODO: Move filter from callbacks into gets
        const options: StackTraceOptions = {offline: true};
        if (!Errors.isError(exception)) {
            stackTrace.get(options).then(callback).catch(errback);
        } else {
            stackTrace.fromError(exception as Error, options).then(callback).catch(errback);
        }
    }

    public static getErrorMessage(error: unknown): string {
        if (!error) return "";
        if (typeof (error) === "string") return error;
        if (typeof (error) === "number") return error.toString();
        if (typeof error === "object" && error !== null && "message" in error) return (error as Error).message;
        return JSON.stringify(error, null, 2);
    }

    public static getErrorStack(error: unknown): string {
        if (!error) return "";
        if (typeof (error) === "string") return "string thrown as error";
        if (typeof (error) === "number") return "number thrown as error";
        if (!Errors.isError(error)) return "";
        if (typeof error === "object" && error !== null && "stack" in error) return (error as Error).stack ?? "";
        return "";
    }
}
