export function getErrorMessage(error) {
    if (!error) return "";
    if (Object.prototype.toString.call(error) === "[object String]") return error;
    if (Object.prototype.toString.call(error) === "[object Number]") return error.toString();
    if ("message" in error) return error.message;
    if ("description" in error) return error.description;
    return JSON.stringify(error, null, 2);
}

export function getErrorStack(error) {
    if (!error) return "";
    if (Object.prototype.toString.call(error) === "[object String]") return "string thrown as error";
    if (!isError(error)) return "";
    if ("stack" in error) return error.stack;
    return "";
}

export function isError(error) {
    if (Object.prototype.toString.call(error) === "[object Error]") {
        if ("stack" in error) return true;
    }
    return false;
}

// error - an exception object
// message - a string describing the error
// errorHandler - function to call with parsed error
export function parseError(exception, message, errorHandler) {
    let stack;
    const exceptionMessage = getErrorMessage(exception);

    let eventName = joinArray([message, exceptionMessage], " : ");
    if (!eventName) {
        eventName = "Unknown exception";
    }

    const callback = function (stackframes) {
        stack = FilterStack(stackframes).map(function (sf) {
            return sf.toString();
        });
        errorHandler(eventName, stack);
    };

    const errback = function (err) {
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
export function joinArray(array, char) {
    if (!array) return null;
    return (array.filter(function (item) { return item; })).join(char);
}

export function FilterStack(stack) {
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