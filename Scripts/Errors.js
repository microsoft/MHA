/* global StackTrace */
/* exported CleanStack */
/* exported getErrorMessage */
/* exported getErrorStack */
/* exported CleanStack */
/* exported isError */
/* exported parseError */

function getErrorMessage(error) {
    if (!error) return '';
    if (Object.prototype.toString.call(error) === "[object String]") return error;
    if (!isError(error)) return JSON.stringify(error, null, 2);
    if (error.message) return error.message;
    if (error.description) return error.description;
    return JSON.stringify(error, null, 2);
}

function getErrorStack(error) {
    if (!error) return '';
    if (Object.prototype.toString.call(error) === "[object String]") return "string thrown as error";
    if (!isError(error)) return '';
    if (error.stack) return error.stack;
    return '';
}

function isError(error) {
    if (Object.prototype.toString.call(error) === "[object Error]") return true;
    return false;
}

// error - an exception object
// message - a string describing the error
// errorHandler - function to call with parsed error
function parseError(exception, message, errorHandler) {
    var stack;
    var exceptionMessage = getErrorMessage(exception);

    var eventName = joinArray([message, exceptionMessage], ' : ');
    if (!eventName) {
        eventName = "Unknown exception";
    }

    var callback = function (stackframes) {
        stack = FilterStack(stackframes).map(function (sf) {
            return sf.toString();
        });
        errorHandler(eventName, stack);
    };

    var errback = function (err) {
        stack = [JSON.stringify(exception, null, 2), "Parsing error:", JSON.stringify(err, null, 2)];
        errorHandler(eventName, stack);
    };

    if (!isError(exception)) {
        StackTrace.get().then(callback).catch(errback);
    } else {
        StackTrace.fromError(exception).then(callback).catch(errback);
    }
}

// Join an array with char, dropping empty/missing entries
function joinArray(array, char) {
    if (!array) return null;
    return (array.filter(function (item) { return item; })).join(char);
}

function FilterStack(stack) {
    return stack.filter(function (item) {
        if (!item.fileName) return true;
        if (item.fileName.indexOf("stacktrace") !== -1) return false;
        if (item.functionName === "ShowError") return false;
        if (item.functionName === "showError") return false;
        if (item.functionName === "LogError") return false;
        if (item.functionName === "GetStack") return false;
        if (item.functionName === "parseError") return false;
        return true;
    });
}

// Strip stack of rows with unittests.html.
// Only used for unit tests.
function CleanStack(stack) {
    if (!stack) return null;
    return stack.map(function (item) {
        return item.replace(/.*localhost.*/, "")
            .replace(/.*azurewebsites.*/, "")
            .replace(/\n+/, "\n")
            .replace(/^.*?\.(.*)@/, "$1@")
            .replace(/^.*\/<\(\)@http/, "Anonymous function()@http")
            .replace(/{anonymous}/, "Anonymous function")
            .replace(/:\d*$/, "");
    }).filter(function (item) {
        return !!item;
    });
}