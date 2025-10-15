/* global $ */
/* global Framework7 */
/* global HeaderModel */
/* global ImportedStrings */
/* global mapHeaderToURL */
/* global moment */
/* global SimpleValidationRule */

// 🎯 PAGE IDENTIFICATION LOGGING
console.log("🎯 SCRIPT LOADED: MobilePane-ios.ts (MobilePane-ios.html, newMobilePaneIosFrame.html)");
console.log("🎯 PAGE TYPE: iOS Mobile Frame Handler");
console.log("🎯 DESCRIPTION: Mobile UI for iOS devices - email header analysis");

import { AddRuleFlagged, FlagRuleViolations } from "../table/Headers";

// Framework7 app object
let myApp = null;
let viewModel = null;
let SimpleRuleSet = [];
let AndRuleSet = [];

$(document).ready(function () {
    console.log("🔍 MobilePane: Document ready, initializing mobile pane");
    try {
        console.log("🔍 MobilePane: Starting initialization");
        initializeFramework7();
        viewModel = new HeaderModel();
        updateStatus(ImportedStrings.mha_loading);
        window.addEventListener("message", eventListener, false);
        console.log("🔍 MobilePane: Sending frameActive message to parent");
        postMessageToParent("frameActive", {});
        console.log("🔍 MobilePane: Initialization complete");
    }
    catch (e) {
        console.log("🔍 MobilePane: Error during initialization:", e);
        LogError(e, "Failed initializing frame");
        showError(e, "Failed initializing frame");
    }
});

function site() { return window.location.protocol + "//" + window.location.host; }

function postMessageToParent(eventName, data) {
    console.log("🔍 MobilePane postMessageToParent: Sending message to parent:", eventName);
    console.log("🔍 MobilePane postMessageToParent: data:", data);
    console.log("🔍 MobilePane postMessageToParent: window.parent exists:", !!window.parent);
    console.log("🔍 MobilePane postMessageToParent: site():", site());

    try {
        window.parent.postMessage({ eventName: eventName, data: data }, site());
        console.log("🔍 MobilePane postMessageToParent: ✅ Message sent successfully");
    } catch (e) {
        console.log("🔍 MobilePane postMessageToParent: ❌ Error sending message:", e);
    }
}

function eventListener(event) {
    console.log("🔍 eventListener: RAW EVENT RECEIVED");
    console.log("🔍 eventListener: event exists:", !!event);
    console.log("🔍 eventListener: event.origin:", event?.origin);
    console.log("🔍 eventListener: site():", site());
    console.log("🔍 eventListener: origins match:", event?.origin === site());
    console.log("🔍 eventListener: event.data:", event?.data);

    try {
        console.log("🔍 eventListener: Received event:", event.data?.eventName);

        if (!event || event.origin !== site()) {
            console.log("🔍 eventListener: Origin mismatch, returning");
            console.log("🔍 eventListener: Expected origin:", site());
            console.log("🔍 eventListener: Actual origin:", event?.origin);
            return;
        }

        if (event.data) {
            console.log("🔍 eventListener: Processing event:", event.data.eventName);

            switch (event.data.eventName) {
                case "showError":
                    showError(JSON.parse(event.data.data.error), event.data.data.message);
                    break;
                case "updateStatus":
                    updateStatus(event.data.data);
                    break;
                case "renderItem":
                    console.log("🔍 eventListener renderItem: Received renderItem event");
                    postMessageToParent("debugStatus", { message: "📱 Mobile pane received renderItem" });

                    console.log("🔍 eventListener renderItem: event.data:", event.data);
                    console.log("🔍 eventListener renderItem: event.data.data:", event.data.data);
                    console.log("🔍 eventListener renderItem: event.data.data isArray:", Array.isArray(event.data.data));
                    console.log("🔍 eventListener renderItem: event.data.data type:", typeof event.data.data);

                    // Report status back to parent for debugging
                    postMessageToParent("debugStatus", { message: "📱 Mobile pane received renderItem" });

                    this.currentHeaderSource = event.source.viewModel.currentHeaderSource;

                    if (Array.isArray(event.data.data))
                    {
                        console.log("🔍 eventListener renderItem: Data is array - extracting rules");
                        console.log("🔍 eventListener renderItem: Array length:", event.data.data.length);
                        console.log("🔍 eventListener renderItem: Array[0] (headers):", typeof event.data.data[0]);
                        console.log("🔍 eventListener renderItem: Array[1] (SimpleRuleSet):", event.data.data[1]?.length || 0, "rules");
                        console.log("🔍 eventListener renderItem: Array[2] (AndRuleSet):", event.data.data[2]?.length || 0, "rules");

                        postMessageToParent("debugStatus", {
                            message: `📱 Received rules: ${event.data.data[1]?.length || 0} SimpleRules, ${event.data.data[2]?.length || 0} AndRules`
                        });

                        SimpleRuleSet = event.data.data[1];
                        AndRuleSet = event.data.data[2];
                        renderItem(event.data.data[0]);
                    }
                    else
                    {
                        console.log("🔍 eventListener renderItem: Data is NOT array - using empty rule sets");
                        console.log("🔍 eventListener renderItem: Data content:", event.data.data);

                        postMessageToParent("debugStatus", { message: "📱 Received headers only (no rules)" });

                        SimpleRuleSet = [];
                        AndRuleSet = [];
                        renderItem(event.data.data);
                    }
                    break;
                case "validateRules":
                    console.log("🔍 eventListener validateRules: Received validateRules event");
                    console.log("🔍 eventListener validateRules: SimpleRuleSet:", event.data.data.SimpleRuleSet?.length || 0, "rules");
                    console.log("🔍 eventListener validateRules: AndRuleSet:", event.data.data.AndRuleSet?.length || 0, "rules");

                    // Update the global rule sets
                    SimpleRuleSet = event.data.data.SimpleRuleSet || [];
                    AndRuleSet = event.data.data.AndRuleSet || [];

                    // Trigger rule validation on the current viewModel if it exists
                    if (viewModel) {
                        console.log("🔍 eventListener validateRules: 🎯 Calling FlagRuleViolations on current viewModel");
                        FlagRuleViolations(viewModel);

                        // Re-render the tables to show the rule violations
                        console.log("🔍 eventListener validateRules: 🔄 Re-rendering tables with rule violations");
                        buildViews();
                    } else {
                        console.log("🔍 eventListener validateRules: ⚠️ No viewModel available for rule validation");
                    }
                    break;
            }
        }
    } catch (error) {
        console.log("🔍 eventListener: ❌ Error processing event:", error);
        try {
            postMessageToParent("debugStatus", { message: `📱 ERROR in event listener: ${error.message}` });
        } catch (e) {
            console.log("🔍 eventListener: Failed to send error status:", e);
        }
    }
}

