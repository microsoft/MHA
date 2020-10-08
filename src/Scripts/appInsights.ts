import * as $ from "jquery";
import { ApplicationInsights } from "ApplicationInsights"
import * as StackTrace from "StackTrace";
import { aikey } from "../aikey";
import Diagnostics from "./diag";

// app Insights initialization
const appInsights = new ApplicationInsights({
    config: {
        instrumentationKey: aikey
    }
});

appInsights.loadAppInsights();
appInsights.addTelemetryInitializer(function (envelope) {
    envelope.data.baseType = envelope.baseType;
    envelope.data.baseData = envelope.baseData;
    // This will get called for any appInsights tracking - we can augment or suppress logging from here
    // No appInsights logging for localhost/dev
    const doLog = (document.domain !== "localhost");
    if (envelope.baseType === "RemoteDependencyData") return doLog;
    if (envelope.baseType === "PageviewData") return doLog;
    if (envelope.baseType === "PageviewPerformanceData") return doLog;

    // If we're not one of the above types, tag in our diagnostics data
    if (envelope.baseType === "ExceptionData") {
        // custom data for the ExceptionData type lives in a different place
        envelope.baseData.properties = envelope.baseData.properties || {};
        $.extend(envelope.baseData.properties, Diagnostics.get());
        // Log an extra event with parsed stack frame
        if (envelope.baseData.exceptions.length) {
            StackTrace.fromError(envelope.baseData.exceptions[0]).then(function (stackframes) {
                appInsights.trackEvent("Exception Details", {
                    stack: stackframes,
                    error: envelope.baseData.exceptions[0]
                });
            });
        }
    }
    else {
        $.extend(envelope.data, Diagnostics.get());
    }

    return doLog;
});

appInsights.trackPageView(); // Manually call trackPageView to establish the current user/session/pageview

export default appInsights;