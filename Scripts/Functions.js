/**
 * Currently this file isn't used since we have no UI-less buttons
 * If any UI-less buttons are added, define the functions here
 * and uncomment all of the script tags in Functions.html
 */

Office.initialize = function () {
};

// Helper function to add a status message to
// the info bar.
function statusUpdate(icon, text) {
    Office.context.mailbox.item.notificationMessages.replaceAsync("status", {
        type: "informationalMessage",
        icon: icon,
        message: text,
        persistent: false
    });
}