/* global $ */
/* global Framework7 */
/* global URI */

// 🎯 PAGE IDENTIFICATION LOGGING
console.log("🎯 SCRIPT LOADED: MobilePane.ts (MobilePane.html)");
console.log("🎯 PAGE TYPE: Mobile Platform Detector");
console.log("🎯 DESCRIPTION: Detects mobile platform and redirects to appropriate UI");

// Check mobile platform

$(document).ready(function () {
    // Temporary hack for oddball Outlook for iOS user agent
    const ios = window.navigator.userAgent.match(/(Outlook-iOS)/);
    if (ios) Framework7.prototype.device.ios = true;
    if (Framework7.prototype.device.ios) {
        // Redirect to iOS page
        const iosPaneUrl = new URI("MobilePane-ios.html").absoluteTo(window.location).toString();
        window.location.href = iosPaneUrl;
    } else if (Framework7.prototype.device.android) {
        $("#message").text("Android is not yet supported.");
    } else {
        $("#message").html("If you see this page something has gone wrong. Please open an issue at <a hRef = 'https://github.com/stephenegriffin/mha'>https://github.com/stephenegriffin/mha</a> and include the diagnostics below.");
    }

    insertData("diag", "User agent", window.navigator.userAgent);
    insertData("diag", "iOS (Framework7 check)", Framework7.prototype.device.ios);
    insertData("diag", "iOS (userAgent check)", ios);
    insertData("diag", "iPad", Framework7.prototype.device.ipad);
    insertData("diag", "iPhone", Framework7.prototype.device.iphone);
    insertData("diag", "Android", Framework7.prototype.device.android);
});

function insertData(id, headerText, valueText) {
    const pane = $("#" + id);

    const lf = $(document.createElement("br"));

    const header = $(document.createElement("span"));
    header.text(headerText + ": ");

    const value = $(document.createElement("span"));
    value.text(valueText);

    pane.append(header);
    pane.append(value);
    pane.append(lf);
}
