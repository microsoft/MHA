import * as $ from "jquery";
import { Framework7 } from "./framework7";
import { mhaVersion } from "./version";

// Check mobile platform

$(document).ready(function () {
    "use strict";

    function insertData(id, headerText, valueText) {
        const pane = $("#" + id);

        const lf = $(document.createElement("br"));

        const header = $(document.createElement("span"));
        header.text(headerText + ': ');

        const value = $(document.createElement("span"));
        value.text(valueText);

        pane.append(header);
        pane.append(value);
        pane.append(lf);
    }

    function insertLastModified() {
        const client = new XMLHttpRequest();
        client.open("HEAD", "../Scripts/" + mhaVersion() + "/MobilePane.min.js", true);
        client.onreadystatechange = function () {
            if (this.readyState === 2) {
                insertData('diag', 'Last update', client.getResponseHeader("Last-Modified"));
            }
        };
        client.send();
    }

    // Temporary hack for oddball Outlook for iOS user agent
    let ios = !!window.navigator.userAgent.match(/(Outlook-iOS)/);

    // iPad OS no longer includes iOS, so we detect it differently
    if (window.navigator.userAgent.match(/(Mac OS X)/)) {
        Framework7.prototype.device.iPad = true;
        ios = true;
    }

    if (ios) Framework7.prototype.device.ios = true;
    if (Framework7.prototype.device.ios || Framework7.prototype.device.android) {
        // Redirect to iOS page
        window.location.href = "MobilePane-ios.html";
    } else {
        $('#message').html("If you see this page something has gone wrong. Please open an issue at <a hRef = 'https://github.com/stephenegriffin/mha'>https://github.com/stephenegriffin/mha</a> and include the diagnostics below.");
    }

    insertData('diag', 'User agent', window.navigator.userAgent);
    insertData('diag', 'iOS (Framework7 check)', Framework7.prototype.device.ios);
    insertData('diag', 'iOS (userAgent check)', ios);
    insertData('diag', 'iPad', Framework7.prototype.device.ipad);
    insertData('diag', 'iPhone', Framework7.prototype.device.iphone);
    insertLastModified();
});