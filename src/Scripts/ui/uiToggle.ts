import "office-ui-fabric-js/dist/css/fabric.min.css";
import "office-ui-fabric-js/dist/css/fabric.components.min.css";
import "../../Content/fabric.css";
import "../../Content/uiToggle.css";

import { diagnostics } from "../Diag";
import { ParentFrame } from "../ParentFrame";
import { getAccessToken, initializeAuthMethod } from "./msal/authHelper";
import { makeGraphRequest } from "./msal/msgraph-helper";

/* global Office */

Office.onReady(async (info) => {
    if (info.host === Office.HostType.Outlook) {
        await initializeAuthMethod();
        await getUserData();
    }
});

/**
 * Gets the user data such as name and email and displays it
 * in the diagnostics pane.
 */
async function getUserData() {
    try {
        // Specify minimum scopes for the token needed.

        const accessToken = await getAccessToken(["user.read"]);
        const response = await makeGraphRequest(accessToken, "/me", "") as { displayName: string; mail: string };

        diagnostics.set("displayName", response.displayName);
        diagnostics.set("mail", response.mail);
    } catch (ex) {
        diagnostics.set("error", JSON.stringify(ex));
    }

    await ParentFrame.initUI();
}