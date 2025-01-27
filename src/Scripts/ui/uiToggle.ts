import "office-ui-fabric-js/dist/css/fabric.min.css";
import "office-ui-fabric-js/dist/css/fabric.components.min.css";
import "../../Content/fabric.css";
import "../../Content/uiToggle.css";

import { ParentFrame } from "../ParentFrame";

/* global Office */

Office.onReady(async (info) => {
    if (info.host === Office.HostType.Outlook) {
        await ParentFrame.initUI();
    }
});