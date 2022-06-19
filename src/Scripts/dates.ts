import * as dayjs from "dayjs";
import * as localizedFormat from "dayjs/plugin/localizedFormat";

export const mhaDates = (function () {
    "use strict";

    dayjs.extend(localizedFormat);

    // parse date using moment, with fallback to browser based parsing
    function parseDate(date) {
        // Cross browser dates - ugh!
        // http://dygraphs.com/date-formats.html

        // Invert any backwards dates: 2018-01-28 -> 01-28-2018
        // moment can handle these, but inverting manually makes it easier for the dash replacement
        date = date.replace(/\s*(\d{4})-(\d{1,2})-(\d{1,2})/g, "$2/$3/$1");
        // Replace dashes with slashes
        date = date.replace(/\s*(\d{1,2})-(\d{1,2})-(\d{4})/g, "$1/$2/$3");

        // If we don't have a +xxxx or -xxxx on our date, it will be interpreted in local time
        // This likely isn't the intended timezone, so we add a +0000 to get UTC
        const offset = date.match(/[+|-]\d{4}/);
        const originalDate = date;
        let offsetAdded = false;
        if (!offset || offset.length !== 1) {
            date += " +0000";
            offsetAdded = true;
        }

        // Some browsers don't like milliseconds in dates, and moment doesn't hide that from us
        // Trim off milliseconds so we don't pass them into moment
        const milliseconds = date.match(/\d{1,2}:\d{2}:\d{2}.(\d+)/);
        date = date.replace(/(\d{1,2}:\d{2}:\d{2}).(\d+)/, "$1");

        if (dayjs) {
            // And now we can parse our date
            let time = dayjs(date);

            // If adding offset didn't work, try adding time and offset
            if (!time.isValid() && offsetAdded) { time = dayjs(originalDate + " 12:00:00 AM +0000"); }
            if (milliseconds && milliseconds.length >= 2) {
                time = time.add(Math.floor(parseFloat("0." + milliseconds[1]) * 1000), 'ms');
            }

            return {
                dateNum: time.valueOf(),
                date: time.format("l LTS"),
                toString: function () { return date; }
            };
        }
        else {
            let dateNum = Date.parse(date);
            if (milliseconds && milliseconds.length >= 2) {
                dateNum = dateNum + Math.floor(parseFloat("0." + milliseconds[1]) * 1000);
            }

            return {
                dateNum: dateNum,
                date: new Date(dateNum).toLocaleString().replace(/\u200E|,/g, ""),
                toString: function () { return date; }
            };
        }
    }

    return {
        parseDate: parseDate
    };
})();