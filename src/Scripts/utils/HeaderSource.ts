// Controller for the Source of he Header to be displayed

// Manage one Show (header source) Choice (choice on the Settings screen)
export const HeaderSourceChoice = function (label, header, checked) {
    this.label = label;
    this.header = header;
    this.checked = checked;
};

// Set the one choice set, unsetting the other choices
HeaderSourceChoice.prototype.SetChecked = function () {
    // Set all items to unchecked
    for (let sourceIndex = 0; sourceIndex < HeaderSourceChoices.length; sourceIndex++) {
        HeaderSourceChoices[sourceIndex].checked = false;
    }

    // Set this item to checked.
    this.checked = true;
};

// Set of all the Header Choices
export let HeaderSourceChoices = [];

export function SetDefaultHeaderSource(headerSourceChoiceDefault) {
    defaultHeaderSource = headerSourceChoiceDefault;
}

export let defaultHeaderSource = null;

export function ClearHeaderSources() {
    HeaderSourceChoices = [];

    if (defaultHeaderSource) {

        HeaderSourceChoices.push(defaultHeaderSource);
    }
}

// Create the list of choices to show (this Email and attachments) on screen
export function UpdateShowChoices() {
    const list = $("#showChoice-list");
    list.empty();

    for (let sourceIndex = 0; sourceIndex < HeaderSourceChoices.length; sourceIndex++) {

        const choice = HeaderSourceChoices[sourceIndex];

        //  Create <li class="ms-RadioButton">
        const listItem = Create(list, "li", "ms-RadioButton");
        //  Create <input tabindex="1" type="radio" class="ms-RadioButton-input" value="classic">
        const input = Create(listItem, "input", "ms-RadioButton-input");
        input.attr("tabindex", "-1");
        input.attr("type", "radio");
        input.attr("value", sourceIndex);
        //  Create <label role="radio" class="ms-RadioButton-field" tabindex="0" aria-checked="false" name="uiChoice">
        const label = Create(listItem, "label", "ms-RadioButton-field");
        label.attr("role", "radio");
        label.attr("tabindex", "0");
        label.attr("name", "showChoice");
        label.attr("value", choice.label);
        //   Create  <span class="ms-Label">classic</span>
        const inputSpan = Create(label, "span", "ms-Label");
        inputSpan.text(choice.label);
    }
}
