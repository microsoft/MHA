//Build/Manage main UI for new desktop pane

// Import CSS - Include base styles needed for both classic and new frames
import "../../Content/Office.css";
import "../../Content/App.css";
import "../../Content/DesktopPane.css";

// Import required modules
import $ from "jquery";

import { RuleStore } from "../rules/loaders/GetRules";
import { AndValidationRule } from "../rules/types/AndValidationRule";
import { ImportedStrings } from "../Strings";
import { AddRuleFlagged, FlagRuleViolations, HeaderModel, mapHeaderToURL } from "../table/Headers";

// Module-level variables
let overlay = null;
let spinner = null;
let viewModel = null;
let SimpleRuleSet: any[] = [];
let AndRuleSet: any[] = [];

$(document).ready(function () {
    try {
        viewModel = new HeaderModel();
        initializeFabric();
        updateStatus(ImportedStrings.mha_loading);
        window.addEventListener("message", eventListener, false);
        postMessageToParent("frameActive");
    }
    catch (e) {
        LogError(e, "Failed initializing frame");
        showError(e, "Failed initializing frame");
    }
});

function site() { return window.location.protocol + "//" + window.location.host; }

function postMessageToParent(eventName, data) {
    window.parent.postMessage({ eventName: eventName, data: data }, site());
}

function eventListener(event) {
    if (!event || event.origin !== site()) {
        return;
    }

    if (event.data) {
        switch (event.data.eventName) {
            case "showError":
                showError(JSON.parse(event.data.data.error), event.data.data.message);
                break;
            case "updateStatus":
                updateStatus(event.data.data);
                break;
            case "validateRules":
                if (event.data.data && Array.isArray(event.data.data.SimpleRuleSet) && Array.isArray(event.data.data.AndRuleSet)) {
                    SimpleRuleSet = event.data.data.SimpleRuleSet;
                    AndRuleSet = event.data.data.AndRuleSet;

                    if (viewModel) {
                        FlagRuleViolations(viewModel);
                        buildViews();
                    }
                }
                break;
            case "renderItem":
                this.currentHeaderSource = event.source.viewModel.currentHeaderSource;

                if (Array.isArray(event.data.data)) {
                    // Update local variables
                    SimpleRuleSet = event.data.data[1];
                    AndRuleSet = event.data.data[2];

                    // CRITICAL: Update the global RuleStore so FlagRuleViolations can access the rules
                    RuleStore.simpleRuleSet.length = 0; // Clear existing
                    RuleStore.simpleRuleSet.push(...event.data.data[1]);
                    RuleStore.andRuleSet.length = 0; // Clear existing
                    RuleStore.andRuleSet.push(...event.data.data[2]);

                    renderItem(event.data.data[0]);
                }
                else
                {
                    SimpleRuleSet = [];
                    AndRuleSet = [];
                    renderItem(event.data.data);
                }
                break;
            default:
                break;
        }
    }
}

function LogError(error, message) {
    postMessageToParent("LogError", { error: JSON.stringify(error), message: message });
}

