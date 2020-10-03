import "Office";
import * as $ from "jquery";
import { ParentFrame } from './uiToggle'

Office.initialize = function () {
    $(document).ready(function () {
        ParentFrame.initUI();
    });
};
