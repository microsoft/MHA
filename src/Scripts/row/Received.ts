import { ImportedStrings } from "../Strings";

//#region ReceivedRow Class Definition

// Builds array of values for each header in receivedHeaderNames.
// This algorithm should work regardless of the order of the headers, given:
//  - The date, if present, is always at the end, separated by a ";".
// Values not attached to a header will not be reflected in output.
export const ReceivedRow = function ( receivedHeader )
{
    this.sourceHeader = receivedHeader;

    // Some bad dates don't wrap UTC in paren - fix that first
    receivedHeader = receivedHeader.replace( /UTC|\(UTC\)/g, "(UTC)" );

    // Removes the date information from the receivedHeader string and puts values
    // in date and dateSort variables
    receivedHeader = extractDatesFromHeader ( receivedHeader, this );

    let possibleHeaderNames = ["from", "by", "with", "id", "for", "via"];

    // Scan for malformed postFix headers
    // Received: by example.com (Postfix, from userid 1001)
    //   id 1234ABCD; Thu, 21 Aug 2014 12:12:48 +0200 (CEST)
    let postFix = receivedHeader.match( /(.*)by (.*? \(Postfix, from userid .*?\))(.*)/ );
    if ( postFix )
    {
        this["by"] = postFix[2];
        receivedHeader = postFix[1] + postFix[3];
        possibleHeaderNames = RemoveEntry( possibleHeaderNames, "by" );
    }

    // Scan for malformed qmail headers
    // Received: (qmail 10876 invoked from network); 24 Aug 2014 16:13:38 -0000
    postFix = receivedHeader.match( /(.*)\((qmail .*? invoked from .*?)\)(.*)/ );
    if ( postFix )
    {
        this["by"] = postFix[2];
        receivedHeader = postFix[1] + postFix[3];
        possibleHeaderNames = RemoveEntry( possibleHeaderNames, "by" );
    }

    // Split up the string now so we can look for our headers
    const tokens = receivedHeader.split( /\s+/ );

    const headerNameMatches = getSortedHeaderMatches( possibleHeaderNames, tokens );

    setRowHeaderNames (headerNameMatches, tokens, possibleHeaderNames, this);

    this.delaySort = -1; // Force the "no previous or current time" rows to sort before the 0 second rows
    this.percent = 0;

    function extractDatesFromHeader ( receivedHeader, thisObject )
    {
        // Read out the date first, then clear it from the string
        let iDate = receivedHeader.lastIndexOf( ";" );

        // No semicolon means no date - or maybe there's one there?
        // Sendgrid is bad about this
        if ( iDate === -1 )
        {
            // First try to find a day of the week
            receivedHeader = receivedHeader.replace( /\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/g, "; $1" );
            iDate = receivedHeader.lastIndexOf( ";" );
        }

        if ( iDate === -1 )
        {
            // Next we look for year-month-day
            receivedHeader = receivedHeader.replace( /\s*(\d{4}-\d{1,2}-\d{1,2})/g, "; $1" );
            iDate = receivedHeader.lastIndexOf( ";" );
        }

        if ( iDate !== -1 )
        {
            thisObject.date = receivedHeader.substring( iDate + 1 );
            receivedHeader = receivedHeader.substring( 0, iDate );

            // Invert any backwards dates: 2018-01-28 -> 01-28-2018
            thisObject.date = thisObject.date.replace( /\s*(\d{4})-(\d{1,2})-(\d{1,2})/g, "$2/$3/$1" );
            // Replace dashes with slashes
            thisObject.date = thisObject.date.replace( /\s*(\d{1,2})-(\d{1,2})-(\d{4})/g, "$1/$2/$3" );

            // If we don't have a +xxxx or -xxxx on our date, it will be interpreted in local time
            // This likely isn't the intended timezone, so we add a +0000 to get UTC
            const offset = thisObject.date.match( /[+|-]\d{4}/ );
            if ( !offset || offset.length != 1 )
            {
                thisObject.date += " +0000";
            }

            // Some browsers don't like milliseconds in parse
            // Trim off milliseconds so we don't pass them into Date.parse
            const milliseconds = thisObject.date.match( /\d{1,2}:\d{2}:\d{2}.(\d+)/ );
            const trimDate = thisObject.date.replace( /(\d{1,2}:\d{2}:\d{2}).(\d+)/, "$1" );

            // And now we can parse our date
            thisObject.dateNum = Date.parse( trimDate );
            if ( milliseconds && milliseconds.length >= 2 )
            {
                thisObject.dateNum = thisObject.dateNum + Math.floor( parseFloat( "0." + milliseconds[1] ) * 1000 );
            }

            thisObject.date = new Date( trimDate ).toLocaleString().replace( /\u200E|,/g, "" );
            thisObject.dateSort = thisObject.dateNum;
        }

        return receivedHeader;
    }

    function setRowHeaderNames( headerNameMatches, tokens, possibleHeaderNames, receivedRow )
    {
        headerNameMatches.forEach( function ( headerMatch, iMatch )
        {
            let iNextTokenHeader;
            if ( iMatch + 1 < headerNameMatches.length )
            {
                iNextTokenHeader = headerNameMatches[iMatch + 1].iToken;
            }
            else
            {
                iNextTokenHeader = tokens.length;
            }
            const headerName = possibleHeaderNames[headerMatch.iHeader];
            if ( this[headerName] === undefined )
            {
                this[headerName] = "";
            }
            if ( this[headerName] !== "" )
            {
                this[headerName] += "; ";
            }
            this[headerName] += tokens.slice( headerMatch.iToken + 1, iNextTokenHeader ).join( " " ).trim();
        }, receivedRow );
    }

    function getSortedHeaderMatches ( headerNames, tokens )
    {
        const headerMatches = [];
        let iMatch = 0;

        headerNames.forEach( function ( receivedHeaderName, iHeader )
        {
            tokens.some( function ( token, iToken )
            {
                if ( receivedHeaderName === token )
                {
                    headerMatches[iMatch++] = { iHeader: iHeader, iToken: iToken };
                    // We don't return true so we can match any duplicate headers
                    // In doing this, we risk failing to parse a string where a header
                    // keyword appears as the value for another header
                    // Both situations are invalid input
                    // We're just picking which one we'd prefer to handle
                }
            } );
        } );

        // Next bit assumes headerMatches[x,y] is increasing on y.
        // Sort it so it is.
        headerMatches.sort( function ( a, b ) { return a.iToken - b.iToken; } );

        return headerMatches;
    }
};

