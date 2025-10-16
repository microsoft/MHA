import { diagnostics } from "./Diag";
import { Stack } from "./stacks";
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

        Stack.parse(error, message, function (eventName: string, stack: string[]): void {
            Errors.add(eventName, stack, suppressTracking ?? false);
        });
    }

    public static logMessage(message:string): void {
        Errors.add(message, [], true);
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
