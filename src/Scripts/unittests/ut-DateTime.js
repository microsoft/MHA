/* global QUnit */
/* global Received */

QUnit.test("DateTime Tests", function (assert) {
    var received = Received();
    QUnit.assert.datesEqual = function (value, expected, message) {
        return assert.propEqual({ date: value.date, datenum: value.datenum }, expected, message);
    };

    var h1 = "Received: test; Sat, 21 Apr 2018 03:01:32 +0000";
    assert.datesEqual(received.parseHeader(h1), { "date": "4/20/2018 11:01:32 PM", "datenum": 1524279692000 }, h1);
    var h2 = "Received: test; Saturday, 21 Apr 2018 03:01:32 +0000";
    assert.datesEqual(received.parseHeader(h2), { "date": "4/20/2018 11:01:32 PM", "datenum": 1524279692000 }, h2);
    var h3 = "Received: test; 21 Apr 2018 03:01:32 +0000";
    assert.datesEqual(received.parseHeader(h3), { "date": "4/20/2018 11:01:32 PM", "datenum": 1524279692000 }, h3);
    var h4 = "Received: test; Apr 21 2018 03:01:32 +0000";
    assert.datesEqual(received.parseHeader(h4), { "date": "4/20/2018 11:01:32 PM", "datenum": 1524279692000 }, h4);
    var h5 = "Received: test; Apr 21 2018 3:01:32 +0000";
    assert.datesEqual(received.parseHeader(h5), { "date": "4/20/2018 11:01:32 PM", "datenum": 1524279692000 }, h5);
    var h6 = "Received: test; 4/20/2018 23:01:32 -0400 (EDT)";
    assert.datesEqual(received.parseHeader(h6), { "date": "4/20/2018 11:01:32 PM", "datenum": 1524279692000 }, h6);
    var h6_1 = "Received: test; 4/20/2018 11:01:32 PM -0400 (EDT)";
    assert.datesEqual(received.parseHeader(h6_1), { "date": "4/20/2018 11:01:32 PM", "datenum": 1524279692000 }, h6_1);
    var h6_2 = "Received: test; 4/20/2018 11:01:32 PM +0000";
    assert.datesEqual(received.parseHeader(h6_2), { "date": "4/20/2018 7:01:32 PM", "datenum": 1524265292000 }, h6_2);
    var h6_3 = "Received: test; 4/20/2018 11:01:32 PM";
    assert.datesEqual(received.parseHeader(h6_3), { "date": "4/20/2018 7:01:32 PM", "datenum": 1524265292000 }, h6_3);
    var h7 = "Received: test; 4-20-2018 11:01:32 PM";
    assert.datesEqual(received.parseHeader(h7), { "date": "4/20/2018 7:01:32 PM", "datenum": 1524265292000 }, h7);
    var h8 = "Received: test; 2018-4-20 11:01:32 PM";
    assert.datesEqual(received.parseHeader(h8), { "date": "4/20/2018 7:01:32 PM", "datenum": 1524265292000 }, h8);
    var h9 = "Received: test; Mon, 26 Mar 2018 13:35:36 +0000 (UTC)";
    assert.datesEqual(received.parseHeader(h9), { "date": "3/26/2018 9:35:36 AM", "datenum": 1522071336000 }, h9);
    var h10 = "Received: test; Mon, 26 Mar 2018 13:35:36.102 +0000 (UTC)";
    assert.datesEqual(received.parseHeader(h10), { "date": "3/26/2018 9:35:36 AM", "datenum": 1522071336102 }, h10);
    var h11 = "Received: test; Mon, 26 Mar 2018 13:35:36.102 +0000 UTC";
    assert.datesEqual(received.parseHeader(h11), { "date": "3/26/2018 9:35:36 AM", "datenum": 1522071336102 }, h11);

    assert.equal(received.computeTime(9000, 8000), "1 second", 50);
    assert.equal(received.computeTime(99000, 8000), "1 minute 31 seconds", 51);
    assert.equal(received.computeTime(999000, 8000), "16 minutes 31 seconds", 52);
    assert.equal(received.computeTime(9999000, 8000), "166 minutes 31 seconds", 53);
    assert.equal(received.computeTime(8000, 9000), "-1 second", 54);
    assert.equal(received.computeTime(8000, 99000), "-1 minute 31 seconds", 55);
    assert.equal(received.computeTime(8000, 999000), "-16 minutes 31 seconds", 56);
    assert.equal(received.computeTime(8000, 9999000), "-166 minutes 31 seconds", 57);
    assert.equal(received.computeTime(9000, 8500), "0 seconds", 58);
    assert.equal(received.computeTime(8500, 9000), "0 seconds", 59);
});