/* global computeTime */
/* global QUnit */
/* global ReceivedRow */

QUnit.test("DateTime Tests", function (assert) {
    QUnit.assert.datesEqual = function (value, expected, message) {
        return assert.propEqual({ date: value.date, dateNum: value.dateNum, dateSort: value.dateSort }, expected, message);
    };

    assert.datesEqual(new ReceivedRow("Received: test; Sat, 21 Apr 2018 03:01:32 +0000"), {
        "date": "4/20/2018 11:01:32 PM", "dateNum": 1524279692000, "dateSort": 1524279692000,
    });
    assert.datesEqual(new ReceivedRow("Received: test; Saturday, 21 Apr 2018 03:01:32 +0000"), {
        "date": "4/20/2018 11:01:32 PM", "dateNum": 1524279692000, "dateSort": 1524279692000,
    });
    assert.datesEqual(new ReceivedRow("Received: test; 21 Apr 2018 03:01:32 +0000"), {
        "date": "4/20/2018 11:01:32 PM", "dateNum": 1524279692000, "dateSort": 1524279692000,
    });
    assert.datesEqual(new ReceivedRow("Received: test; Apr 21 2018 03:01:32 +0000"), {
        "date": "4/20/2018 11:01:32 PM", "dateNum": 1524279692000, "dateSort": 1524279692000,
    });
    assert.datesEqual(new ReceivedRow("Received: test; Apr 21 2018 3:01:32 +0000"), {
        "date": "4/20/2018 11:01:32 PM", "dateNum": 1524279692000, "dateSort": 1524279692000,
    });
    assert.datesEqual(new ReceivedRow("Received: test; 4/20/2018 11:01:32 PM"), {
        "date": "4/20/2018 11:01:32 PM", "dateNum": 1524279692000, "dateSort": 1524279692000,
    });
    assert.datesEqual(new ReceivedRow("Received: test; 4-20-2018 11:01:32 PM"), {
        "date": "4/20/2018 11:01:32 PM", "dateNum": 1524279692000, "dateSort": 1524279692000,
    });
    assert.datesEqual(new ReceivedRow("Received: test; 2018-4-20 11:01:32 PM"), {
        "date": "4/20/2018 11:01:32 PM", "dateNum": 1524279692000, "dateSort": 1524279692000,
    });
    assert.datesEqual(new ReceivedRow("Received: test; Mon, 26 Mar 2018 13:35:36 +0000 (UTC)"), {
        "date": "3/26/2018 9:35:36 AM", "dateNum": 1522071336000, "dateSort": 1522071336000
    });
    assert.datesEqual(new ReceivedRow("Received: test; Mon, 26 Mar 2018 13:35:36.102 +0000 (UTC)"), {
        "date": "3/26/2018 9:35:36 AM", "dateNum": 1522071336102, "dateSort": 1522071336102
    });
    assert.datesEqual(new ReceivedRow("Received: test; Mon, 26 Mar 2018 13:35:36.102 +0000 UTC"), {
        "date": "3/26/2018 9:35:36 AM", "dateNum": 1522071336102, "dateSort": 1522071336102
    });

    assert.equal(computeTime(9000, 8000), "1 second");
    assert.equal(computeTime(99000, 8000), "1 minute 31 seconds");
    assert.equal(computeTime(999000, 8000), "16 minutes 31 seconds");
    assert.equal(computeTime(9999000, 8000), "166 minutes 31 seconds");
    assert.equal(computeTime(8000, 9000), "-1 second");
    assert.equal(computeTime(8000, 99000), "-1 minute 31 seconds");
    assert.equal(computeTime(8000, 999000), "-16 minutes 31 seconds");
    assert.equal(computeTime(8000, 9999000), "-166 minutes 31 seconds");
    assert.equal(computeTime(9000, 8500), "0 seconds");
    assert.equal(computeTime(8500, 9000), "0 seconds");
});