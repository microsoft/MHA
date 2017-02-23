// Check mobile platform

$(document).ready(function () {
    if (Framework7.prototype.device.ios) {
        // Redirect to iOS page
        var iosPaneUrl = new URI('MobilePane-ios.html').absoluteTo(window.location).toString();
        window.location.href = iosPaneUrl;
    } else if (Framework7.prototype.device.android) {
        $('#message').text('Android is not yet supported.');
    } else {
        $('#message').text('YOU SHOULD NOT BE HERE');
    }
});