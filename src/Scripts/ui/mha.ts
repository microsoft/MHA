// Import CSS files
import "@styles/Office.css";
import "@styles/App.css";

// 🎯 PAGE IDENTIFICATION LOGGING
console.log("🎯 SCRIPT LOADED: mha.ts (mha.html)");
console.log("🎯 PAGE TYPE: Main MHA Analysis Page");
console.log("🎯 DESCRIPTION: Email header analysis and display");

// Import image assets

// Import JavaScript dependencies
import * as cptable from "codepage";
import $ from "jquery";

import loaderGif from "../../Resources/loader.gif";

// Import application modules
import { ImportedStrings } from "../Strings";
import { HeaderModel } from "../table/Headers";
import { initializeTableUI, makeResizablePane, onResize, rebuildSections, rebuildTables, recalculateVisibility, setArrows } from "../table/Table";

// Make dependencies available globally (for compatibility with existing code)
declare global {
    interface Window {
        jQuery: typeof $;
        $: typeof $;
        cptable: typeof cptable;
        // Add other globals that might be needed
        HeaderModel: any;
        ImportedStrings: any;
        viewModel: any;
        initializeTableUI: () => void;
        makeResizablePane: (id: string, title: string, visibility: any) => void;
        onResize: () => void;
        rebuildTables: () => void;
        rebuildSections: () => void;
        recalculateVisibility: () => void;
        setArrows: (table: string, colName: string, sortOrder: number) => void;
        updateStatus: (status: string) => void;
        enableSpinner: () => void;
        disableSpinner: () => void;
    }
}

// Assign to window for global access
window.jQuery = window.$ = $;
window.cptable = cptable;
window.HeaderModel = HeaderModel;
window.ImportedStrings = ImportedStrings;
window.initializeTableUI = initializeTableUI;
window.onResize = onResize;
window.rebuildTables = rebuildTables;
window.rebuildSections = rebuildSections;
window.makeResizablePane = makeResizablePane;

// Define utility functions
function enableSpinner() {
    $("#response").css("background-image", `url(${loaderGif})`);
    $("#response").css("background-repeat", "no-repeat");
    $("#response").css("background-position", "center");
}

function disableSpinner() {
    $("#response").css("background", "none");
}

function updateStatus(statusText) {
    $("#status").text(statusText);
    if (viewModel !== null) {
        viewModel.status = statusText;
    }

    recalculateVisibility();
}

// Make utility functions globally available
window.updateStatus = updateStatus;
window.enableSpinner = enableSpinner;
window.disableSpinner = disableSpinner;

let viewModel = null;

// Initialize when DOM is ready (jQuery is now imported directly)
$(document).ready(function () {
    $(window).resize(onResize);
    viewModel = new HeaderModel(null);
    window.viewModel = viewModel; // Make viewModel globally accessible
    initializeTableUI();
    makeResizablePane("inputHeaders", ImportedStrings.mha_prompt, null);
});

// Do our best at recognizing RFC 2822 headers:
// http://tools.ietf.org/html/rfc2822
export function analyzeHeaders() {
    viewModel = new HeaderModel($("#inputHeaders").val());
    window.viewModel = viewModel; // Update global reference
    setArrows(viewModel.receivedHeaders.tableName, "hop", 1);
    setArrows(viewModel.otherHeaders.tableName, "number", 1);

    enableSpinner();
    updateStatus(ImportedStrings.mha_loading);

    rebuildTables();

    disableSpinner();
}

export function clearHeaders() {
    $("#inputHeaders").val("");

    viewModel = new HeaderModel(null);
    window.viewModel = viewModel; // Update global reference
    setArrows(viewModel.receivedHeaders.tableName, "hop", 1);
    setArrows(viewModel.otherHeaders.tableName, "number", 1);
    recalculateVisibility();
}

// Ensure global functions are available immediately when module loads
window.analyzeHeaders = analyzeHeaders;
window.clearHeaders = clearHeaders;

// Also ensure they're available when DOM is ready
document.addEventListener("DOMContentLoaded", function() {
    window.analyzeHeaders = analyzeHeaders;
    window.clearHeaders = clearHeaders;

    console.log("✅ Global functions assigned on DOMContentLoaded:", {
        analyzeHeaders: typeof window.analyzeHeaders,
        clearHeaders: typeof window.clearHeaders
    });
});

// Ensure global functions are available immediately
(function() {
    // Runtime validation (development only)
    if (typeof window !== "undefined") {
        if (typeof window.analyzeHeaders !== "function") {
            console.error("analyzeHeaders is not available globally - HTML onclick handlers will fail");
        }
        if (typeof window.clearHeaders !== "function") {
            console.error("clearHeaders is not available globally - HTML onclick handlers will fail");
        } else {
            console.log("✅ Global functions successfully assigned:", {
                analyzeHeaders: typeof window.analyzeHeaders,
                clearHeaders: typeof window.clearHeaders
            });
        }
    }
})();
