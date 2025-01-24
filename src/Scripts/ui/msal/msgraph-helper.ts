// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// This file provides the provides functionality to get Microsoft Graph data.

import "unfetch/polyfill";

/* global console fetch */

/**
 *  Calls a Microsoft Graph API and returns the response.
 *
 * @param accessToken The access token to use for the request.
 * @param path Path component of the URI, e.g., "/me". Should start with "/".
 * @param queryParams Query parameters, e.g., "?$select=name,id". Should start with "?".
 * @returns
 */
export function makeGraphRequest(accessToken: string, path: string, queryParams: string): Promise<unknown> {
    return new Promise(function (myResolve, myReject) {
        fetch(`https://graph.microsoft.com/v1.0${path}${queryParams}`, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: { Authorization: accessToken },
        }).then((response) => {
            if (response.ok) {
                console.log("response ok");
                response.json().then((data) => {
                    console.log("data ok");
                    console.log(data.value);
                    myResolve(data);
                });
            } else {
                myReject(response.statusText);
            }
        });
    });
}