function initializeFabric() {
    // Check if we have Fabric UI elements (new frame) or classic elements
    const overlayComponent = document.querySelector(".ms-Overlay");

    if (overlayComponent) {
        // New frame with Fabric UI
        // Override click so user can't dismiss overlay
        overlayComponent.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
        });
        overlay = new window.fabric["Overlay"](overlayComponent);
    } else {
        // Classic frame - no overlay needed
        overlay = null;
    }

    const spinnerElement = document.querySelector(".ms-Spinner");

    if (spinnerElement && window.fabric) {
        spinner = new window.fabric["Spinner"](spinnerElement);
        spinner.stop();
    } else {
        // Classic frame or no Fabric - use simple status updates
        spinner = null;
    }

    const commandBarElements = document.querySelectorAll(".ms-CommandBar");

    if (commandBarElements.length > 0 && window.fabric) {
        let i;
        for (i = 0; i < commandBarElements.length; i++) {
            new window.fabric["CommandBar"](commandBarElements[i]);
        }
    }

    const commandButtonElements = document.querySelectorAll(".ms-CommandButton");

    if (commandButtonElements.length > 0 && window.fabric) {
        let i;
        for (i = 0; i < commandButtonElements.length; i++) {
            new window.fabric["CommandButton"](commandButtonElements[i]);
        }
    }

    const buttonElement = document.querySelector("#orig-header-btn");

    if (buttonElement && window.fabric) {
        new window.fabric["Button"](buttonElement, function () {
            const btnIcon = $(this).find(".ms-Icon");
            if (btnIcon.hasClass("ms-Icon--Add")) {
                $("#original-headers").show();
                btnIcon.removeClass("ms-Icon--Add").addClass("ms-Icon--Remove");
            } else {
                $("#original-headers").hide();
                btnIcon.removeClass("ms-Icon--Remove").addClass("ms-Icon--Add");
            }
        });
    }

    // Show summary by default - this should work on both classic and new frames
    $(".header-view[data-content='summary-view']").show();

    // Wire up click events for nav buttons - only if they exist
    const navButtons = $("#nav-bar .ms-CommandButton");

    if (navButtons.length > 0) {
        navButtons.click(function () {
            // Remove active from current active
            $("#nav-bar .is-active").removeClass("is-active");
            // Add active class to clicked button
            $(this).addClass("is-active");

            // Get content marker
            const content = $(this).attr("data-content");
            // Hide sub-views
            $(".header-view").hide();
            $(".header-view[data-content='" + content + "']").show();
        });
    }
}

function renderItem(headers) {
    // Empty data
    $( ".displayedItemTitle" ).empty(); // title of item whose header is being displayed (unless it is the current email)
    $(".summary-list").empty();
    $("#original-headers code").empty();
    $(".orig-header-ui").hide();
    $(".received-list").empty();
    $(".antispam-list").empty();
    $(".other-list").empty();
    $("#error-display .ms-MessageBar-text").empty();
    $("#error-display").hide();

    $( ".ui-diagnostics-report-section" ).empty();

    // Load new itemDescription
    updateStatus(ImportedStrings.mha_loading);

    try {
        viewModel = new HeaderModel(headers);

        // Apply rules if we have them
        if (SimpleRuleSet && SimpleRuleSet.length > 0) {
            FlagRuleViolations(viewModel);
        }
    } catch (error) {
        return;
    }

    try {
        buildViews();
    } catch (error) {
        // Handle error silently
    }

    hideStatus();

    // Ensure the response div is visible in classic frame
    $("#response").removeClass("hiddenElement").show();

    // Also make sure individual table sections are visible
    $("#summary").show();
    $("#receivedHeaders").show();
    $("#forefrontAntiSpamReport").show();
    $("#antiSpamReport").show();
    $("#otherHeaders").show();
    $("#originalHeaders").show();
}

