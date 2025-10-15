/* global viewModel */
import { ImportedStrings } from "../Strings";
import { mapHeaderToURL } from "./Headers";

export function initializeTableUI() {
    // Headers
    makeResizablePane("originalHeaders", ImportedStrings.mha_originalHeaders, function () { return viewModel.originalHeaders.length; });
    $(".collapsibleElement", $("#originalHeaders").parents(".collapsibleWrapper")).toggle();

    // Summary
    makeResizablePane("summary", ImportedStrings.mha_summary, function () { return viewModel.summary.exists(); });
    makeSummaryTable("#summary", viewModel.summary.summaryRows, "SUM");

    // Received
    makeResizableTable(viewModel.receivedHeaders.tableName, ImportedStrings.mha_receivedHeaders, function () { return viewModel.receivedHeaders.exists(); });

    const receivedColumns = [
        new Column("hop", ImportedStrings.mha_hop, null),
        new Column("from", ImportedStrings.mha_submittingHost, null),
        new Column("by", ImportedStrings.mha_receivingHost, null),
        new Column("date", ImportedStrings.mha_time, null),
        new Column("delay", ImportedStrings.mha_delay, null),
        new Column("with", ImportedStrings.mha_type, null),
        new Column("id", ImportedStrings.mha_id, "extraCol"),
        new Column("for", ImportedStrings.mha_for, "extraCol"),
        new Column("via", ImportedStrings.mha_via, "extraCol")
    ];

    addColumns(viewModel.receivedHeaders.tableName, receivedColumns);

    const withColumn = $("#" + "receivedHeaders" + " #with");
    if (withColumn !== null) {
        const leftSpan = $(document.createElement("span"));
        leftSpan.attr("id", "leftArrow");
        leftSpan.addClass("collapsibleArrow");
        leftSpan.addClass("hiddenElement");
        leftSpan.html("&lArr;");

        const rightSpan = $(document.createElement("span"));
        rightSpan.attr("id", "rightArrow");
        rightSpan.addClass("collapsibleArrow");
        rightSpan.html("&rArr;");

        withColumn.append(leftSpan);
        withColumn.append(rightSpan);
    }

    $("#receivedHeaders .collapsibleArrow").bind("click", function (eventObject) {
        toggleExtraColumns();
        eventObject.stopPropagation();
    });

    setArrows(viewModel.receivedHeaders.tableName, "hop", 1);

    // FFAS
    makeResizablePane("forefrontAntiSpamReport", ImportedStrings.mha_forefrontAntiSpamReport, function () { return viewModel.forefrontAntiSpamReport.exists(); });
    makeSummaryTable("#forefrontAntiSpamReport", viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows, "FFAS");

    // AntiSpam
    makeResizablePane("antiSpamReport", ImportedStrings.mha_antiSpamReport, function () { return viewModel.antiSpamReport.exists(); });
    makeSummaryTable("#antiSpamReport", viewModel.antiSpamReport.antiSpamRows, "AS");

    // Other
    makeResizableTable(viewModel.otherHeaders.tableName, ImportedStrings.mha_otherHeaders, function () { return viewModel.otherHeaders.otherRows.length; });

    const otherColumns = [
        new Column("number", ImportedStrings.mha_number, null),
        new Column("header", ImportedStrings.mha_header, null),
        new Column("value", ImportedStrings.mha_value, null)
    ];

    addColumns(viewModel.otherHeaders.tableName, otherColumns);

    setArrows(viewModel.otherHeaders.tableName, "number", 1);

    rebuildSections();
}

export function rebuildTables() {
    updateStatus("");
    rebuildSections();
    hideExtraColumns();
}

export function onResize() {
    positionResponse();
}

// Adjusts response under our lineBreak
function positionResponse() {
    const responseTop = $("#lineBreak")[0].offsetTop + $("#lineBreak").height();
    $("#response").css("top", responseTop + 15);
}