function LogError(error, message) {
    postMessageToParent("LogError", { error: JSON.stringify(error), message: message });
}

function initializeFramework7() {
    myApp = new Framework7();

    myApp.addView("#summary-view");
    myApp.addView("#received-view");
    myApp.addView("#antispam-view");
    myApp.addView("#other-view");
}

function renderItem(headers) {
    console.log("🔍 renderItem: Starting with headers:", headers);
    console.log("🔍 renderItem: Headers type:", typeof headers);
    console.log("🔍 renderItem: Headers isArray:", Array.isArray(headers));
    console.log("🔍 renderItem: Headers keys:", headers ? Object.keys(headers) : "null");

    // Empty data
    $("#summary-content").empty();
    $("#received-content").empty();
    $("#antispam-content").empty();
    $("#other-content").empty();
    $("#original-headers").empty();

    updateStatus(ImportedStrings.mha_loading);

    console.log("🔍 renderItem: Creating HeaderModel with headers");
    viewModel = new HeaderModel(headers);
    console.log("🔍 renderItem: HeaderModel created:", viewModel);
    console.log("🔍 renderItem: viewModel structure after creation:", {
        summary: {
            exists: !!viewModel.summary,
            summaryRows: {
                exists: !!viewModel.summary?.summaryRows,
                length: viewModel.summary?.summaryRows?.length || 0
            }
        },
        forefrontAntiSpamReport: {
            exists: !!viewModel.forefrontAntiSpamReport,
            forefrontAntiSpamRows: {
                exists: !!viewModel.forefrontAntiSpamReport?.forefrontAntiSpamRows,
                length: viewModel.forefrontAntiSpamReport?.forefrontAntiSpamRows?.length || 0
            }
        },
        antiSpamReport: {
            exists: !!viewModel.antiSpamReport,
            antiSpamRows: {
                exists: !!viewModel.antiSpamReport?.antiSpamRows,
                length: viewModel.antiSpamReport?.antiSpamRows?.length || 0
            }
        },
        otherHeaders: {
            exists: !!viewModel.otherHeaders,
            otherRows: {
                exists: !!viewModel.otherHeaders?.otherRows,
                length: viewModel.otherHeaders?.otherRows?.length || 0
            }
        }
    });

    buildViews();
    hideStatus();

    // Request rule validation from parent now that mobile pane is fully rendered
    console.log("🔍 renderItem: 🎯 Requesting rule validation from parent");
    postMessageToParent("requestRuleValidation", {});
}