// Build the display of the data.  This builds the primary displays including:
//
//   Summary Tab
//   Received Tab
//   AntiSpam Tab
//   Other Tab
//
// RBB (Dec 18) changes: 1) re-wrote single monolith function, 2) added support for attachments,
// 3) added rule support and highlighting, 4) added Diagnostics Report,
// 5) dynamic resizing
function buildViews() {
    // If displaying header for anything other than the current email
    // then display the title of the thing we are showing the header for.
    buildDisplayedItemName ();

    // Create Summary Tab
    createSummaryTabView ();

    // Build received view
    createReceivedTabView ();

    // Build antispam view
    createAntispamTabView ();

    // Build other view tab data
    createOtherTabView ();

    // Initialize any fabric lists added
    initializeFabrics ();

    // Size the display area dynamically to account for title that may be shown
    sizeWindowCorrectly();

    // If displaying header for anything other than the current email
    // then display the title of the thing we are showing the header for.
    function buildDisplayedItemName () {
        if ( this && this.currentHeaderSource && ( this.currentHeaderSource.label != ImportedStrings.mha_thisEmail ) )
        {
            const titleDisplay = $( ".displayedItemTitle" );

            const attachmentTitle = $("<div />")
                .addClass("ms-font-l")
                .text( "Attachment - " + this.currentHeaderSource.label );

            attachmentTitle.appendTo( titleDisplay );

            $("<hr/>").appendTo(titleDisplay);
        }
    }

    function createSummaryTabView()
    {
        buildSummarySection();

        // Build the Diagnostics Report
        buildDiagnosticsReport();

        // Save original headers and show ui
        // Try both new frame and classic frame selectors
        const originalHeadersElement = $("#original-headers code");
        const classicHeadersElement = $("#originalHeaders");

        if (originalHeadersElement.length > 0) {
            originalHeadersElement.text(viewModel.originalHeaders);
        } else if (classicHeadersElement.length > 0) {
            classicHeadersElement.text(viewModel.originalHeaders);
        }

        if (viewModel.originalHeaders) {
            $(".orig-header-ui").show();
            // Also show the classic textarea
            classicHeadersElement.show();
        }

        function buildSummarySection()
        {
            let index ;

            for (index  = 0; index  < viewModel.summary.summaryRows.length; index ++) {
                addSummaryRowDisplay(viewModel.summary.summaryRows[index ]);
            }

            // Add a entry (title, messages and content) to the Summary Tab fields.
            function addSummaryRowDisplay( summaryRow )
            {
                const summaryListElement = $(".summary-list");

                // Check for classic frame table instead
                const summaryTableElement = $("#summary");

                if (summaryListElement.length > 0) {
                    // Set up a single set (defined by summary row) of fields to be displayed in the summary
                    // section of the report.
                    AddRowDisplay( summaryListElement, summaryRow.value, summaryRow.label, null, summaryRow.rulesFlagged, "summaryHighlight" );
                } else if (summaryTableElement.length > 0) {
                    // Classic frame - add to the table instead
                    const row = $("<tr>");
                    row.append($("<td>").text(summaryRow.label));
                    row.append($("<td>").text(summaryRow.value));
                    summaryTableElement.append(row);
                }
            }
        }
    }

    function createReceivedTabView()
    {
        const receivedList = $(".received-list");

        if ( viewModel.receivedHeaders.receivedRows.length > 0 )
        {
            const list = $("<ul/>")
                .addClass("ms-List")
                .appendTo(receivedList);

            let isFirst = true;

            // For each recieved header add row to display
            for ( let index = 0; index < viewModel.receivedHeaders.receivedRows.length; index++ )
            {
                if ( viewModel.receivedHeaders.receivedRows[index].from )
                {
                    addReceivedRowDisplay( isFirst, list, viewModel.receivedHeaders.receivedRows[index] );
                    isFirst = false;
                }
            }
        }

        function addReceivedRowDisplay( isFirst, list, receivedRow )
        {
            // Display recieved row

            const newListItem = $( "<li/>" )
                .addClass( "ms-ListItem" )
                .addClass( "ms-ListItem--document" )
                .appendTo( list );

            if ( isFirst )
            {
                // Display FROM
                $( "<span/>" )
                    .addClass( "ms-ListItem-primaryText" )
                    .html( makeBold( "From: " ) + receivedRow.from )
                    .appendTo( newListItem );
            }
            else
            {
                // Display Time bar (kind of like a progress bar) and duration
                const durationIndicator = createDurationIndiator( newListItem, receivedRow );

                $( "<div/>" )
                    .addClass( "ms-ProgressIndicator-itemDescription" )
                    .text( receivedRow.delay )
                    .appendTo( durationIndicator );
            }

            $( "<span/>" )
                .addClass( "ms-ListItem-secondaryText" )
                .html( makeBold( "To: " ) + receivedRow.by )
                .appendTo( newListItem );

            $( "<div/>" )
                .addClass( "ms-ListItem-selectionTarget" )
                .appendTo( newListItem );

            // Hop Details dialog - displayed when Received Hop is clicked
            createHopDetails( newListItem, receivedRow );

            function createDurationIndiator( parentItem, receivedRow )
            {
                const wrapper = $( "<div/>" )
                    .addClass( "progress-icon" )
                    .appendTo( parentItem );

                const iconbox = $( "<div/>" )
                    .addClass( "ms-font-xxl" )
                    .addClass( "down-icon" )
                    .appendTo( wrapper );

                $( "<i/>" )
                    .addClass( "ms-Icon" )
                    .addClass( "ms-Icon--Down" )
                    .appendTo( iconbox );

                const durationIndicator = $( "<div/>" )
                    .addClass( "ms-ProgressIndicator" )
                    .appendTo( wrapper );

                const bar = $( "<div/>" )
                    .addClass( "ms-ProgressIndicator-itemProgress" )
                    .appendTo( durationIndicator );

                $( "<div/>" )
                    .addClass( "ms-ProgressIndicator-progressTrack" )
                    .appendTo( bar );

                const width = 1.8 * receivedRow.percent;

                $( "<div/>" )
                    .addClass( "ms-ProgressIndicator-progressBar" )
                    .css( "width", width )
                    .appendTo( bar );

                return durationIndicator;
            }

            function createHopDetails( itemToAddHopDetailsTo, receivedRow )
            {
                const callout = $( "<div/>" )
                    .addClass( "ms-Callout is-hidden" )
                    .appendTo( itemToAddHopDetailsTo );

                const calloutMain = $( "<div/>" )
                    .addClass( "ms-Callout-main" )
                    .appendTo( callout );

                const calloutHeader = $( "<div/>" )
                    .addClass( "ms-Callout-header" )
                    .appendTo( calloutMain );

                $( "<p/>" )
                    .addClass( "ms-Callout-title" )
                    .text( "Hop Details" )
                    .appendTo( calloutHeader );

                const calloutInner = $( "<div/>" )
                    .addClass( "ms-Callout-inner" )
                    .appendTo( calloutMain );

                const calloutContent = $( "<div/>" )
                    .addClass( "ms-Callout-content" )
                    .appendTo( calloutInner );

                addCalloutEntry( "From", receivedRow.from, calloutContent );
                addCalloutEntry( "To", receivedRow.by, calloutContent );
                addCalloutEntry( "Time", receivedRow.date, calloutContent );
                addCalloutEntry( "Type", receivedRow.with, calloutContent );
                addCalloutEntry( "ID", receivedRow.id, calloutContent );
                addCalloutEntry( "For", receivedRow.for, calloutContent );
                addCalloutEntry( "Via", receivedRow.via, calloutContent );

                function addCalloutEntry( name, value, parent )
                {
                    if ( value )
                    {
                        $( "<p/>" )
                            .addClass( "ms-Callout-subText" )
                            .html( makeBold( name + ": " ) + value )
                            .appendTo( parent );
                    }
                }
            }
        }
    }

    function createAntispamTabView()
    {
        // Forefront section
        makeReportSection( "Forefront Antispam Report", viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows );

        // Microsoft Antispam Report section
        makeReportSection( "Microsoft Antispam Report", viewModel.antiSpamReport.antiSpamRows );

        function makeReportSection( sectionName, rowsArray )
        {
            if ( rowsArray.length > 0 )
            {
                const table = makeAntispamTable( sectionName );

                for ( let index = 0; index < rowsArray.length; index++ )
                {
                    addAntiSpamReportRow( table, rowsArray[index] );
                }
            }

            function makeAntispamTable( tableTitle )
            {
                const antispamList = $( ".antispam-list" );

                // Make Title
                $( "<div/>" )
                    .addClass( "ms-font-m" )
                    .text( tableTitle )
                    .appendTo( antispamList );

                // Horizontal Line
                $( "<hr/>" ).appendTo( antispamList );

                // Make Table
                const table = $( "<table/>" )
                    .addClass( "ms-Table" )
                    .addClass( "ms-Table--fixed" )
                    .addClass( "spam-report" )
                    .appendTo( antispamList );

                // Return Table Body to add entries to
                return $( "<tbody/>" ).appendTo( table );
            }

            function addAntiSpamReportRow( table, antiSpamRow )
            {
                if ( antiSpamRow.get() )
                {
                    const row = $( "<tr/>" ).appendTo( table );

                    $( "<td/>" )
                        .text( antiSpamRow.label )
                        .appendTo( row );

                    const linkVal = mapHeaderToURL( antiSpamRow.url, antiSpamRow.get() );

                    $( "<td/>" )
                        .html( linkVal )
                        .appendTo( row );

                    // Add messages to display
                    // For Antispam tab always put messages on a new line
                    if ( antiSpamRow.rulesFlagged && ( antiSpamRow.rulesFlagged.length > 0 ) )
                    {
                        for ( let ruleIndex = 0; ruleIndex < antiSpamRow.rulesFlagged.length; ruleIndex++ )
                        {
                            const rule = antiSpamRow.rulesFlagged[ruleIndex];
                            const formatClass = rule.cssEntryPrefix + "Text";

                            const headingRow = $( "<tr/>" ).appendTo( table );

                            $( "<td colspan=\"2\" />" ).addClass( formatClass ).text( "  - " + rule.errorMessage ).appendTo( headingRow );
                        };
                    }

                    const blankRow = $( "<tr/>" ).appendTo( table );
                    $( "<td colspan=\"2\" />" ).text( " " ).appendTo( blankRow );
                }
            }
        }
    }

    function createOtherTabView()
    {
        const otherList = $( ".other-list" );
        let index;

        for (index = 0; index < viewModel.otherHeaders.otherRows.length; index++) {
            addOtherRowDisplay(viewModel.otherHeaders.otherRows[index]);
        }

        // Add an entry (title, messages and content) to the Other tab fields
        function addOtherRowDisplay( otherRow )
        {
            AddRowDisplay( $( ".other-list" ), otherRow.value, otherRow.header, otherRow.url, otherRow.rulesFlagged, "otherHighlight" );
        }
    }

    function initializeFabrics()
    {
        const listElements = document.querySelectorAll(".ms-List");
        let index;

        for (index = 0; index < listElements.length; index++) {
            new window.fabric["List"](listElements[index]);
        }

        const listItemElements = document.querySelectorAll( ".ms-ListItem" );

        for (index = 0; index < listItemElements.length; index++) {
            new window.fabric["ListItem"](listItemElements[index]);
            // Init corresponding callout
            const calloutElement = listItemElements[index].querySelector(".ms-Callout");
            new window.fabric["Callout"](calloutElement, listItemElements[index], "right");
        }
    }

    // Calculate the height of the content-main region so that scrolling works regardless of the screen height or
    // there is a title( no title with main email display).
    function sizeWindowCorrectly()
    {
        const contentWrapHeight = $(".content-wrap").outerHeight();
        const headerHeight = $(".content-header").outerHeight(true);
        const titleHeight = $(".displayedItemTitle").outerHeight(true);
        const contentMainPadding = 10;
        const contentMainHeight = contentWrapHeight - (headerHeight + titleHeight + (contentMainPadding * 2));
        $(".content-main").css({ "max-height": contentMainHeight + "px" });
    }
}

