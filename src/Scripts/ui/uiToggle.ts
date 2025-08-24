import {
    fluentButton,
    fluentCheckbox,
    fluentDialog,
    fluentRadio,
    fluentRadioGroup,
    fluentToolbar,
    provideFluentDesignSystem
} from "@fluentui/web-components";
import "../../Content/uiToggle.css";

import { ParentFrame } from "../ParentFrame";

// Register Fluent UI Web Components
provideFluentDesignSystem().register(
    fluentButton(),
    fluentCheckbox(),
    fluentDialog(),
    fluentRadio(),
    fluentRadioGroup(),
    fluentToolbar()
);

/* global Office */

Office.onReady(async (info) => {
    if (info.host === Office.HostType.Outlook) {
        await ParentFrame.initUI();
    }
});