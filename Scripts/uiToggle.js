var uiChoice = function (label, url, checked) {
    this.label = label;
    this.url = url;
    this.checked = checked;
};

uiChoice.prototype.label = "";
uiChoice.prototype.url = "";
uiChoice.prototype.checked = "";

Office.initialize = function () {
    $(document).ready(function () {
        InitUI();
    });
};

function InitUI() {
    buildUiToggleMenu('uiToggleFrame', uiChoices);

    try {
        var choice = Office.context.roamingSettings.get(getSettingsKey());
        var input = $("#uiToggle" + choice.label);
        input.prop("checked", true);
        go(choice);
    }
    catch (e) {
        goDefaultChoice(uiChoices);
    }
}

function getOffice() {
    return Office;
}

function getSettingsKey() {
    try {
        return 'frame' + Office.context.mailbox.diagnostics.hostName;
    }
    catch (e) {
        return 'frame';
    }
}

function go(choice) {
    document.getElementById('uiFrame').src = choice.url;
    if (Office.context) {
        Office.context.roamingSettings.set(getSettingsKey(), choice);
        Office.context.roamingSettings.saveAsync();
    }
}

function goDefaultChoice(uiChoices) {
    for (var iChoice = 0; iChoice < uiChoices.length; iChoice++) {
        var choice = uiChoices[iChoice];
        if (choice.checked) {
            go(choice);
            return;
        }
    }
}

function buildUiToggleMenu(id, uiChoices) {
    var pane = $("#" + id);

    var headerRow = $(document.createElement("div"));
    headerRow.addClass("header-row");

    var dropDown = $(document.createElement("div"));
    dropDown.addClass("dropdown");
    headerRow.append(dropDown);

    var gear = $(document.createElement("span"));
    gear.attr("onclick", "toggleMenu()");
    gear.addClass("gearbox");
    gear.text("\u2699"); // gear icon
    dropDown.append(gear);

    var dropdownContent = $(document.createElement("div"));
    dropdownContent.addClass("dropdown-content");
    dropdownContent.attr("id", "dropdownMenu");
    dropDown.append(dropdownContent);

    for (var iChoice = 0; iChoice < uiChoices.length; iChoice++) {
        var choice = uiChoices[iChoice];
        var id = "uiToggle" + choice.label;
        var input = $(document.createElement("input"));
        input.attr("name", 'uiChoice');
        input.attr("type", 'radio');
        input.attr("id", id);
        input.attr("onclick", "go(uiChoices[" + iChoice + "]);hideMenu()");
        input.prop("checked", choice.checked);
        dropdownContent.append(input);
        var label = $(document.createElement("label"));
        label.attr("for", id);
        label.text(choice.label);
        dropdownContent.append(label);
        var br = $(document.createElement("br"));
        dropdownContent.append(br);
    }

    var frameRow = $(document.createElement("div"));
    frameRow.addClass("frame-row");

    var frame = $(document.createElement("iFrame"));
    frame.attr("id", 'uiFrame');
    frameRow.append(frame);

    pane.append(headerRow);
    pane.append(frameRow);
}

function toggleMenu() {
    $("#dropdownMenu").toggleClass("show");
}

function hideMenu() {
    $("#dropdownMenu").removeClass("show");
}