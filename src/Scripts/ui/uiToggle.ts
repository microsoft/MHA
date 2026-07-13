import "@fluentui/web-components/button.js";
import "@fluentui/web-components/checkbox.js";
import "@fluentui/web-components/dialog.js";
import "@fluentui/web-components/radio.js";
import "@fluentui/web-components/radio-group.js";
import "../../Content/fluentCommon.css";
import "../../Content/uiToggle.css";

import { ParentFrame } from "../ParentFrame";

Office.onReady(async (info) => {
    if (info.host === Office.HostType.Outlook) {
        await ParentFrame.initUI();
    }
});