//#region Build Diagnostics Report

// Build Diagnostics Report contains all functionality to build the diagnostics report section.
// It does the following:
//   Gets an array of All Sections that were created from the Header
//   Gets an array of All sections that have an error flagged
//   Gets the set of rules that triggered an error
//   For each of those rules, processes it by displaying the rule error, and the sub-sections that were used to determine the rule was to be flagged
function buildDiagnosticsReport()
{
    const allSectionsInHeader = GetAllSections();
    const allSectionsFlaggedByRules = GetSectionsWithErrors( allSectionsInHeader );
    const rulesThatTriggered = GetPrimaryRulesThatTriggered(allSectionsFlaggedByRules);
    const diagnosticsReportSection = $(".ui-diagnostics-report-section");

    if ( rulesThatTriggered.length > 0 )
    {
        rulesThatTriggered.forEach( ProcessRule );
    }
    else
    {
        DisplayNothingToReport();
    }

    // Process a single rule that was flagged
    function ProcessRule(rule)
    {
        // Display Error Message
        const fieldTitle = $( "<div />" )
            .addClass( "ms-font-l" )
            .addClass( "ms-fontWeight-semibold" )
            .addClass( "differenciateErrorMessage" )
            .text(rule.errorMessage);

        fieldTitle.appendTo(diagnosticsReportSection);
        BlankLine();

        if (rule instanceof AndValidationRule)
        {
            // Complex rule, show all the sections that caused the rule to be flagged
            rule.rulesToAndArray.forEach(ShowRule);
        }
        else
        {
            // Simple rule - show the rule that was flagged
            ShowRule(rule);
        }
    }

    // Show Rule section name, error message and section content with part of content
    // that caused rule to be flagged highlighted.
    function ShowRule(rule)
    {
        // Get section that triggered this particular rule to be flagged
        const section = SectionWhichTriggeredRule(rule, allSectionsInHeader);

        if (section) {
            // Display title line
            DisplaySectionTitle(section.header, rule);

            const headerVal = $("<div/>")
                .addClass("code-box")
                .appendTo(diagnosticsReportSection);

            const pre = $("<pre/>").appendTo(headerVal);

            // Display section contents with text causing rule to be flag highlighted
            const textNode = BuildHighlightedText(section.value, [rule], "otherHighlight");

            textNode.appendTo(pre);
            BlankLine();
        }
        else {
            DisplaySectionTitle(rule.SectionWhichTriggeredRule, rule);
        }
    };

    // Get an array of all sections without any duplicates.
    function GetAllSections()
    {
        const setOfAllSections = [viewModel.summary.summaryRows,
            viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows,
            viewModel.antiSpamReport.antiSpamRows,
            viewModel.otherHeaders.otherRows];

        const allSectionsNoDuplicates = [];

        setOfAllSections.forEach(function (set)
        {
            set.forEach(function (section)
            {
                PushUnique( allSectionsNoDuplicates, section);
            });
        });

        return allSectionsNoDuplicates;
    };

    // Get array of all sections with at least one rule flagged
    function GetSectionsWithErrors( allSections ) {

        const sectionsWithErrors = [];

        allSections.forEach( function ( section )
        {
            // IF section has at least one rule flagged
            if ( section.rulesFlagged && section.rulesFlagged.length > 0 )
            {
                const entryAlreadyInSet = FindInArray(sectionsWithErrors, section);

                // IF this section already has an error associated with it, add other errors to it.
                if ( entryAlreadyInSet )
                {
                    AddRuleFlagged( entryAlreadyInSet, section.rulesFlagged );
                }
                else
                {
                    // Add section with error to array of sections with errors
                    sectionsWithErrors.push(section);
                }
            }
        });

        return sectionsWithErrors;
    };

    // Get list of all rules that were triggered within the set of sections passed in
    // sectionsWithErrors - set of sections to look for rules triggered
    // Returns array of rules that were triggered
    function GetPrimaryRulesThatTriggered(sectionsWithErrors)
    {
        const rulesThatTriggered = [];

        sectionsWithErrors.forEach(function (section)
        {
            section.rulesFlagged.forEach(function (rule)
            {
                // Skip rules that were part of a complex rule (And Rule constituent)
                if (rule.primaryRule)
                {
                    PushUnique( rulesThatTriggered, rule );
                }
            });
        });

        return rulesThatTriggered;
    };

    // Return the section that triggered the rule
    function SectionWhichTriggeredRule(rule, allSections)
    {
        for (let sectionIndex = 0; sectionIndex < allSections.length; sectionIndex++)
        {
            const section = allSections[sectionIndex];

            if (section.header === rule.checkSection)
            {
                return section;
            }
        }

        return null;
    };

    // Display title line for section.  Includes section name and error associated with section
    function DisplaySectionTitle(header, rule)
    {
        // Section Title
        const sectionHeading = $("<div />")
            .addClass("ms-font.m")
            .addClass("ms-fontWeight-semibold")
            .html(Tab())
            .text(header);

        // For primary rules the previous line in the report says what the error is, no reason to repeat.
        // For non-primary (part of a complex rule) the rule message says what part of the error this rule
        // tests.
        if ( rule.primaryRule === false )
        {
            // Error text format class name
            const className = rule.cssEntryPrefix + "Text";

            // Error text formatted
            const warning = $( "<SPFError/>" ).addClass( className ).text( "  - " + rule.errorMessage );
            warning.appendTo( sectionHeading );
        }

        sectionHeading.appendTo(diagnosticsReportSection);
    };

    // Display section value or Contents with highlighting of rule that was violated
    function DisplaySectionValue(sectionText, rule)
    {
        const textDisplayBox = $("<div/>")
            .addClass("code-box")
            .appendTo(diagnosticsReportSection);

        const pre = $("<pre/>").appendTo(textDisplayBox);

        const textNode = BuildHighlightedText(sectionText, [rule], "otherHighlight");

        textNode.appendTo(pre);
    };

    function DisplayNothingToReport()
    {
        // Display 'Nothing to Display' Message
        const nothingMessage = $( "<div />" )
            .addClass( "ms-font-l" )
            .addClass( "ms-fontWeight-semibold" )
            .text( ImportedStrings.mha_nothingToDisplay );

        nothingMessage.appendTo( diagnosticsReportSection );
    }

    // Return True if array contains value
    function ArrayContains (array, value) {
        for (let index = 0; index < array.length; index++) {
            const entry = array[index];

            if (entry === value) {
                return true;
            };
        };
        return false;
    };

    // Find entry in array that contains header field with same name as Value.header
    function FindInArray(array, value) {
        for (let index = 0; index < array.length; index++) {
            const entry = array[index];

            if (entry.header === value.header) {
                return entry;
            };
        };
        return null;
    };

    // Push the new entry onto the array if entry does not already exist on the array
    function PushUnique(array, newEntry) {

        if (!ArrayContains(array, newEntry)) {
            array.push(newEntry);
        }
    }

    // Return string for displaying a tab
    function Tab()
    {
        return "&nbsp;&nbsp;&nbsp;";
    }

    // Put a blank line on the error display
    function BlankLine()
    {
        $("<br/>").appendTo(diagnosticsReportSection);
    };
}