export function recalculateVisibility() {
    for (let i = 0; i < visibilityBindings.length; i++) {
        makeVisible(visibilityBindings[i][0], visibilityBindings[i][1]());
    }

    positionResponse();
}

// Restores table to empty state so we can repopulate it
function emptyTableUI(id) {
    $("#" + id + " tbody tr").remove(); // Remove the rows
    $("#" + id + " th").removeClass("emptyColumn"); // Restore header visibility
    $("#" + id + " th").removeClass("hiddenElement"); // Restore header visibility
}

function hideEmptyColumns(id) {
    $("#" + id + " th").each(function (i) {
        let keep = 0;

        // Find a child cell which has data
        const children = $(this).parents("table").find("tr td:nth-child(" + (i + 1).toString() + ")");
        children.each(function () {
            if (this.innerHTML !== "") {
                keep++;
            }
        });

        if (keep === 0) {
            $(this).addClass("emptyColumn");
            children.addClass("emptyColumn");
        } else {
            $(this).removeClass("emptyColumn");
            children.removeClass("emptyColumn");
        }
    });
}

function hideExtraColumns() {
    $("#leftArrow").addClass("hiddenElement");
    $("#rightArrow").removeClass("hiddenElement");
}

function showExtraColumns() {
    $("#rightArrow").addClass("hiddenElement");
    $("#leftArrow").removeClass("hiddenElement");
}

function toggleExtraColumns() {
    viewModel.showExtra = !viewModel.showExtra;

    if (viewModel.showExtra) {
        showExtraColumns();
    } else {
        hideExtraColumns();
    }

    recalculateVisibility();
}

function toggleCollapse(object) {
    $(".collapsibleElement", $(object).parents(".collapsibleWrapper")).toggle();
    positionResponse();
}

// Wraps an element into a collapsible pane with a title
export function makeResizablePane(id, title, visibility) {
    const pane = $("#" + id);
    if (pane.hasClass("collapsibleElement")) {
        return;
    }
    const hidden = pane.hasClass("hiddenElement");

    pane.addClass("collapsibleElement");
    const wrap = $(document.createElement("div"));
    wrap.addClass("collapsibleWrapper");
    if (visibility) {
        wrap.attr("id", id + "Wrapper");
        visibilityBindings.push(["#" + id + "Wrapper", visibility]);
    }
    const header = $(document.createElement("div"));
    header.addClass("sectionHeader");
    header.bind("click", function () { toggleCollapse(this); });
    header.text(title);

    const moreSpan = $(document.createElement("span"));
    moreSpan.addClass("collapsibleSwitch");
    moreSpan.addClass("collapsibleElement");
    moreSpan.html("+&nbsp;");

    const lessSpan = $(document.createElement("span"));
    lessSpan.addClass("collapsibleSwitch");
    lessSpan.addClass("collapsibleElement");
    lessSpan.html("&ndash;&nbsp;");

    // Now that everything is built, put it together
    pane.wrap(wrap);
    pane.before(header);
    header.append(moreSpan);
    header.append(lessSpan);
    if (hidden) {
        lessSpan.hide();
    } else {
        moreSpan.hide();
    }
}

// Wraps a table into a collapsible table with a title
function makeResizableTable(id, title, visibility) {
    const pane = $("#" + id);
    if (pane.hasClass("collapsibleElement")) { return; }

    pane.addClass("collapsibleElement");
    const wrap = $(document.createElement("div"));
    wrap.addClass("collapsibleWrapper");
    if (visibility) {
        wrap.attr("id", id + "Wrapper");
        visibilityBindings.push(["#" + id + "Wrapper", visibility]);
    }

    const header = $(document.createElement("div"));
    header.addClass("tableCaption");
    header.bind("click", function () { toggleCollapse(this); });
    header.text(title);

    const moreSpan = $(document.createElement("span"));
    moreSpan.addClass("collapsibleSwitch");
    moreSpan.html("+&nbsp;");
    header.append(moreSpan);
    header.addClass("collapsibleElement");

    const captionDiv = $(document.createElement("div"));
    captionDiv.addClass("tableCaption");
    captionDiv.bind("click", function () { toggleCollapse(this); });
    captionDiv.text(title);

    const lessSpan = $(document.createElement("span"));
    lessSpan.addClass("collapsibleSwitch");
    lessSpan.html("&ndash;&nbsp;");
    captionDiv.append(lessSpan);

    const tbody = $(document.createElement("tbody"));

    // Now that everything is built, put it together
    pane.wrap(wrap);
    pane.before(header);
    pane.append(tbody);
    const caption = $(pane[0].createCaption());
    caption.prepend(captionDiv);
    header.hide();
}

