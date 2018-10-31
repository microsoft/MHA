/* global computeTime */
/* global QUnit */
/* global ReceivedRow */
/* global dateString */

QUnit.test("DateTime Tests", function (assert) {
    QUnit.assert.datesEqual = function (value, expected, message) {
        return assert.propEqual({ date: value.date, dateNum: value.dateNum, dateSort: value.dateSort }, expected, message);
    };

    assert.datesEqual(new ReceivedRow("Received: test; Sat, 21 Apr 2018 03:01:32 +0000"), {
        "date": dateString("21 Apr 2018 03:01:32 +0000"), "dateNum": 1524279692000, "dateSort": 1524279692000,
    }, 1);
    assert.datesEqual(new ReceivedRow("Received: test; Saturday, 21 Apr 2018 03:01:32 +0000"), {
        "date": dateString("21 Apr 2018 03:01:32 +0000"), "dateNum": 1524279692000, "dateSort": 1524279692000,
    }, 2);
    assert.datesEqual(new ReceivedRow("Received: test; 21 Apr 2018 03:01:32 +0000"), {
        "date": dateString("21 Apr 2018 03:01:32 +0000"), "dateNum": 1524279692000, "dateSort": 1524279692000,
    }, 3);
    assert.datesEqual(new ReceivedRow("Received: test; Apr 21 2018 03:01:32 +0000"), {
        "date": dateString("21 Apr 2018 03:01:32 +0000"), "dateNum": 1524279692000, "dateSort": 1524279692000,
    }, 4);
    assert.datesEqual(new ReceivedRow("Received: test; Apr 21 2018 3:01:32 +0000"), {
        "date": dateString("21 Apr 2018 03:01:32 +0000"), "dateNum": 1524279692000, "dateSort": 1524279692000,
    }, 5);
    assert.datesEqual(new ReceivedRow("Received: test; 4/20/2018 23:01:32 -0400 (EDT)"), {
        "date": dateString("21 Apr 2018 03:01:32 +0000"), "dateNum": 1524279692000, "dateSort": 1524279692000,
    }, 6);
    assert.datesEqual(new ReceivedRow("Received: test; 4/20/2018 11:01:32 PM -0400 (EDT)"), {
        "date": dateString("21 Apr 2018 03:01:32 +0000"), "dateNum": 1524279692000, "dateSort": 1524279692000,
    }, 6.1);
    assert.datesEqual(new ReceivedRow("Received: test; 4/20/2018 11:01:32 PM +0000"), {
        "date": dateString("20 Apr 2018 23:01:32 +0000"), "dateNum": 1524265292000, "dateSort": 1524265292000,
    }, 6.2);
    assert.datesEqual(new ReceivedRow("Received: test; 4/20/2018 11:01:32 PM"), {
        "date": dateString("20 Apr 2018 23:01:32 +0000"), "dateNum": 1524265292000, "dateSort": 1524265292000,
    }, 6.3);
    assert.datesEqual(new ReceivedRow("Received: test; 4-20-2018 11:01:32 PM"), {
        "date": dateString("20 Apr 2018 23:01:32 +0000"), "dateNum": 1524265292000, "dateSort": 1524265292000,
    }, 7);
    assert.datesEqual(new ReceivedRow("Received: test; 2018-4-20 11:01:32 PM"), {
        "date": dateString("20 Apr 2018 23:01:32 +0000"), "dateNum": 1524265292000, "dateSort": 1524265292000,
    }, 8);
    assert.datesEqual(new ReceivedRow("Received: test; Mon, 26 Mar 2018 13:35:36 +0000 (UTC)"), {
        "date": dateString("26 Mar 2018 13:35:36 +0000"), "dateNum": 1522071336000, "dateSort": 1522071336000
    }, 9);
    assert.datesEqual(new ReceivedRow("Received: test; Mon, 26 Mar 2018 13:35:36.102 +0000 (UTC)"), {
        "date": dateString("26 Mar 2018 13:35:36 +0000"), "dateNum": 1522071336102, "dateSort": 1522071336102
    }, 10);
    assert.datesEqual(new ReceivedRow("Received: test; Mon, 26 Mar 2018 13:35:36.102 +0000 UTC"), {
        "date": dateString("26 Mar 2018 13:35:36 +0000"), "dateNum": 1522071336102, "dateSort": 1522071336102
    }, 11);

    assert.equal(computeTime(9000, 8000), "1 second", 50);
    assert.equal(computeTime(99000, 8000), "1 minute 31 seconds", 51);
    assert.equal(computeTime(999000, 8000), "16 minutes 31 seconds", 52);
    assert.equal(computeTime(9999000, 8000), "166 minutes 31 seconds", 53);
    assert.equal(computeTime(8000, 9000), "-1 second", 54);
    assert.equal(computeTime(8000, 99000), "-1 minute 31 seconds", 55);
    assert.equal(computeTime(8000, 999000), "-16 minutes 31 seconds", 56);
    assert.equal(computeTime(8000, 9999000), "-166 minutes 31 seconds", 57);
    assert.equal(computeTime(9000, 8500), "0 seconds", 58);
    assert.equal(computeTime(8500, 9000), "0 seconds", 59);
});