function buildViews() {
    // Build summary view
    const summaryContent = $("#summary-content");
    let contentBlock;
    let headerVal;
    let pre;

    makeDisplayedItemLabel ();

    for ( let i = 0; i < viewModel.summary.summaryRows.length; i++ )
    {
        addSummaryRowDisplay( viewModel.summary.summaryRows[i] );
    }

    if (viewModel.originalHeaders) {
        $("#original-headers").text(viewModel.originalHeaders);
        $("#orig-headers-ui").show();
    }

    // Build received view
    buildReceivedView();

    // Build antispam view
    buildAntiSpamView();

    // Build other view
    buildOtherView ();

    buildDiagnosticsReport();

    function makeDisplayedItemLabel()
    {
        const titleDisplay = $(".displayedItemTitle");
        titleDisplay.empty();

        // If displaying header for anything other than the current email
        // then display the title of the thing we are showing the header for.
        if ( this && this.currentHeaderSource && ( this.currentHeaderSource.label != ImportedStrings.mha_thisEmail)) {
            const attachmentTitle = $("<div />")
                .addClass("ms-font-l")
                .text("Attachment - " + this.currentHeaderSource.label);
            attachmentTitle.appendTo(titleDisplay);
        }
    }

    function buildReceivedView()
    {
        const receivedContent = $( "#received-content" );

        if ( viewModel.receivedHeaders.receivedRows.length > 0 )
        {
            const timeline = $( "<div/>" )
                .addClass( "timeline" )
                .appendTo( receivedContent );

            let currentTime = null;
            let currentTimeEntry = null;
            let timelineItem;
            let timelineDate;
            let timelineInner;

            for ( let i = 0; i < viewModel.receivedHeaders.receivedRows.length; i++ )
            {
                const receivedEntry = viewModel.receivedHeaders.receivedRows[i];

                if ( i === 0 )
                {
                    currentTime = moment( receivedEntry.dateNum ).local();

                    timelineItem = $( "<div/>" )
                        .addClass( "timeline-item" )
                        .appendTo( timeline );

                    timelineDate = currentTime.format( "h:mm" ) + "<small>" + currentTime.format( "A" ) + "</small>";

                    $( "<div/>" )
                        .addClass( "timeline-item-date" )
                        .html( timelineDate )
                        .appendTo( timelineItem );

                    $( "<div/>" )
                        .addClass( "timeline-item-divider" )
                        .appendTo( timelineItem );

                    currentTimeEntry = $( "<div/>" )
                        .addClass( "timeline-item-content" )
                        .appendTo( timelineItem );

                    // Add initial otherRows
                    timelineInner = $( "<div/>" )
                        .addClass( "timeline-item-inner" )
                        .addClass( "link" )
                        .addClass( "open-popover" )
                        .attr( "data-popover", ".popover-" + i )
                        .appendTo( currentTimeEntry );

                    $( "<div/>" )
                        .addClass( "timeline-item-time" )
                        .text( currentTime.format( "h:mm:ss" ) )
                        .appendTo( timelineInner );

                    $( "<div/>" )
                        .addClass( "timeline-item-subtitle" )
                        .html( "<strong>From: </strong>" + receivedEntry.from )
                        .appendTo( timelineInner );

                    $( "<div/>" )
                        .addClass( "timeline-item-text" )
                        .html( "<strong>To: </strong>" + receivedEntry.by )
                        .appendTo( timelineInner );
                } else
                {
                    // Determine if new timeline item is needed
                    const entryTime = moment( receivedEntry.dateNum ).local();

                    if ( entryTime.minute() > currentTime.minute() )
                    {
                        // Into a new minute, create a new timeline item
                        currentTime = entryTime;

                        timelineItem = $( "<div/>" )
                            .addClass( "timeline-item" )
                            .appendTo( timeline );

                        timelineDate = currentTime.format( "h:mm" ) + "<small>" + currentTime.format( "A" ) + "</small>";
                        $( "<div/>" )
                            .addClass( "timeline-item-date" )
                            .html( timelineDate )
                            .appendTo( timelineItem );

                        $( "<div/>" )
                            .addClass( "timeline-item-divider" )
                            .appendTo( timelineItem );

                        currentTimeEntry = $( "<div/>" )
                            .addClass( "timeline-item-content" )
                            .appendTo( timelineItem );

                    }

                    // Add additional rows
                    timelineInner = $( "<div/>" )
                        .addClass( "timeline-item-inner" )
                        .addClass( "link" )
                        .addClass( "open-popover" )
                        .attr( "data-popover", ".popover-" + i )
                        .appendTo( currentTimeEntry );

                    $( "<div/>" )
                        .addClass( "timeline-item-time" )
                        .text( entryTime.format( "h:mm:ss" ) )
                        .appendTo( timelineInner );

                    $( "<div/>" )
                        .addClass( "timeline-item-subtitle" )
                        .html( "<strong>To: </strong>" + receivedEntry.by )
                        .appendTo( timelineInner );

                    const progress = $( "<div/>" )
                        .addClass( "timeline-item-text" )
                        .appendTo( timelineInner );

                    $( "<p/>" )
                        .text( receivedEntry.delay )
                        .appendTo( progress );

                    $( "<p/>" )
                        .addClass( "progress-wrap-" + i )
                        .appendTo( progress );

                    try
                    {
                        myApp.showProgressbar( ".progress-wrap-" + i, receivedEntry.percent );
                    } catch ( e )
                    {
                        LogError(e, "Failed to show progress bar for received entry");
                        // Continue processing other entries instead of returning
                    }
                }

                // popover
                makeReceivedPopovers( receivedEntry, i );
            }

            // Add a final empty timeline item to extend
            // timeline
            const endTimelineItem = $( "<div/>" )
                .addClass( "timeline-item" )
                .appendTo( timeline );

            currentTime.add( 1, "m" );
            const endTimelineDate = currentTime.format( "h:mm" ) + "<small>" + currentTime.format( "A" ) + "</small>";
            $( "<div/>" )
                .addClass( "timeline-item-date" )
                .html( endTimelineDate )
                .appendTo( endTimelineItem );

            $( "<div/>" )
                .addClass( "timeline-item-divider" )
                .appendTo( endTimelineItem );
        }

        function makeReceivedPopovers( receivedEntry, index )
        {
            const receivedContent = $( "#received-content" );

            const popover = $("<div/>")
                .addClass("popover")
                .addClass("popover-" + index)
                .appendTo(receivedContent);
            $("<div/>")
                .addClass("popover-angle")
                .appendTo(popover);
            const popoverInner = $("<div/>")
                .addClass("popover-inner")
                .appendTo(popover);
            const popoverContent = $("<div/>")
                .addClass("content-block")
                .appendTo( popoverInner );

            addCalloutEntry( "From", receivedEntry.from, popoverContent);
            addCalloutEntry( "To", receivedEntry.by, popoverContent);
            addCalloutEntry( "Time", receivedEntry.date, popoverContent);
            addCalloutEntry( "Type", receivedEntry.with, popoverContent);
            addCalloutEntry( "ID", receivedEntry.id, popoverContent);
            addCalloutEntry( "For", receivedEntry.for, popoverContent);
            addCalloutEntry( "Via", receivedEntry.via, popoverContent);
        }
    }

    function buildAntiSpamView() {
        const antispamContent = $("#antispam-content");
        let list;
        let ul;
        // Forefront
        if (viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows.length > 0) {
            $("<div/>")
                .addClass("content-block-title")
                .text("Forefront Antispam Report")
                .appendTo(antispamContent);
            list = $("<div/>")
                .addClass("list-block")
                .addClass("accordion-list")
                .appendTo(antispamContent);
            ul = $("<ul/>")
                .appendTo(list);
            for (let i = 0; i < viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows.length; i++) {
                addSpamReportRow(viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows[i], ul);
            }
        }
        // Microsoft
        if (viewModel.antiSpamReport.antiSpamRows.length > 0) {
            $("<div/>")
                .addClass("content-block-title")
                .text("Microsoft Antispam Report")
                .appendTo(antispamContent);
            list = $("<div/>")
                .addClass("list-block")
                .addClass("accordion-list")
                .appendTo(antispamContent);
            ul = $("<ul/>")
                .appendTo(list);
            for (let i = 0; i < viewModel.antiSpamReport.antiSpamRows.length; i++) {
                addSpamReportRow(viewModel.antiSpamReport.antiSpamRows[i], ul);
            }
        }

        function addSpamReportRow( spamRow, parent )
        {
            if ( spamRow.get() )
            {
                const item = $( "<li/>" )
                    .addClass( "accordion-item" )
                    .appendTo( parent );

                const link = $( "<a/>" )
                    .addClass( "item-content" )
                    .addClass( "item-link" )
                    .attr( "href", "#" )
                    .appendTo( item );

                const innerItem = $( "<div/>" )
                    .addClass( "item-inner" )
                    .appendTo( link );

                $( "<div/>" )
                    .addClass( "item-title" )
                    .text( spamRow.label )
                    .appendTo( innerItem );

                const itemContent = $( "<div/>" )
                    .addClass( "accordion-item-content" )
                    .appendTo( item );

                const contentBlock = $( "<div/>" )
                    .addClass( "content-block" )
                    .appendTo( itemContent );

                const linkWrap = $( "<p/>" )
                    .appendTo( contentBlock );

                const linkVal = mapHeaderToURL( spamRow.url, spamRow.get() );

                $( $.parseHTML( linkVal ) )
                    .addClass( "external" )
                    .appendTo( linkWrap );
            }
        }
    }

    function buildOtherView() {
        const otherContent = $("#other-content");
        for (let i = 0; i < viewModel.otherHeaders.otherRows.length; i++) {
            addOtherRowDisplay(viewModel.otherHeaders.otherRows[i]);
        }
    }
}