//#endregion

// Add one 'row' of data to the display.  A row is the title field, messages from rules and the content
// of the field with text associated with the rule(s) highlighted.
// documentListElement - what to append the row to
// fieldValue - content of the field
// fieldLabel - Title of the field
// labelURL - URL to associate with the title
// errors - rules that were flagged for the field
// errorTextHighlight - class to use when 'highlighting' the text in the content field
function AddRowDisplay( documentListElement, fieldValue, fieldLabel, labelURL, errors, errorTextHighlight )
{
    // Set up a single set (defined by summary row) of fields to be displayed in the summary
    // section of the report.

    // IF field has data
    if ( fieldValue )
    {
        // Create Title of Field
        CreateSectionTitle( documentListElement, fieldLabel, labelURL, errors );

        // Create Value (content) Display

        CreateSectionContents( documentListElement, fieldValue, errors, errorTextHighlight );
    }

    function CreateSectionTitle ( documentListElement, fieldLabel, labelURL, errors )
    {
        const fieldTitle = $("<div />")
            .addClass("ms-font-s")
            .addClass("ms-fontWeight-semibold")
            .text( fieldLabel );

        // Associate URL if any
        if (labelURL) {
            fieldTitle.html(labelURL);
        }

        // Add Error Text
        if ( errors && ( errors.length > 0 ) )
        {
            if (errors.length == 1) {
                // One message, append to end of line that has title
                var rule = errors[0];
                var className = rule.cssEntryPrefix + "Text";

                var warning = $("<SPFError/>").addClass(className).text("  - " + rule.errorMessage);
                warning.appendTo(fieldTitle);
            }
            else {
                // More than one message for the field, put on subsequent lines after the title
                for ( let ruleIndex = 0; ruleIndex < errors.length; ruleIndex++ )
                {
                    var rule = errors[ruleIndex];
                    var className = rule.cssEntryPrefix + "Text";

                    $( "<br/>" ).appendTo( fieldTitle );

                    var warning = $("<SPFError/>").addClass(className).text("  - " + rule.errorMessage);
                    warning.appendTo(fieldTitle);
                }
            }
        }
        fieldTitle.appendTo(documentListElement);
    }

    function CreateSectionContents ( documentListElement, fieldValue, errors, errorTextHighlight )
    {
        const displayBox = $("<div/>")
            .addClass("code-box")
            .appendTo( documentListElement );

        const pre = $( "<pre/>" ).appendTo( displayBox );

        const textNode = BuildHighlightedText(fieldValue, errors, errorTextHighlight);
        textNode.appendTo(pre);
    }
}