export const Column = function (id, label, columnClass) {
    this.id = id;
    this.label = label;
    this.class = columnClass;
};

Column.prototype.id = "";
Column.prototype.label = "";
Column.prototype.class = null;

function addColumns(tableName, columns) {
    const tableHeader = $(document.createElement("thead"));
    if (tableHeader !== null) {
        $("#" + tableName).append(tableHeader);

        const headerRow = $(document.createElement("tr"));
        if (headerRow !== null) {
            headerRow.addClass("tableHeader");
            tableHeader.append(headerRow); // Must happen before we append cells to appease IE7

            for (let i = 0; i < columns.length; i++) {
                const headerCell = $(document.createElement("th"));
                if (headerCell !== null) {
                    headerCell.attr("id", columns[i].id);
                    headerCell.text(columns[i].label);
                    if (columns[i].class !== null) {
                        headerCell.addClass(columns[i].class);
                    }

                    headerRow.append(headerCell);
                }

                makeSortableColumn(tableName, columns[i].id);
            }
        }
    }
}

function makeSortableColumn(table, id) {
    const header = $("#" + id);

    header.bind("click", function () {
        viewModel[table].doSort(id);
        setArrows(viewModel[table].tableName, viewModel[table].sortColumn,
            viewModel[table].sortOrder);
        rebuildSections();
    });

    const downSpan = $(document.createElement("span"));
    downSpan.addClass("downArrow");
    downSpan.addClass("hiddenElement");
    downSpan.html("&darr;");

    const upSpan = $(document.createElement("span"));
    upSpan.addClass("upArrow");
    upSpan.addClass("hiddenElement");
    upSpan.html("&uarr;");

    // Now that everything is built, put it together
    header.append(downSpan);
    header.append(upSpan);
}

function makeSummaryTable(summaryName, rows, tag) {
    const summaryList = $(summaryName);
    if (summaryList) {
        summaryList.addClass("summaryList");

        for (let i = 0; i < rows.length; i++) {
            const id = rows[i].header + tag;
            const row = document.createElement("tr");
            if (row !== null) {
                row.id = id;
                summaryList.append(row); // Must happen before we append cells to appease IE7
                const headerCell = $(row.insertCell(-1));
                if (headerCell) {
                    headerCell.text(rows[i].label);
                    headerCell.addClass("summaryHeader");
                }

                const valCell = $(row.insertCell(-1));
                if (valCell) {
                    valCell.attr("id", id + "Val");
                }

                makeVisible("#" + id, false);
            }
        }
    }
}

function makeVisible(id, visible) {
    if (visible) {
        $(id).removeClass("hiddenElement");
    } else {
        $(id).addClass("hiddenElement");
    }
}

function appendCell(row, text, html, cellClass) {
    const cell = $(row.insertCell(-1));
    if (text) { cell.text(text); }
    if (html) { cell.html(html); }
    if (cellClass) { cell.addClass(cellClass); }
}

export function setArrows(table, colName, sortOrder) {
    $("#" + table + " .tableHeader .downArrow").addClass("hiddenElement");
    $("#" + table + " .tableHeader .upArrow").addClass("hiddenElement");

    if (sortOrder === 1) {
        $("#" + table + " .tableHeader #" + colName + " .downArrow").removeClass("hiddenElement");
    } else {
        $("#" + table + " .tableHeader #" + colName + " .upArrow").removeClass("hiddenElement");
    }
}

