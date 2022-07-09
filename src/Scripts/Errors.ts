import { Diagnostics } from "./diag";
import { strings } from "./Strings";
import * as StackTrace from "stacktrace-js";

let errorArray: string[] = [];

export class Errors {
    public static clear(): void { errorArray = []; }

    public static get() { return errorArray; }

    public static add(eventName: any, stack: any, suppressTracking: boolean): void {
        if (eventName || stack) {
            const stackString = strings.joinArray(stack, "\n");
            errorArray.push(strings.joinArray([eventName, stackString], "\n"));

            if (!suppressTracking) {
                Diagnostics.trackEvent(eventName,
                    {
                        Stack: stackString,
                        Source: "Errors.add"
                    });
            }
        }
    }

    public static isError(error: any): boolean {
        if (!error) return false;

        // We can't afford to throw while checking if we're processing an error
        // So just swallow any exception and fail.
        try {
            if (typeof (error) === "string") return false;
            if (typeof (error) === "number") return false;
            if (Object.prototype.toString.call(error) === "[object Error]") {
                if ("stack" in error) return true;
            }
        } catch (e) {
            Diagnostics.trackEvent({ name: "isError exception with error", properties: { error: JSON.stringify(e) } });
        }

        return false;
    }

    // error - an exception object
    // message - a string describing the error
    // suppressTracking - boolean indicating if we should suppress tracking
    public static log(error: any, message: string, suppressTracking?: boolean): void {
        if (error && !suppressTracking) {
            const props = {
                Message: message,
                Error: JSON.stringify(error, null, 2),
                Source: "",
                Stack: "",
                Description: "",
                Error_message: ""
            };

            if (Errors.isError(error) && error.exception) {
                props.Source = "Error.log Exception";
                Diagnostics.trackException(error, props);
            }
            else {
                props.Source = "Error.log Event";
                if (error.description) props.Description = error.description;
                if (error.message) props.Error_message = error.message;
                if (error.stack) props.Stack = error.stack;

                Diagnostics.trackEvent(error.description || error.message || props.Message || "Unknown error object", props);
            }
        }

        Errors.parse(error, message, function (eventName: string, stack: string[]): void {
            Errors.add(eventName, stack, suppressTracking ?? false);
        });
    }

    // exception - an exception object
    // message - a string describing the error
    // handler - function to call with parsed error
    public static parse(exception: any, message: string | null, handler: (eventName: string, stack: string[]) => void): void {
        let stack;
        const exceptionMessage = Errors.getErrorMessage(exception);

        let eventName = strings.joinArray([message, exceptionMessage], ' : ');
        if (!eventName) {
            eventName = "Unknown exception";
        }

        // While trying to get our error tracking under control, let's not filter our stacks
        function filterStack(stack: StackTrace.StackFrame[]) {
            return stack.filter(function (item: StackTrace.StackFrame) {
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

        function callback(stackframes: StackTrace.StackFrame[]) {
            stack = filterStack(stackframes).map(function (sf) {
                return sf.toString();
            });
            handler(eventName, stack);
        }

        function errback(err: Error) {
            Diagnostics.trackEvent({ name: "Errors.parse errback" });
            stack = [JSON.stringify(exception, null, 2), "Parsing error:", JSON.stringify(err, null, 2)];
            handler(eventName, stack);
        }

        // TODO: Move filter from callbacks into gets
        if (!Errors.isError(exception)) {
            StackTrace.get().then(callback).catch(errback);
        } else {
            StackTrace.fromError(exception).then(callback).catch(errback);
        }
    }

    public static getErrorMessage(error: any): string {
        if (!error) return '';
        if (typeof (error) === "string") return error;
        if (typeof (error) === "number") return error.toString();
        if ("message" in error) return error.message;
        return JSON.stringify(error, null, 2);
    }

    public static getErrorStack(error: any): string {
        if (!error) return '';
        if (typeof (error) === "string") return "string thrown as error";
        if (typeof (error) === "number") return "number thrown as error";
        if (!Errors.isError(error)) return '';
        if ("stack" in error) return error.stack ?? '';
        return '';
    }
}