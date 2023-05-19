﻿import * as QUnit from "qunit";
import { Received } from "../Received";

QUnit.test("DateTime Tests", function (assert: Assert) {
    const received = new Received();

    const h1 = "Received: test; Sat, 21 Apr 2018 03:01:01 +0000";
    assert.datesEqual(received.parseHeader(h1), { "date": "4/20/2018, 11:01:01 PM", "dateNum": 1524279661000 }, h1);
    const h2 = "Received: test; Saturday, 21 Apr 2018 03:01:02 +0000";
    assert.datesEqual(received.parseHeader(h2), { "date": "4/20/2018, 11:01:02 PM", "dateNum": 1524279662000 }, h2);
    const h3 = "Received: test; 21 Apr 2018 03:01:03 +0000";
    assert.datesEqual(received.parseHeader(h3), { "date": "4/20/2018, 11:01:03 PM", "dateNum": 1524279663000 }, h3);
    const h4 = "Received: test; Apr 21 2018 03:01:04 +0000";
    assert.datesEqual(received.parseHeader(h4), { "date": "4/20/2018, 11:01:04 PM", "dateNum": 1524279664000 }, h4);
    const h5 = "Received: test; Apr 21 2018 3:01:05 +0000";
    assert.datesEqual(received.parseHeader(h5), { "date": "4/20/2018, 11:01:05 PM", "dateNum": 1524279665000 }, h5);
    const h6 = "Received: test; 4/20/2018 23:01:06 -0400 (EDT)";
    assert.datesEqual(received.parseHeader(h6), { "date": "4/20/2018, 11:01:06 PM", "dateNum": 1524279666000 }, h6);
    const h6_1 = "Received: test; 4/20/2018 11:01:16 PM -0400 (EDT)";
    assert.datesEqual(received.parseHeader(h6_1), { "date": "4/20/2018, 11:01:16 PM", "dateNum": 1524279676000 }, h6_1);
    const h6_2 = "Received: test; 4/20/2018 11:01:26 PM +0000";
    assert.datesEqual(received.parseHeader(h6_2), { "date": "4/20/2018, 7:01:26 PM", "dateNum": 1524265286000 }, h6_2);
    const h6_3 = "Received: test; 4/20/2018 11:01:36 PM";
    assert.datesEqual(received.parseHeader(h6_3), { "date": "4/20/2018, 7:01:36 PM", "dateNum": 1524265296000 }, h6_3);
    const h7 = "Received: test; 4-20-2018 11:01:07 PM";
    assert.datesEqual(received.parseHeader(h7), { "date": "4/20/2018, 7:01:07 PM", "dateNum": 1524265267000 }, h7);
    const h8 = "Received: test; 2018-4-20 11:01:08 PM";
    assert.datesEqual(received.parseHeader(h8), { "date": "4/20/2018, 7:01:08 PM", "dateNum": 1524265268000 }, h8);
    const h9 = "Received: test; Mon, 26 Mar 2018 13:35:09 +0000 (UTC)";
    assert.datesEqual(received.parseHeader(h9), { "date": "3/26/2018, 9:35:09 AM", "dateNum": 1522071309000 }, h9);
    const h10 = "Received: test; Mon, 26 Mar 2018 13:35:10.102 +0000 (UTC)";
    assert.datesEqual(received.parseHeader(h10), { "date": "3/26/2018, 9:35:10 AM", "dateNum": 1522071310102 }, h10);
    const h11 = "Received: test; Mon, 26 Mar 2018 13:35:11.102 +0000 UTC";
    assert.datesEqual(received.parseHeader(h11), { "date": "3/26/2018, 9:35:11 AM", "dateNum": 1522071311102 }, h11);

    assert.equal(Received.computeTime(9000, 8000), "1 second", "50");
    assert.equal(Received.computeTime(99000, 8000), "1 minute 31 seconds", "51");
    assert.equal(Received.computeTime(999000, 8000), "16 minutes 31 seconds", "52");
    assert.equal(Received.computeTime(9999000, 8000), "166 minutes 31 seconds", "53");
    assert.equal(Received.computeTime(8000, 9000), "-1 second", "54");
    assert.equal(Received.computeTime(8000, 99000), "-1 minute 31 seconds", "55");
    assert.equal(Received.computeTime(8000, 999000), "-16 minutes 31 seconds", "56");
    assert.equal(Received.computeTime(8000, 9999000), "-166 minutes 31 seconds", "57");
    assert.equal(Received.computeTime(9000, 8500), "0 seconds", "58");
    assert.equal(Received.computeTime(8500, 9000), "0 seconds", "59");
});