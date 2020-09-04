/* global appInsights */
/* global StackTrace */
/* exported Errors */

var Errors = (function () {
    var errorArray = [];
    function clear() { errorArray = []; }

    function get() { return errorArray; }

    // Join an array with char, dropping empty/missing entries
    function joinArray(array, char) {
        if (!array) return null;
        return (array.filter(function (item) { return item; })).join(char);
    }

    function add(eventName, stack, suppressTracking) {
        if (eventName || stack) {
            var stackString = Errors.joinArray(stack, "\n");
            errorArray.push(Errors.joinArray([eventName, stackString], "\n"));

            if (!suppressTracking && appInsights) {
                appInsights.trackEvent(eventName,
                    {
                        Stack: stackString,
                        Source: "Errors.add"
                    });
            }
        }
    }

    function isError(error) {
        if (!error) return false;

        // We can't afford to throw while checking if we're processing an error
        // So just swallow any exception and fail.
        try {
            if (Object.prototype.toString.call(error) === "[object Error]") {
                if ("stack" in error) return true;
            }
        } catch (e) {
            if (appInsights) appInsights.trackEvent("isError exception");
            if (appInsights) appInsights.trackEvent("isError exception with error", e);
        }

        return false;
    }

    // error - an exception object
    // message - a string describing the error
    // suppressTracking - boolean indicating if we should suppress tracking
    function log(error, message, suppressTracking) {
        if (error && !suppressTracking && appInsights) {
            var props = {
                Message: message,
                Error: JSON.stringify(error, null, 2)
            };

            if (Errors.isError(error) && error.exception) {
                props.Source = "Error.log Exception";
                appInsights.trackException(error, props);
            }
            else {
                props.Source = "Error.log Event";
                if (error.description) props["Error description"] = error.description;
                if (error.message) props["Error message"] = error.message;
                if (error.stack) props.Stack = error.stack;

                appInsights.trackEvent(error.description || error.message || props.Message || "Unknown error object", props);
            }
        }

        Errors.parse(error, message, function (eventName, stack) {
            Errors.add(eventName, stack, suppressTracking);
        });
    }

    // While trying to get our error tracking under control, let's not filter our stacks
    function filterStack(stack) {
        return stack.filter(function (item) {
            if (!item.fileName) return true;
            if (item.fileName.indexOf("stacktrace") !== -1) return false; // remove stacktrace.js frames
            //if (item.functionName === "ShowError") return false;
            //if (item.functionName === "showError") return false;
            //if (item.functionName === "Errors.log") return false; // Logs with Errors.log in them usually have location where it was called from - keep those
            //if (item.functionName === "GetStack") return false;
            if (item.functionName === "Errors.parse") return false; // Only ever called from Errors.log
            if (item.functionName === "Errors.isError") return false; // Not called from anywhere interesting
            return true;
        });
    }

    // exception - an exception object
    // message - a string describing the error
    // handler - function to call with parsed error
    function parse(exception, message, handler) {
        var stack;
        var exceptionMessage = Errors.getErrorMessage(exception);

        var eventName = Errors.joinArray([message, exceptionMessage], ' : ');
        if (!eventName) {
            eventName = "Unknown exception";
        }

        function callback(stackframes) {
            stack = filterStack(stackframes).map(function (sf) {
                return sf.toString();
            });
            handler(eventName, stack);
        }

        function errback(err) {
            if (appInsights) appInsights.trackEvent("Errors.parse errback");
            stack = [JSON.stringify(exception, null, 2), "Parsing error:", JSON.stringify(err, null, 2)];
            handler(eventName, stack);
        }

        // TODO: Move filter from callbacks into gets
        if (!Errors.isError(exception)) {
            StackTrace.get().then(callback).catch(errback);
        } else {
            StackTrace.fromError(exception).then(callback).catch(errback);
        }
    }

    function getErrorMessage(error) {
        if (!error) return '';
        if (Object.prototype.toString.call(error) === "[object String]") return error;
        if (Object.prototype.toString.call(error) === "[object Number]") return error.toString();
        if ("message" in error) return error.message;
        if ("description" in error) return error.description;
        return JSON.stringify(error, null, 2);
    }

    function getErrorStack(error) {
        if (!error) return '';
        if (Object.prototype.toString.call(error) === "[object String]") return "string thrown as error";
        if (!Errors.isError(error)) return '';
        if ("stack" in error) return error.stack;
        return '';
    }

    return {
        clear: clear,
        get: get,
        joinArray: joinArray,
        add: add,
        isError: isError,
        log: log,
        parse: parse,
        getErrorMessage: getErrorMessage,
        getErrorStack: getErrorStack
    }
})();