function setRowValue(row, type) {
    const headerVal = $("#" + row.header + type + "Val");
    if (headerVal) {
        const val = row.get();
        if (val) {
            if (row.url) {
                headerVal.html(mapHeaderToURL(row.url, val));
            }
            else {
                headerVal.text(val);
            }

            makeVisible("#" + row.header + type, true);
        }
    }
}

// Rebuilds content and recalculates what sections should be displayed
export function rebuildSections() {
    let i;
    let row;

    // Summary
    for (i = 0; i < viewModel.summary.summaryRows.length; i++) {
        setRowValue(viewModel.summary.summaryRows[i], "SUM");
    }

    buildDiagnosticsReport();

    // Received
    emptyTableUI(viewModel.receivedHeaders.tableName);
    for (i = 0; i < viewModel.receivedHeaders.receivedRows.length; i++) {
        row = document.createElement("tr");
        $("#" + viewModel.receivedHeaders.tableName).append(row); // Must happen before we append cells to appease IE7
        appendCell(row, viewModel.receivedHeaders.receivedRows[i].hop, null, null);
        appendCell(row, viewModel.receivedHeaders.receivedRows[i].from, null, null);
        appendCell(row, viewModel.receivedHeaders.receivedRows[i].by, null, null);
        appendCell(row, viewModel.receivedHeaders.receivedRows[i].date, null, null);
        let labelClass = "hotBarLabel";
        if (viewModel.receivedHeaders.receivedRows[i].delaySort < 0) {
            labelClass += " negativeCell";
        }

        const hotBar =
            "<div class='hotBarContainer'>" +
            "   <div class='" + labelClass + "'>" + viewModel.receivedHeaders.receivedRows[i].delay + "</div>" +
            "   <div class='hotBarBar' style='width:" + viewModel.receivedHeaders.receivedRows[i].percent + "%'></div>" +
            "</div>";
        appendCell(row, null, hotBar, "hotBarCell");
        appendCell(row, viewModel.receivedHeaders.receivedRows[i].with, null, null);
        appendCell(row, viewModel.receivedHeaders.receivedRows[i].id, null, "extraCol");
        appendCell(row, viewModel.receivedHeaders.receivedRows[i].for, null, "extraCol");
        appendCell(row, viewModel.receivedHeaders.receivedRows[i].via, null, "extraCol");
    }

    // Calculate heights for the hotbar cells (progress bars in Delay column)
    // Not clear why we need to do this
    $(".hotBarCell").each(function () {
        $(this).find(".hotBarContainer").height($(this).height());
    });

    $("#" + viewModel.receivedHeaders.tableName + " tbody tr:odd").addClass("oddRow");
    hideEmptyColumns(viewModel.receivedHeaders.tableName);

    // Forefront AntiSpam Report
    for (i = 0; i < viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows.length; i++) {
        setRowValue(viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows[i], "FFAS");
    }

    // AntiSpam Report
    for (i = 0; i < viewModel.antiSpamReport.antiSpamRows.length; i++) {
        setRowValue(viewModel.antiSpamReport.antiSpamRows[i], "AS");
    }

    // Other
    emptyTableUI(viewModel.otherHeaders.tableName);
    for (i = 0; i < viewModel.otherHeaders.otherRows.length; i++) {
        row = document.createElement("tr");
        $("#" + viewModel.otherHeaders.tableName).append(row); // Must happen before we append cells to appease IE7
        appendCell(row, viewModel.otherHeaders.otherRows[i].number, null, null);
        appendCell(row, viewModel.otherHeaders.otherRows[i].header, viewModel.otherHeaders.otherRows[i].url, null);
        appendCell(row, viewModel.otherHeaders.otherRows[i].value, null, "allowBreak");
    }

    $("#" + viewModel.otherHeaders.tableName + " tbody tr:odd").addClass("oddRow");

    // Original headers
    $("#originalHeaders").text(viewModel.originalHeaders);

    recalculateVisibility();
}