//#region Build Diagnostics Report

// Build Diagnostics Report contains all functionality to build the diagnostics report section.
//
//   Gets an array of All Sections that were created from the Header
//   Gets an array of All sections that have an error flagged
//   Gets the set of rules that triggered an error
//   For each of those rules, processes it by displaying the rule error, and the sub-sections that were used to determine the rule was to be flagged
function buildDiagnosticsReport()
{
    console.log("🔍 buildDiagnosticsReport: Starting diagnostics report generation");

    const allSections = GetAllSections();                                             // All sections
    console.log("🔍 buildDiagnosticsReport: All sections count:", allSections.length);
    console.log("🔍 buildDiagnosticsReport: All sections:", allSections);

    const allSectionsFlagged = GetSectionsWithErrors();                               // All sections with items that were flagged
    console.log("🔍 buildDiagnosticsReport: Sections with errors count:", allSectionsFlagged.length);
    console.log("🔍 buildDiagnosticsReport: Sections with errors:", allSectionsFlagged);

    const rulesThatTriggered = GetPrimaryRulesThatTriggered( allSectionsFlagged );      // Set of rules that were flagged
    console.log("🔍 buildDiagnosticsReport: Rules that triggered count:", rulesThatTriggered.length);
    console.log("🔍 buildDiagnosticsReport: Rules that triggered:", rulesThatTriggered);

    const errorDisplay = $( ".ui-diagnostics-report-section" );                         // Where to display error
    console.log("🔍 buildDiagnosticsReport: Error display element found:", errorDisplay.length);

    errorDisplay.empty();

    if ( rulesThatTriggered.length > 0 )
    {
        console.log("🔍 buildDiagnosticsReport: Processing", rulesThatTriggered.length, "triggered rules");
        rulesThatTriggered.forEach( ProcessRule );
    }
    else
    {
        console.log("🔍 buildDiagnosticsReport: No rules triggered - displaying 'Nothing to Report'");
        DisplayNothingToReport();
    }

    // Process a single rule that was flagged
    function ProcessRule( rule )
    {
        // Display Error Message
        const fieldTitle = $( "<div />" )
            .addClass( "ms-font-l" )
            .addClass( "ms-fontWeight-semibold" )
            .addClass( "differenciateErrorMessage" )
            .text( rule.errorMessage );

        fieldTitle.appendTo( errorDisplay );
        BlankLine();

        if ( rule instanceof SimpleValidationRule )
        {
            // Simple rule - show the rule that was flagged
            ShowRule( rule );
        }
        else
        {
            // Complex rule, show all the sections that caused the rule to be flagged
            rule.rulesToAndArray.forEach( ShowRule );
        }
    }

    // Show Rule section name, error message and section content with part of content
    // that caused rule to be flagged highlighted.
    function ShowRule( rule )
    {
        // Get section that triggered this particular rule to be flagged
        const section = SectionWhichTriggeredRule( rule, allSections );

        if ( section )
        {
            // Display title line
            DisplaySectionTitle( section, rule );

            headerVal = $( "<div/>" )
                .addClass( "code-box" )
                .appendTo( errorDisplay );

            pre = $( "<pre/>" ).appendTo( headerVal );

            // Display section contents with text causing rule to be flag highlighted
            const textNode = BuildHighlightedText( section.value, [rule], "otherHighlight" );

            textNode.appendTo( pre );
            BlankLine();
        }
    };

    // Get an array of all sections without any duplicates.
    function GetAllSections()
    {
        console.log("🔍 GetAllSections: Starting to collect all sections");
        console.log("🔍 GetAllSections: viewModel:", viewModel);
        console.log("🔍 GetAllSections: viewModel structure:", {
            summary: {
                exists: !!viewModel.summary,
                summaryRows: {
                    exists: !!viewModel.summary?.summaryRows,
                    length: viewModel.summary?.summaryRows?.length || 0,
                    isArray: Array.isArray(viewModel.summary?.summaryRows)
                }
            },
            forefrontAntiSpamReport: {
                exists: !!viewModel.forefrontAntiSpamReport,
                forefrontAntiSpamRows: {
                    exists: !!viewModel.forefrontAntiSpamReport?.forefrontAntiSpamRows,
                    length: viewModel.forefrontAntiSpamReport?.forefrontAntiSpamRows?.length || 0,
                    isArray: Array.isArray(viewModel.forefrontAntiSpamReport?.forefrontAntiSpamRows)
                }
            },
            antiSpamReport: {
                exists: !!viewModel.antiSpamReport,
                antiSpamRows: {
                    exists: !!viewModel.antiSpamReport?.antiSpamRows,
                    length: viewModel.antiSpamReport?.antiSpamRows?.length || 0,
                    isArray: Array.isArray(viewModel.antiSpamReport?.antiSpamRows)
                }
            },
            otherHeaders: {
                exists: !!viewModel.otherHeaders,
                otherRows: {
                    exists: !!viewModel.otherHeaders?.otherRows,
                    length: viewModel.otherHeaders?.otherRows?.length || 0,
                    isArray: Array.isArray(viewModel.otherHeaders?.otherRows)
                }
            }
        });

        const setOfAllSections = [viewModel.summary.summaryRows,
            viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows,
            viewModel.antiSpamReport.antiSpamRows,
            viewModel.otherHeaders.otherRows];

        console.log("🔍 GetAllSections: Summary rows:", viewModel.summary.summaryRows?.length || 0);
        console.log("🔍 GetAllSections: Forefront rows:", viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows?.length || 0);
        console.log("🔍 GetAllSections: AntiSpam rows:", viewModel.antiSpamReport.antiSpamRows?.length || 0);
        console.log("🔍 GetAllSections: Other rows:", viewModel.otherHeaders.otherRows?.length || 0);

        const allSectionsNoDuplicates = [];

        setOfAllSections.forEach( function ( set, setIndex )
        {
            console.log(`🔍 GetAllSections: Processing set ${setIndex} with`, set?.length || 0, "items");
            if (set && Array.isArray(set)) {
                set.forEach( function ( section, sectionIndex )
                {
                    console.log(`🔍 GetAllSections: Set ${setIndex} Section ${sectionIndex}:`, {
                        header: section?.header,
                        value: section?.value?.substring(0, 100) + (section?.value?.length > 100 ? "..." : ""),
                        rulesFlagged: {
                            exists: !!section?.rulesFlagged,
                            length: section?.rulesFlagged?.length || 0,
                            isArray: Array.isArray(section?.rulesFlagged)
                        }
                    });
                    PushUnique( allSectionsNoDuplicates, section );
                } );
            } else {
                console.log(`🔍 GetAllSections: Set ${setIndex} is null, undefined, or not an array:`, set);
            }
        } );

        console.log("🔍 GetAllSections: Total unique sections:", allSectionsNoDuplicates.length);
        allSectionsNoDuplicates.forEach((section, index) => {
            console.log(`🔍 GetAllSections: Final section ${index}:`, {
                header: section?.header,
                rulesFlagged: section?.rulesFlagged?.length || 0
            });
        });
        return allSectionsNoDuplicates;
    };    // Get array of all sections with at least one rule flagged
    function GetSectionsWithErrors()
    {
        console.log("🔍 GetSectionsWithErrors: Starting error section analysis");

        const sectionsWithErrors = [];
        const allSections = GetAllSections();

        console.log("🔍 GetSectionsWithErrors: Analyzing", allSections.length, "total sections");

        allSections.forEach( function ( section, index )
        {
            console.log(`🔍 GetSectionsWithErrors: Section ${index}:`, section?.header);
            console.log(`🔍 GetSectionsWithErrors: Section ${index} rulesFlagged:`, section?.rulesFlagged?.length || 0);

            if (section?.rulesFlagged) {
                section.rulesFlagged.forEach((rule, ruleIndex) => {
                    console.log(`🔍 GetSectionsWithErrors: Section ${index} rule ${ruleIndex}:`, rule?.name, "Severity:", rule?.severity);
                });
            }

            // IF section has at least one rule flagged
            if ( section.rulesFlagged && section.rulesFlagged.length > 0 )
            {
                console.log(`🔍 GetSectionsWithErrors: Section ${index} has errors - processing`);

                const entryAlreadyInSet = FindInArray( sectionsWithErrors, section );

                // IF this section already has an error associated with it, add other errors to it.
                if ( entryAlreadyInSet )
                {
                    console.log(`🔍 GetSectionsWithErrors: Section ${index} already exists, merging rules`);
                    AddRuleFlagged( entryAlreadyInSet, section.rulesFlagged );
                }
                else
                {
                    console.log(`🔍 GetSectionsWithErrors: Section ${index} is new, adding section`);
                    // Add section with error to array of sections with errors
                    sectionsWithErrors.push( section );
                }
            }
            else {
                console.log(`🔍 GetSectionsWithErrors: Section ${index} has no errors - skipping`);
            }
        } );

        console.log("🔍 GetSectionsWithErrors: Final sectionsWithErrors count:", sectionsWithErrors.length);
        sectionsWithErrors.forEach((section, index) => {
            console.log(`🔍 GetSectionsWithErrors: Final section ${index}:`, section?.header, "Rules:", section?.rulesFlagged?.length || 0);
        });

        return sectionsWithErrors;
    };

    // Get list of all rules that were triggered within the set of sections passed in
    // sectionsWithErrors - set of sections to look for rules triggered
    // Returns array of rules that were triggered
    function GetPrimaryRulesThatTriggered( sectionsWithErrors )
    {
        console.log("🔍 GetPrimaryRulesThatTriggered: Starting with", sectionsWithErrors.length, "sections");

        const rulesThatTriggered = [];

        sectionsWithErrors.forEach( function ( section, sectionIndex )
        {
            console.log(`🔍 GetPrimaryRulesThatTriggered: Section ${sectionIndex}:`, section?.header);
            console.log(`🔍 GetPrimaryRulesThatTriggered: Section ${sectionIndex} has`, section?.rulesFlagged?.length || 0, "rules flagged");

            section.rulesFlagged.forEach( function ( rule, ruleIndex )
            {
                console.log(`🔍 GetPrimaryRulesThatTriggered: Section ${sectionIndex} rule ${ruleIndex}:`, rule?.name);
                console.log(`🔍 GetPrimaryRulesThatTriggered: Section ${sectionIndex} rule ${ruleIndex} primaryRule:`, rule?.primaryRule);

                // Skip rules that were part of a complex rule (And Rule constituent)
                if ( rule.primaryRule )
                {
                    console.log(`🔍 GetPrimaryRulesThatTriggered: Section ${sectionIndex} rule ${ruleIndex} is primary rule`);

                    if ( !ArrayContains( rulesThatTriggered, rule ) )
                    {
                        console.log(`🔍 GetPrimaryRulesThatTriggered: Section ${sectionIndex} rule ${ruleIndex} not in array yet - adding`);
                        rulesThatTriggered.push( rule );
                    }
                    else {
                        console.log(`🔍 GetPrimaryRulesThatTriggered: Section ${sectionIndex} rule ${ruleIndex} already in array - skipping`);
                    }
                }
                else {
                    console.log(`🔍 GetPrimaryRulesThatTriggered: Section ${sectionIndex} rule ${ruleIndex} is NOT primary rule - skipping`);
                }
            } );
        } );

        console.log("🔍 GetPrimaryRulesThatTriggered: Final rulesThatTriggered count:", rulesThatTriggered.length);
        rulesThatTriggered.forEach((rule, index) => {
            console.log(`🔍 GetPrimaryRulesThatTriggered: Final rule ${index}:`, rule?.name, "Severity:", rule?.severity);
        });

        return rulesThatTriggered;
    };

    // Return the section that triggered the rule
    function SectionWhichTriggeredRule( rule, allSections )
    {
        for ( let sectionIndex = 0; sectionIndex < allSections.length; sectionIndex++ )
        {
            const section = allSections[sectionIndex];

            if ( section.header === rule.checkSection )
            {
                return section;
            }
        }

        return null; // SHOULD NOT HAPPEN
    };

    // Display title line for section.  Includes section name and error associated with section
    function DisplaySectionTitle( section, rule )
    {
        // Section Title
        const sectionHeading = $( "<div />" )
            .addClass( "ms-font.m" )
            .addClass( "ms-fontWeight-semibold" )
            .html( Tab() )
            .text( section.header );

        if ( rule.primaryRule === false )
        {
            // Error text format class name
            const className = rule.cssEntryPrefix + "Text";

            // Error text formatted
            const warning = $( "<SPFError/>" ).addClass( className ).text( "  - " + rule.errorMessage );
            warning.appendTo( sectionHeading );
        }

        sectionHeading.appendTo( errorDisplay );
    };

    // Display section value or Contents with highlighting of rule that was violated
    function DisplaySectionValue( value, rule )
    {
        const headerVal = $( "<div/>" )
            .addClass( "code-box" )
            .appendTo( errorDisplay );

        const pre = $( "<pre/>" ).appendTo( headerVal );

        const textNode = BuildHighlightedText( value, [rule], "otherHighlight" );

        textNode.appendTo( pre );
    };

    // Return True if array contains value
    function ArrayContains( array, value )
    {
        for ( let index = 0; index < array.length; index++ )
        {
            const entry = array[index];

            if ( entry === value )
            {
                return true;
            };
        };
        return false;
    };

    // Find entry in array that contains header field with same name as Value.header
    function FindInArray( array, value )
    {
        for ( let index = 0; index < array.length; index++ )
        {
            const entry = array[index];

            if ( entry.header === value.header )
            {
                return entry;
            };
        };
        return null;
    };

    // Push the new entry onto the array if entry does not already exist on the array
    function PushUnique( array, newEntry )
    {

        if ( !ArrayContains( array, newEntry ) )
        {
            array.push( newEntry );
        }
    }

    function DisplayNothingToReport()
    {
        // Display Error Message
        const text = $( "<div />" )
            .addClass( "ms-font-l" )
            .addClass( "ms-fontWeight-semibold" )
            .text( "Nothing to Report" );

        text.appendTo( errorDisplay ) ;
    }

    // Return string for displaying a tab
    function Tab()
    {
        return "&nbsp;&nbsp;&nbsp;";
    }

    // Put a blank line on the error display
    function BlankLine()
    {
        $( "<br/>" ).appendTo( errorDisplay );
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
        const fieldTitle = $( "<div />" )
            .addClass( "ms-font-s" )
            .addClass( "ms-fontWeight-semibold" )
            .text( fieldLabel );

        // Associate URL if any
        if ( labelURL )
        {
            fieldTitle.html( labelURL );
        }

        // Add Error Text
        if ( errors && ( errors.length > 0 ) )
        {
            for ( let ruleIndex = 0; ruleIndex < errors.length; ruleIndex++ )
            {
                const rule = errors[ruleIndex];

                const className = rule.cssEntryPrefix + "Text";

                $("<br/>").appendTo(fieldTitle);

                const warning = $( "<SPFError/>" ).addClass( className ).text( "  - " + rule.errorMessage );
                warning.appendTo( fieldTitle );
            };
        }

        fieldTitle.appendTo( documentListElement );

        // Create Value (content) Display

        headerVal = $( "<div/>" )
            .addClass( "code-box" )
            .appendTo( documentListElement );

        pre = $( "<pre/>" ).appendTo( headerVal );

        const textNode = BuildHighlightedText( fieldValue, errors, errorTextHighlight );

        textNode.appendTo( pre );
    }
}

