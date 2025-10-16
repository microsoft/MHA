import {
    fluentButton,
    fluentCheckbox,
    fluentDialog,
    fluentRadio,
    fluentRadioGroup,
    fluentToolbar,
    provideFluentDesignSystem
} from "@fluentui/web-components";

import "../../Content/fluentCommon.css";
import "../../Content/uiToggle.css";

import { ParentFrame } from "../ParentFrame";

// Declare Office global for TypeScript
declare const Office: any;

// Register Fluent UI Web Components
provideFluentDesignSystem().register(
    fluentButton(),
    fluentCheckbox(),
    fluentDialog(),
    fluentRadio(),
    fluentRadioGroup(),
    fluentToolbar()
);

// Initialize UI when Office.js is ready
// Use setTimeout to defer execution and avoid circular dependency issues
setTimeout(() => {
    try {
        if (typeof Office !== "undefined" && Office.onReady) {
            Office.onReady(async (info: any) => {
                if (info.host === Office.HostType.Outlook) {
                    await ParentFrame.initUI();
                }
            });
        } else {
            // Fallback for standalone/development mode
            console.log("Office.js not available - running in standalone mode");
            ParentFrame.initUI();
        }
    } catch (error) {
        // Fallback for standalone/development mode
        console.log("Office.js not available - running in standalone mode");
        ParentFrame.initUI();
    }
}, 0);