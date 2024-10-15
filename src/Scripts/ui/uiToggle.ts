import "office-ui-fabric-js/dist/css/fabric.min.css";
import "office-ui-fabric-js/dist/css/fabric.components.min.css";
import "../../Content/fabric.css";
import "../../Content/uiToggle.css";
import $ from "jquery";

import { ParentFrame } from "../ParentFrame";

// Controller for Settings screen which controls what is being displayed
// and which UI to use.
if (typeof (Office) !== "undefined") {
    Office.initialize = function () {
        $(function() {
            ParentFrame.initUI();
        });
    };
}