// Create an HTML Code segment which contains the text with the subset of the text that triggered
// a rule highlighted.
// originalText - text that is to be put into the code segment
// rules - rules that were associated with this text
// highlight - CSS class that defines how to display (differently) the text associated with the rule
// Returns: <Code>...</Code> HTML element
function BuildHighlightedText( originalText, rules, textHighlight )
{
    const TextSegment = function ( text, rule )
    {
        this.text = text;
        this.rule = rule;
    };

    // break text into unhighlighted and highlighted segments
    const listTextSegments = CreateSegments( originalText, rules );

    // create the html with highlight class associations
    const html = CreateHtml( listTextSegments, textHighlight );

    return html;

    // Break line into segments based on rule matches within the line
    // segment
    function CreateSegments( originalText, rules )
    {
        // One list segment with no rule associated with it
        let listSegments = [new TextSegment( originalText, null )];

        for ( let ruleIndex = 0; rules && ( ruleIndex < rules.length ); ruleIndex++ )
        {
            var rule = rules[ruleIndex];
            var updatedList = [];

            var expression = new RegExp( "(" + rule.errorPattern + ")", "g" );

            listSegments.forEach( function ( segment )
            {
                const words = segment.text.split( expression ) || [segment];

                words.forEach( function ( word )
                {
                    const matchesPattern = word.match( rule.errorPattern );

                    if ( matchesPattern && ( matchesPattern.length > 0 ) )
                    {
                        updatedList.push( new TextSegment( word, rule ) );
                    }
                    else
                    {
                        updatedList.push( new TextSegment( word, segment.rule ) );
                    }
                } );
            } );

            listSegments = updatedList;
        }

        return listSegments;
    }

    // Combine segments to make formatted text on screen with [possibly]
    // different colored text.
    function CreateHtml( listTextSegments, textHighlight )
    {
        const results = $( "<code/>" );

        for ( let listIndex = 0; listIndex < listTextSegments.length; listIndex++ )
        {
            const segment = listTextSegments[listIndex];

            var segmentText;

            if ( segment.rule === null )
            {
                segmentText = $( "<span/>" ).text( segment.text );
            }
            else
            {
                segmentText = $( "<span/>" ).addClass( textHighlight ).text( segment.text );
            }

            results.append( segmentText );
        }

        return results;
    };
}

