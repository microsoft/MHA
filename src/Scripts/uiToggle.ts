import "office-ui-fabric-js/dist/css/fabric.min.css"
import "office-ui-fabric-js/dist/css/fabric.components.min.css"
import "../Content/uiToggle.css";
import * as $ from "jquery";
/* global Office */
import { ParentFrame } from "./parentFrame";

// Controller for Settings screen which controls what is being displayed
// and which UI to use.
if (typeof (Office) !== "undefined") {
    Office.initialize = function () {
        $(document).ready(function () {
            ParentFrame.initUI();
        });
    };
}