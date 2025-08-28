import { Choice } from "../Choice";
import { diagnostics } from "../Diag";
import { Errors } from "../Errors";

/**
 * Utility functions extracted from ParentFrame for better testability
 */
export class ParentFrameUtils {
    /**
     * Parses a query string parameter from the current URL
     * @param variable The parameter name to look for
     * @returns The parameter value or empty string if not found
     */
    static getQueryVariable(variable: string, search: string = window.location.search): string {
        const vars: string[] = search.substring(1).split("&");

        let found = "";
        vars.forEach((v: string) => {
            if (found === "") {
                const pair: string[] = v.split("=");
                if (pair[0] === variable) {
                    found = pair[1] ?? "";
                }
            }
        });

        return found;
    }

    /**
     * Generates a settings key based on the Office host name
     * @returns Settings key string
     */
    static getSettingsKey(): string {
        try {
            return "frame" + Office.context.mailbox.diagnostics.hostName;
        } catch {
            return "frame";
        }
    }

    /**
     * Sets the default choice based on query parameter or fallback
     * @param choices Array of available choices
     * @param defaultLabel Default choice label if no query parameter
     * @param search Query string to parse (defaults to window.location.search)
     * @returns Updated choices array with one marked as checked
     */
    static setDefaultChoice(choices: Choice[], defaultLabel = "new", search: string = window.location.search): Choice[] {
        let uiDefault: string = ParentFrameUtils.getQueryVariable("default", search);
        if (!uiDefault) {
            uiDefault = defaultLabel;
        }

        return choices.map((choice: Choice) => ({
            ...choice,
            checked: uiDefault === choice.label
        }));
    }

    /**
     * Generates diagnostics string from current diagnostic data and errors
     * @returns Formatted diagnostics string
     */
    static getDiagnosticsString(): string {
        let diagnosticsString = "";

        try {
            const diagnosticMap = diagnostics.get();
            for (const diag in diagnosticMap) {
                if (Object.prototype.hasOwnProperty.call(diagnosticMap, diag)) {
                    diagnosticsString += diag + " = " + diagnosticMap[diag] + "\n";
                }
            }
        } catch {
            diagnosticsString += "ERROR: Failed to get diagnostics\n";
        }

        const errors: string[] = Errors.get();
        errors.forEach((error: string) => {
            diagnosticsString += "ERROR: " + error + "\n";
        });

        return diagnosticsString;
    }

    /**
     * Validates a choice object
     * @param choice The choice to validate
     * @returns True if the choice is valid
     */
    static isValidChoice(choice: unknown): choice is Choice {
        return choice !== null &&
               choice !== undefined &&
               typeof choice === "object" &&
               typeof (choice as Choice).label === "string" &&
               typeof (choice as Choice).url === "string" &&
               typeof (choice as Choice).checked === "boolean";
    }
}
