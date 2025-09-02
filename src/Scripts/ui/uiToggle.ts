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

import { diagnostics } from "../Diag";
import { ParentFrame } from "../ParentFrame";
import { getAccessToken, initializeAuthMethod } from "./msal/authHelper";
import { makeGraphRequest } from "./msal/msgraph-helper";

// Register Fluent UI Web Components
provideFluentDesignSystem().register(
    fluentButton(),
    fluentCheckbox(),
    fluentDialog(),
    fluentRadio(),
    fluentRadioGroup(),
    fluentToolbar()
);

/* global Office */

Office.onReady(async (info) => {
    if (info.host === Office.HostType.Outlook) {
        await initializeAuthMethod();
        await testGetUserData();
        await ParentFrame.initUI();
    }
});

/**
 * Gets the user data such as name and email and displays it
 * in the diagnostics pane.
 */
async function testGetUserData() {
    try {
        // Specify minimum scopes for the token needed.

        const accessToken = await getAccessToken(["user.read"]);
        const response = await makeGraphRequest(accessToken, "/me", "") as { displayName: string; mail: string };

        diagnostics.set("displayName", response.displayName);
        diagnostics.set("mail", response.mail);
    } catch (ex) {
        diagnostics.set("error", JSON.stringify(ex));
    }
}