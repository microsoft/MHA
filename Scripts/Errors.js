/* global appInsights */
/* global StackTrace */
/* exported LogError */

function getErrorMessage(error) {
    if (!error) return '';
    if (Object.prototype.toString.call(error) === "[object String]") return error;
    if (error.message) return error.message;
    if (error.description) return error.description;
    return JSON.stringify(error, null, 2);
}

function getErrorStack(error) {
    if (!error) return '';
    if (Object.prototype.toString.call(error) === "[object String]") return "string thrown as error";
    if (error.stack) return error.stack;
    return '';
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
        stack = [getErrorStack(exception), "Parsing error:", getErrorMessage(err), getErrorStack(err)];
        errorHandler(eventName, stack);
    };

    if (!exception || Object.prototype.toString.call(exception) === "[object String]") {
        StackTrace.get().then(callback).catch(errback);
    } else {
        StackTrace.fromError(exception).then(callback).catch(errback);
    }
}

// error - an exception object
// message - a string describing the error
// suppressTracking - boolean indicating if we should suppress tracking
function LogError(error, message, suppressTracking) {
    if (!suppressTracking && error && Object.prototype.toString.call(error) !== "[object String]") {
        appInsights.trackException(error);
    }

    parseError(error, message, function (eventName, stack) {
        pushError(eventName, stack, suppressTracking);
    });
}

// Join an array with char, dropping empty/missing entries
function joinArray(array, char) {
    if (!array) return null;
    return (array.filter(function (item) { return item; })).join(char);
}

// TODO: Move viewModel and getDiagnosticsMap back to uiToggle.js
function pushError(eventName, stack, suppressTracking) {
    if (eventName || stack) {
        var stackString = joinArray(stack, '\n');
        viewModel.errors.push(joinArray([eventName, stackString], '\n'));

        if (!suppressTracking) {
            var props = getDiagnosticsMap();
            props["Stack"] = stackString;
            appInsights.trackEvent(eventName, props);
        }
    }
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