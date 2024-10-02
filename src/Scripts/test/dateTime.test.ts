import { Received } from "../table/Received";
import "./matchers/datesEqual";
import { expect } from "@jest/globals";

describe("DateTime Tests", () => {
    const received = new Received();
    test("h1", () => {
        const h1 = "Received: test; Sat, 21 Apr 2018 03:01:01 +0000";
        expect(received.parseHeader(h1)).datesEqual({ date: "4/20/2018, 11:01:01 PM", dateNum: 1524279661000 });
    });
    test("h2", () => {
        const h2 = "Received: test; Saturday, 21 Apr 2018 03:01:02 +0000";
        expect(received.parseHeader(h2)).datesEqual({ date: "4/20/2018, 11:01:02 PM", dateNum: 1524279662000 });
    });
    test("h3", () => {
        const h3 = "Received: test; 21 Apr 2018 03:01:03 +0000";
        expect(received.parseHeader(h3)).datesEqual({ date: "4/20/2018, 11:01:03 PM", dateNum: 1524279663000 });
    });
    test("h4", () => {
        const h4 = "Received: test; Apr 21 2018 03:01:04 +0000";
        expect(received.parseHeader(h4)).datesEqual({ date: "4/20/2018, 11:01:04 PM", dateNum: 1524279664000 });
    });
    test("h5", () => {
        const h5 = "Received: test; Apr 21 2018 3:01:05 +0000";
        expect(received.parseHeader(h5)).datesEqual({ date: "4/20/2018, 11:01:05 PM", dateNum: 1524279665000 });
    });
    test("h6", () => {
        const h6 = "Received: test; 4/20/2018 23:01:06 -0400 (EDT)";
        expect(received.parseHeader(h6)).datesEqual({ date: "4/20/2018, 11:01:06 PM", dateNum: 1524279666000 });
    });
    test("h6_1", () => {
        const h6_1 = "Received: test; 4/20/2018 11:01:16 PM -0400 (EDT)";
        expect(received.parseHeader(h6_1)).datesEqual({ date: "4/20/2018, 11:01:16 PM", dateNum: 1524279676000 });
    });
    test("h6_2", () => {
        const h6_2 = "Received: test; 4/20/2018 11:01:26 PM +0000";
        expect(received.parseHeader(h6_2)).datesEqual({ date: "4/20/2018, 7:01:26 PM", dateNum: 1524265286000 });
    });
    test("h6_3", () => {
        const h6_3 = "Received: test; 4/20/2018 11:01:36 PM";
        expect(received.parseHeader(h6_3)).datesEqual({ date: "4/20/2018, 7:01:36 PM", dateNum: 1524265296000 });
    });
    test("h7", () => {
        const h7 = "Received: test; 4-20-2018 11:01:07 PM";
        expect(received.parseHeader(h7)).datesEqual({ date: "4/20/2018, 7:01:07 PM", dateNum: 1524265267000 });
    });
    test("h8", () => {
        const h8 = "Received: test; 2018-4-20 11:01:08 PM";
        expect(received.parseHeader(h8)).datesEqual({ date: "4/20/2018, 7:01:08 PM", dateNum: 1524265268000 });
    });
    test("h9", () => {
        const h9 = "Received: test; Mon, 26 Mar 2018 13:35:09 +0000 (UTC)";
        expect(received.parseHeader(h9)).datesEqual({ date: "3/26/2018, 9:35:09 AM", dateNum: 1522071309000 });
    });
    test("h10", () => {
        const h10 = "Received: test; Mon, 26 Mar 2018 13:35:10.102 +0000 (UTC)";
        expect(received.parseHeader(h10)).datesEqual({ date: "3/26/2018, 9:35:10 AM", dateNum: 1522071310102 });
    });
    test("h11", () => {
        const h11 = "Received: test; Mon, 26 Mar 2018 13:35:11.102 +0000 UTC";
        expect(received.parseHeader(h11)).datesEqual({ date: "3/26/2018, 9:35:11 AM", dateNum: 1522071311102 });
    });

    test("50", () => { expect(Received.computeTime(9000, 8000)).toBe("1 second"); });
    test("51", () => { expect(Received.computeTime(99000, 8000)).toBe("1 minute 31 seconds"); });
    test("52", () => { expect(Received.computeTime(999000, 8000)).toBe("16 minutes 31 seconds"); });
    test("53", () => { expect(Received.computeTime(9999000, 8000)).toBe("166 minutes 31 seconds"); });
    test("54", () => { expect(Received.computeTime(8000, 9000)).toBe("-1 second"); });
    test("55", () => { expect(Received.computeTime(8000, 99000)).toBe("-1 minute 31 seconds"); });
    test("56", () => { expect(Received.computeTime(8000, 999000)).toBe("-16 minutes 31 seconds"); });
    test("57", () => { expect(Received.computeTime(8000, 9999000)).toBe("-166 minutes 31 seconds"); });
    test("58", () => { expect(Received.computeTime(9000, 8500)).toBe("0 seconds"); });
    test("59", () => { expect(Received.computeTime(8500, 9000)).toBe("0 seconds"); });
});
