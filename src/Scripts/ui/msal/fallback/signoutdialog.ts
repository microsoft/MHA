// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// This file handles the sign out dialog for MSAL V3.

import { createStandardPublicClientApplication } from "@azure/msal-browser";

import { getMsalConfig } from "../msalConfigV3";
import { getCurrentPageUrl, sendDialogMessage, shouldCloseDialog } from "../util";

export async function initializeMsal() {
    if (shouldCloseDialog()) {
        sendDialogMessage(JSON.stringify({ status: "success" }));
        return;
    }

    try {
        const publicClientApp = await createStandardPublicClientApplication(getMsalConfig(true));
        publicClientApp.logoutRedirect({ postLogoutRedirectUri: getCurrentPageUrl({ close: "1" }) });
    } catch (ex) {
        sendDialogMessage(JSON.stringify({ error: ex }));
    }
}
initializeMsal();
