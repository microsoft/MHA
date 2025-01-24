// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// This file provides the default MSAL configuration for the add-in project.

import { createLocalUrl } from "./util";

const clientId = "8feb0394-ed5d-431f-943a-1d4f4274c7a3";

export const getMsalConfigShared = () => {
    const msalConfig = {
        auth: {
            clientId,
            redirectUri: createLocalUrl("Pages/auth.html"),
            postLogoutRedirectUri: createLocalUrl("Pages/auth.html"),
        },
        cache: {
            cacheLocation: "localStorage",
        },
        system: {
            loggerOptions: {},
        },
    };

    return msalConfig;
};

export const defaultScopes = ["user.read", "files.read"]; //CHECK