// Add a entry (title, messages and content) to the Summary Tab fields.
function addSummaryRowDisplay( summaryRow )
{
    // Set up a single set (defined by summary row) of fields to be displayed in the summary
    // section of the report.

    AddRowDisplay( $( "#summary-content" ), summaryRow.value, summaryRow.label, null, summaryRow.rulesFlagged, "summaryHighlight" );
}

// Add an entry (title, messages and content) to the Other tab fields
function addOtherRowDisplay( otherRow )
{
    AddRowDisplay( $( "#other-content" ), otherRow.value, otherRow.header, otherRow.url, otherRow.rulesFlagged, "otherHighlight" );
}

function addCalloutEntry(name, value, parent) {
    if (value) {
        $("<p/>")
            .addClass("wrap-line")
            .html("<strong>" + name + ": </strong>" + value)
            .appendTo(parent);
    }
}

function updateStatus(message) {
    if (myApp) {
        myApp.hidePreloader();
        myApp.showPreloader(message);
    }
}

function hideStatus() {
    myApp.hidePreloader();
}

// Handles rendering of an error.
// Does not log the error - caller is responsible for calling LogError
function showError(error, message) {
    if (myApp) {
        myApp.hidePreloader();
        myApp.alert(message, "An Error Occurred");
    }
}