/* global */

import { PublicClientApplication } from "@azure/msal-browser-v2";

import type { AuthDialogResult } from "../authHelper";
import { defaultScopes, getMsalConfig } from "../msalConfigV2";
import { getCurrentPageUrl, sendDialogMessage } from "../util";

export async function initializeMsal() {
    try {
        const publicClientApp = new PublicClientApplication(getMsalConfig(true));

        const result = await publicClientApp.handleRedirectPromise();

        if (result) {
            publicClientApp.setActiveAccount(result.account);
            const authDialogResult: AuthDialogResult = {
                accessToken: result.accessToken,
            };
            sendDialogMessage(JSON.stringify(authDialogResult));
        }

        await publicClientApp.acquireTokenRedirect({
            scopes: defaultScopes,
            redirectUri: getCurrentPageUrl(),
            prompt: "select_account",
        });
    } catch (ex) {
        const authDialogResult: AuthDialogResult = {
            error: JSON.stringify(ex),
        };
        sendDialogMessage(JSON.stringify(authDialogResult));
        return;
    }
}

initializeMsal();
