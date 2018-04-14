/* global appInsights */
/* global StackTrace */
/* exported LogError */

// TODO: split out as much as possible into unit testable functions
// uiToggle will compose these functions without unit testing

// error - an exception object
// message - a string describing the error
// errorHandler - function to call with parsed error
function parseError(exception, message, errorHandler) {
    var stack;
    var exceptionMessage = exception ? (exception.message ? exception.message : exception.description) : '';
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
        stack = [exception.stack, "Parsing error:", err.message, err.stack];
        errorHandler(eventName, stack);
    };

    if (!exception || Object.prototype.toString.call(exception) === "[object String]") {
        errorHandler(JSON.stringify(exception), null);
        StackTrace.get().then(callback).catch(errback);
    } else {
        StackTrace.fromError(exception).then(callback).catch(errback);
    }
}

// error - an exception object
// message - a string describing the error
// suppressTracking - boolean indicating if we should suppress tracking
function LogError(exception, message, suppressTracking) {
    if (!suppressTracking && exception && Object.prototype.toString.call(exception) !== "[object String]") {
        appInsights.trackException(exception);
    }

    parseError(exception, message, function (eventName, stack) {
        pushError(eventName, stack, suppressTracking);
    });
}

// Join an array with char, dropping empty/missing entries
function joinArray(array, char) {
    if (!array) return null;
    return (array.filter(function (item) { return item; })).join(char);
}

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
        return true;
    });
}