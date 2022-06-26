import { Diagnostics } from "./diag";
import * as StackTrace from "stacktrace-js";

class _Errors {
    private errorArray = [];
    public clear(): void { this.errorArray = []; }

    public get() { return this.errorArray; }

    // Join an array with char, dropping empty/missing entries
    public joinArray(array: (string | number)[], char: string): string {
        if (!array) return null;
        return (array.filter(function (item) { return item; })).join(char);
    }

    public add(eventName, stack, suppressTracking: boolean): void {
        if (eventName || stack) {
            const stackString = this.joinArray(stack, "\n");
            this.errorArray.push(this.joinArray([eventName, stackString], "\n"));

            if (!suppressTracking) {
                Diagnostics.trackEvent(eventName,
                    {
                        Stack: stackString,
                        Source: "Errors.add"
                    });
            }
        }
    }

    public isError(error: Error | number | string): boolean {
        if (!error) return false;

        // We can't afford to throw while checking if we're processing an error
        // So just swallow any exception and fail.
        try {
            if (Object.prototype.toString.call(error) === "[object Error]") {
                if ("stack" in error) return true;
            }
        } catch (e) {
            Diagnostics.trackEvent({ name: "isError exception" });
            Diagnostics.trackEvent({ name: "isError exception with error", properties: e });
        }

        return false;
    }

    // error - an exception object
    // message - a string describing the error
    // suppressTracking - boolean indicating if we should suppress tracking
    public log(error: Error | number | string, message: string, suppressTracking?: boolean): void {
        if (error && !suppressTracking) {
            const props = {
                Message: message,
                Error: JSON.stringify(error, null, 2),
                Source: "",
                Stack: "",
            };

            if (this.isError(error) && error.exception) {
                props.Source = "Error.log Exception";
                Diagnostics.trackException(error, props);
            }
            else {
                props.Source = "Error.log Event";
                if (error.description) props["Error description"] = error.description;
                if (error.message) props["Error message"] = error.message;
                if (error.stack) props.Stack = error.stack;

                Diagnostics.trackEvent(error.description || error.message || props.Message || "Unknown error object", props);
            }
        }

        this.parse(error, message, function (eventName, stack) {
            this.add(eventName, stack, suppressTracking);
        });
    }

    // exception - an exception object
    // message - a string describing the error
    // handler - function to call with parsed error
    public parse(exception, message: string, handler): void {
        let stack;
        const exceptionMessage = this.getErrorMessage(exception);

        let eventName = this.joinArray([message, exceptionMessage], ' : ');
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
                if (item.functionName === "this.isError") return false; // Not called from anywhere interesting
                return true;
            });
        }

        function callback(stackframes: StackTrace.StackFrame[]) {
            stack = filterStack(stackframes).map(function (sf) {
                return sf.toString();
            });
            handler(eventName, stack);
        }

        function errback(err) {
            Diagnostics.trackEvent({ name: "Errors.parse errback" });
            stack = [JSON.stringify(exception, null, 2), "Parsing error:", JSON.stringify(err, null, 2)];
            handler(eventName, stack);
        }

        // TODO: Move filter from callbacks into gets
        if (!this.isError(exception)) {
            StackTrace.get().then(callback).catch(errback);
        } else {
            StackTrace.fromError(exception).then(callback).catch(errback);
        }
    }

    public getErrorMessage(error: Error | number | string): string {
        if (!error) return '';
        if (typeof (error) === "string") return error;
        if (typeof (error) === "number") return error.toString();
        if ("message" in error) return error.message;
        return JSON.stringify(error, null, 2);
    }

    public getErrorStack(error: Error | number | string): string {
        if (!error) return '';
        if (typeof (error) === "string") return "string thrown as error";
        if (typeof (error) === "number") return "number thrown as error";
        if (!this.isError(error)) return '';
        if ("stack" in error) return error.stack;
        return '';
    }
}

export let Errors: _Errors = new _Errors();