function RemoveEntry( stringArray, entry )
{
    const i = stringArray.indexOf( entry );
    if ( i >= 0 )
    {
        stringArray.splice( i, 1 );
    }

    return stringArray;
}

//#endregion Received Row Class Definition

//#region Received Class Definition

export const Received = function () {
    this.receivedRows = [];
};

Received.prototype.tableName = "receivedHeaders";
Received.prototype.receivedRows = [];
Received.prototype.sortColumn = "hop";
Received.prototype.sortOrder = 1;

Received.prototype.exists = function () {
    return this.receivedRows.length > 0;
};

Received.prototype.doSort = function (col) {
    const that = this;
    if (this.sortColumn === col) {
        this.sortOrder *= -1;
    } else {
        this.sortColumn = col;
        this.sortOrder = 1;
    }

    if (this.sortColumn + "Sort" in this.receivedRows[0]) {
        col = col + "Sort";
    }

    this.receivedRows.sort(function (a, b) {
        return that.sortOrder * (a[col] < b[col] ? -1 : 1);
    });
};

Received.prototype.init = function (receivedHeader) {
    this.receivedRows.push(new ReceivedRow(receivedHeader));
};

Received.prototype.computeDeltas = function () {
    // Process received headers in reverse order
    this.receivedRows.reverse();

    // Parse rows and compute values needed for the "Delay" column
    let iStartTime = 0;
    let iEndTime = 0;
    let iLastTime = NaN;
    let iDelta = 0; // This will be the sum of our positive deltas

    this.receivedRows.forEach(function (row) {
        if (!isNaN(row.dateNum)) {
            if (!isNaN(iLastTime) && iLastTime < row.dateNum) {
                iDelta += row.dateNum - iLastTime;
            }

            iStartTime = iStartTime || row.dateNum;
            iEndTime = row.dateNum;
            iLastTime = row.dateNum;
        }
    });

    calculateRowPercentages( this.receivedRows, iDelta );

    // Total time is still last minus first, even if negative.
    return iEndTime !== iStartTime ? computeTime(iEndTime, iStartTime) : "";

    function calculateRowPercentages( rows, iDelta )
    {
        let iLastTime = NaN;

        rows.forEach( function ( row, index )
        {
            row.hop = index + 1;
            row.delay = computeTime( row.dateNum, iLastTime );

            if ( !isNaN( row.dateNum ) && !isNaN( iLastTime ) && iDelta !== 0 )
            {
                row.delaySort = row.dateNum - iLastTime;
                // Only positive delays will get percentage bars. Negative delays will be color coded at render time.
                if ( row.delaySort > 0 )
                {
                    row.percent = 100 * row.delaySort / iDelta;
                }
            }

            if ( !isNaN( row.dateNum ) )
            {
                iLastTime = row.dateNum;
            }
        } );
    }
};

//#endregion Received Class Definition

// Computes min/sec from the diff of current and last.
// Returns nothing if last or current is NaN.
function computeTime(current, last) {
    const time = [];

    if (isNaN(current) || isNaN(last)) { return ""; }
    let diff = current - last;
    let iDelay;
    let printedMinutes = false;

    if (Math.abs(diff) < 1000) {
        return "0 " + ImportedStrings.mha_seconds;
    }

    if (diff < 0) {
        time.push(ImportedStrings.mha_negative);
        diff = -diff;
    }

    if (diff >= 1000 * 60) {
        iDelay = Math.floor(diff / 1000 / 60);
        time.push(iDelay, " ");
        if (iDelay === 1) {
            time.push(ImportedStrings.mha_minute);
        } else {
            time.push(ImportedStrings.mha_minutes);
        }

        diff -= iDelay * 1000 * 60;
        printedMinutes = true;
    }

    if (printedMinutes && diff) {
        time.push(" ");
    }

    if (!printedMinutes || diff) {
        iDelay = Math.floor(diff / 1000);
        time.push(iDelay, " ");
        if (iDelay === 1) {
            time.push(ImportedStrings.mha_second);
        } else {
            time.push(ImportedStrings.mha_seconds);
        }
    }

    return time.join("");
}

function dateString( value ) { return new Date( value ).toLocaleString().replace( /\u200E|,/g, "" ); }
