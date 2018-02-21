var currentChoice;
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
    currentChoice = choice;
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

function Create(parentElement, newType, newClass) {
    var newElement = $(document.createElement(newType));
    if (newClass) {
        newElement.addClass(newClass);
    }

    if (parentElement) {
        parentElement.append(newElement);
    }

    return newElement;
}

function buildUiToggleMenu(id, uiChoices) {
    var pane = $("#" + id);

    //<div class="header-row">
    var headerRow = Create(pane, "div", "header-row");
    //  <div class="ms-Style-button">
    var buttonDiv = Create(headerRow, "div", "ms-Style-button");
    //    <button class="ms-Button ms-Button--hero dialog-button gear-button">
    var button = Create(buttonDiv, "button", "ms-Button ms-Button--hero dialog-button gear-button");
    //      <span class="ms-Button-label">
    var buttonSpan = Create(button, "span", "ms-Button-label");
    //        <i class="ms-Icon ms-Icon--Settings" aria-hidden="true"></i>
    var buttonIcon = Create(buttonSpan, "i", "ms-Icon ms-Icon--Settings");
    buttonIcon.attr("aria-hidden", "true");
    //      </span>
    //    </button>
    //  </div>
    //  <div class="ms-Dialog">
    var dialog = Create(headerRow, "div", "ms-Dialog");
    //    <div class="ms-Dialog-title">Styles</div>
    var dialogTitle = Create(dialog, "div", "ms-Dialog-title");
    dialogTitle.text("Styles");
    //    <div class="ms-Dialog-content">
    var dialogContent = Create(dialog, "div", "ms-Dialog-content");
    //      <p class="ms-Dialog-subText">Select UI style</p>
    var dialogSubText = Create(dialogContent, "p", "ms-Dialog-subText");
    dialogSubText.text("Select UI style");
    //      <div class="ms-ChoiceFieldGroup" id="uiChoice" role="radiogroup">
    var choiceGroup = Create(dialogContent, "div", "ms-ChoiceFieldGroup");
    choiceGroup.attr("id", "uiChoice");
    choiceGroup.attr("role", "radiogroup");
    //        <ul class="ms-ChoiceFieldGroup-list">
    var list = Create(choiceGroup, "ul", "ms-ChoiceFieldGroup-list");
    for (var iChoice = 0; iChoice < uiChoices.length; iChoice++) {
        var choice = uiChoices[iChoice];
        // <li class="ms-RadioButton">
        var listItem = Create(list, "li", "ms-RadioButton");
        //   <input tabindex="-1" type="radio" class="ms-RadioButton-input" value="classic">
        var input = Create(listItem, "input", "ms-RadioButton-input");
        input.attr("tabindex", '-1');
        input.attr("type", 'radio');
        input.attr("value", iChoice);
        //   <label role="radio" class="ms-RadioButton-field" tabindex="0" aria-checked="false" name="uiChoice">
        var label = Create(listItem, "label", "ms-RadioButton-field");
        label.attr("role", 'radio');
        label.attr("tabindex", '0');
        label.attr("name", 'uiChoice');
        label.attr("value", choice.label);
        //     <span class="ms-Label">classic</span>
        var inputSpan = Create(label, "span", "ms-Label");
        inputSpan.text(choice.label);
        //   </label>
        // </li>
    }
    //        </ul>
    //      </div>
    //    </div>
    //    <div class="ms-Dialog-actions">
    var actions = Create(dialog, "div", "ms-Dialog-actions");
    //      <button class="ms-Button ms-Dialog-action ms-Button--primary">
    var actionsButtonOK = Create(actions, "button", "ms-Button ms-Button--primary ms-Dialog-action");
    //        <span class="ms-Button-label">OK</span>
    var actionsButtonOKLabel = Create(actionsButtonOK, "span", "ms-Button-label");
    actionsButtonOKLabel.text("OK");
    //      </button>
    //    </div>
    //  <div>
    //</div>
    //<div class="frame-row">
    var frameRow = Create(pane, "div", "frame-row");
    //  <iframe id="uiFrame" src="newDesktopFrame.html"></iframe>
    var frame = Create(frameRow, "iFrame");
    frame.attr("id", 'uiFrame');
    //</div>

    initFabric();
}

function initFabric() {
    var i;
    var header = document.querySelector(".header-row");

    var dialog = header.querySelector(".ms-Dialog");
    // Wire up the dialog
    var dialogComponent = new fabric['Dialog'](dialog);

    var actionButtonElements = dialog.querySelectorAll(".ms-Dialog-action");
    // Wire up the buttons
    for (i = 0; i < actionButtonElements.length; i++) {
        new fabric['Button'](actionButtonElements[i], actionHandler);
    }

    var choiceGroup = dialog.querySelectorAll(".ms-ChoiceFieldGroup");
    new fabric['ChoiceFieldGroup'](choiceGroup[0]);

    var ChoiceFieldGroupElements = dialog.querySelectorAll(".ms-ChoiceFieldGroup");
    for (i = 0; i < ChoiceFieldGroupElements.length; i++) {
        new fabric['ChoiceFieldGroup'](ChoiceFieldGroupElements[i]);
    }

    var button = header.querySelector(".dialog-button");
    // When clicking the button, open the dialog
    button.onclick = function () {
        // Set the current choice in the UI.
        $("#uiChoice input").attr("checked", false);
        var labels = $("#uiChoice label");
        labels.removeClass("is-checked");
        labels.attr("aria-checked", "false");
        var current = $("#uiChoice label[value=" + currentChoice.label + "]");
        current.addClass("is-checked");
        current.attr("aria-checked", "true");
        var input = current.prevAll("input:first")
        input.prop("checked", "true");
        dialogComponent.open();
    };

    function actionHandler(event) {
        var iChoice = $("#uiChoice input:checked")[0].value;
        var choice = uiChoices[iChoice];
        if (choice.label !== currentChoice.label) {
            go(choice);
        }
    }
}