// Create an HTML Code segment which contains the text with the subset of the text that triggered
// a rule highlighted.
// originalText - text that is to be put into the code segment
// rules - rules that were associated with this text
// highlight - CSS class that defines how to display (differently) the text associated with the rule
// Returns: <Code>...</Code> HTML element
function BuildHighlightedText(originalText, rules, textHighlightCssClass) {

    const TextSegment = function (text, rule) {
        this.text = text;
        this.rule = rule;
    };

    // break text into unhighlighted and highlighted segments
    const listTextSegments = CreateSegments(originalText, rules);

    // create the html with highlight class associations
    const html = CreateHtml(listTextSegments, textHighlightCssClass);

    return html;

    // Break line into segments based on rule matches within the line
    // segment
    function CreateSegments(originalText, rules) {

        // One list segment with no rule associated with it
        let listTextSegments = [ new TextSegment(originalText, null) ];

        // ForEach Rule that we want to highlight
        for (let ruleIndex = 0; rules && (ruleIndex < rules.length); ruleIndex++)
        {
            var rule = rules[ruleIndex];
            var updatedTextSegmentList = [];

            var thisRulesExpression = new RegExp("(" + rule.errorPattern + ")", "g");

            listTextSegments.forEach( function ( parentSegment )
            {
                const subSegments = parentSegment.text.split(thisRulesExpression) || [parentSegment];

                subSegments.forEach( function ( word )
                {
                    const matchesPattern = word.match(rule.errorPattern);

                    if (matchesPattern && (matchesPattern.length > 0)) {
                        updatedTextSegmentList.push(new TextSegment(word, rule));
                    }
                    else {
                        updatedTextSegmentList.push(new TextSegment(word, parentSegment.rule));
                    }
                });
            });

            listTextSegments = updatedTextSegmentList;
        }

        return listTextSegments;
    }

    // Combine segments to make formatted text on screen with [possibly]
    // different colored text.
    function CreateHtml( listTextSegments, textHighlightCssClass )
    {
        const results = $("<code/>");

        // FOR Each text segment
        for ( let listIndex = 0; listIndex < listTextSegments.length; listIndex++ )
        {
            const segment = listTextSegments[listIndex];

            var segmentHtmlText;

            if ( segment.rule === null )
            {
                segmentHtmlText = $("<span/>").text(segment.text);
            }
            else
            {
                segmentHtmlText = $("<span/>").addClass(textHighlightCssClass).text(segment.text);
            }

            results.append( segmentHtmlText );
        }

        return results;
    };
}

function makeBold(text) {
    return "<span class=\"ms-fontWeight-semibold\">" + text + "</span>";
}

function updateStatus(message) {
    $(".status-message").text(message);

    // For classic frame, also update the #status element
    $("#status").text(message);

    if (spinner) {
        spinner.start();
    }

    if (overlay) {
        overlay.show();
    } else {
        // For classic frame, show the status div if it exists
        $("#status").show();
    }
}

function hideStatus() {
    if (spinner) {
        spinner.stop();
    }

    if (overlay) {
        overlay.hide();
    } else {
        // For classic frame, we might want to hide status but show content
        $("#status").hide();
        $("#response").removeClass("hiddenElement").show();
    }
}

// Handles rendering of an error.
// Does not log the error - caller is responsible for calling LogError
function showError(error, message) {
    $("#error-display .ms-MessageBar-text").text(message);
    $("#error-display").show();
}