import $ from "jquery";

import { HeaderModel } from "../HeaderModel";
import { Table } from "./Table";
// import { Row } from "../row/Row";

describe("Table", () => {
    let table: Table;
    let viewModel: HeaderModel;

    beforeEach(() => {
        table = new Table();
        viewModel = new HeaderModel(
            "Received: from example.com (::1) by" +
            " example2.com with HTTPS; Mon, 14 Oct 2024 18:24:33" +
            " +0000" +
            "From: John Doe <jdoe@example.com>" +
            "To: \"Everyone\" <everyone@example.com>" +
            "Subject: Test email" +
            "Date: Mon, 14 Oct 2024 18:24:17 +0000" +
            "X-Microsoft-Antispam: BCL:0;ARA:13230040|366016|4022899009|41050700001;" +
            "X-Forefront-Antispam-Report:" +
            " CIP:255.255.255.255;CTRY:;LANG:en;SCL:1;SRV:;IPV:NLI;SFV:NSPM;H:something.example.com;PTR:;CAT:NONE;SFS:(13230040)(366016)(4022899009)(41050700001);DIR:INT;" +
            "Content-Language: en-US"
        );
    });

    it("should initialize table UI", () => {
        table.initializeTableUI(viewModel);
        expect(table["viewModel"]).toEqual(viewModel);
    });

    it("should rebuild sections", () => {
        table.rebuildSections(viewModel);
        expect(table["viewModel"]).toEqual(viewModel);
    });

    // it("should recalculate visibility", () => {
    //     table.recalculateVisibility();
    //     table["visibilityBindings"].forEach(binding => {
    //         expect($(binding.name).hasClass("hiddenElement")).toBe(!binding.visible(table));
    //     });
    // });

    it("should toggle collapse", () => {
        const id = "testElement";
        $("body").append(`<div id="${id}" class="hiddenElement"></div>`);
        table["toggleCollapse"](id);
        expect($(`#${id}`).hasClass("hiddenElement")).toBe(false);
        table["toggleCollapse"](id);
        expect($(`#${id}`).hasClass("hiddenElement")).toBe(true);
        $(`#${id}`).remove();
    });

    it("should make element visible", () => {
        const id = "#testElement";
        $("body").append("<div id=\"testElement\" class=\"hiddenElement\"></div>");
        table["makeVisible"](id, true);
        expect($(id).hasClass("hiddenElement")).toBe(false);
        table["makeVisible"](id, false);
        expect($(id).hasClass("hiddenElement")).toBe(true);
        $(id).remove();
    });

    it("should hide empty columns", () => {
        const tableId = "testTable";
        $("body").append(`
            <table id="${tableId}">
                <thead>
                    <tr>
                        <th>Header 1</th>
                        <th>Header 2</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td></td>
                        <td>Data</td>
                    </tr>
                </tbody>
            </table>
        `);
        table["hideEmptyColumns"](tableId);
        expect($(`#${tableId} th`).eq(0).hasClass("emptyColumn")).toBe(true);
        expect($(`#${tableId} th`).eq(1).hasClass("emptyColumn")).toBe(false);
        $(`#${tableId}`).remove();
    });

    // it("should set row value", () => {
    //     const row: Row = new Row("testHeader", "testValue", "testId");
    //     $("body").append("<div id=\"testHeaderSUMVal\"></div>");
    //     table["setRowValue"](row, "SUM");
    //     expect($("#testHeaderSUMVal").text()).toBe("testValue");
    //     $("#testHeaderSUMVal").remove();
    // });

    // it("should append cell", () => {
    //     const row = document.createElement("tr");
    //     table["appendCell"](row, "text", "<b>html</b>", "cellClass");
    //     expect($(row).find("td").eq(0).text()).toBe("text");
    //     expect($(row).find("td").eq(1).html()).toBe("<b>html</b>");
    //     expect($(row).find("td").eq(1).hasClass("cellClass")).toBe(true);
    // });

    it("should empty table UI", () => {
        const tableId = "testTable";
        $("body").append(`
            <table id="${tableId}">
                <thead>
                    <tr class="tableHeader">
                        <th>Header 1</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Data</td>
                    </tr>
                </tbody>
            </table>
        `);
        table["emptyTableUI"](tableId);
        expect($(`#${tableId} tbody tr`).length).toBe(0);
        expect($(`#${tableId} th`).hasClass("emptyColumn")).toBe(false);
        expect($(`#${tableId} th`).hasClass("hiddenElement")).toBe(false);
        $(`#${tableId}`).remove();
    });

    it("should toggle extra columns", () => {
        table["showExtra"] = false;
        table["toggleExtraColumns"]();
        expect(table["showExtra"]).toBe(true);
        table["toggleExtraColumns"]();
        expect(table["showExtra"]).toBe(false);
    });

    // it("should reset arrows", () => {
    //     table.resetArrows();
    //     expect($("#receivedHeaders th button").attr("aria-sort")).toBe("none");
    //     expect($("#otherHeaders th button").attr("aria-sort")).toBe("none");
    // });
});