export const visibilityBindings = [
    ["#lineBreak", function () { return viewModel.status || viewModel.summary.exists() || viewModel.receivedHeaders.exists() || viewModel.otherHeaders.exists(); }],
    ["#response", function () { return viewModel.status || viewModel.summary.exists() || viewModel.receivedHeaders.exists() || viewModel.otherHeaders.exists(); }],
    ["#status", function () { return viewModel.status; }],
    [".extraCol", function () { return viewModel.showExtra; }],
    ["#clearButton", function () { return viewModel.hasData; }]
];

//#region Build Diagnostics Report

// Build Diagnostics Report contains all functionality to build the diagnostics report section.
// IT:
//   Gets an array of All Sections that were created from the Header
//   Gets an array of All sections that have an error flagged
//   Gets the set of rules that triggered an error
//   For each of those rules, processes it by displaying the rule error, and the sub-sections that were used to determine the rule was to be flagged
function buildDiagnosticsReport()
{

    const allSections = GetAllSections();                                             // All sections
    const allSectionsFlagged = GetSectionsWithErrors();                               // All sections with items that were flagged
    const rulesThatTriggered = GetPrimaryRulesThatTriggered( allSectionsFlagged );      // Set of rules that were flagged
    const errorDisplay = $( ".ui-diagnostics-report-section" );                         // Where to display error

    $( "diagnosticsReport" ).empty();
    errorDisplay.empty();

    if ( rulesThatTriggered && ( rulesThatTriggered.length > 0 ) )
    {
        makeResizablePane( "diagnosticsReport", "Diagnostics Report", function () { return rulesThatTriggered && ( rulesThatTriggered.length > 0 ); } );

        rulesThatTriggered.forEach( ProcessRule );
    }

    // Process a single rule that was flagged
    function ProcessRule( rule )
    {
        BlankLine();

        // Display Error Message
        const fieldTitle = $( "<div />" )
            .addClass( "ms-font-l" )
            .addClass( "ms-fontWeight-semibold" )
            .addClass( "differenciateErrorMessage" )
            .text( rule.errorMessage );

        fieldTitle.appendTo( errorDisplay );
        //BlankLine();

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
            //BlankLine();
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

        setOfAllSections.forEach( function ( set )
        {
            set.forEach( function ( section )
            {
                PushUnique( allSectionsNoDuplicates, section );
            } );
        } );

        return allSectionsNoDuplicates;
    };

    // Get array of all sections with at least one rule flagged
    function GetSectionsWithErrors()
    {

        const sectionsWithErrors = [];
        const allSections = GetAllSections();

        allSections.forEach( function ( section )
        {
            // IF section has at least one rule flagged
            if ( section.rulesFlagged && section.rulesFlagged.length > 0 )
            {
                const entryAlreadyInSet = FindInArray( sectionsWithErrors, section );

                // IF this section already has an error associated with it, add other errors to it.
                if ( entryAlreadyInSet )
                {
                    AddRuleFlagged( entryAlreadyInSet, section.rulesFlagged );
                }
                else
                {
                    // Add section with error to array of sections with errors
                    sectionsWithErrors.push( section );
                }
            }
        } );

        return sectionsWithErrors;
    };

    // Get list of all rules that were triggered within the set of sections passed in
    // sectionsWithErrors - set of sections to look for rules triggered
    // Returns array of rules that were triggered
    function GetPrimaryRulesThatTriggered( sectionsWithErrors )
    {
        const rulesThatTriggered = [];

        sectionsWithErrors.forEach( function ( section )
        {
            section.rulesFlagged.forEach( function ( rule )
            {
                // Skip rules that were part of a complex rule (And Rule constituent)
                if ( rule.primaryRule )
                {
                    if ( !ArrayContains( rulesThatTriggered, rule ) )
                    {
                        rulesThatTriggered.push( rule );
                    }
                }
            } );
        } );

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
                const rule = rules[ruleIndex];
                const updatedList = [];

                const expression = new RegExp( "(" + rule.errorPattern + ")", "g" );

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

                let segmentText;

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