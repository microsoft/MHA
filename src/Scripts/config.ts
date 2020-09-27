requirejs.config({
    paths: {
        jquery: [
            'https://ajax.aspnetcdn.com/ajax/jQuery/jquery-3.5.1.min',
            '../../node_modules/jquery/dist/jquery.min'
        ],
        moment: [
            'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.27.0/moment.min',
            '../../node_modules/moment/min/moment.min'
        ],
        StackTrace: [
            'https://cdnjs.cloudflare.com/ajax/libs/stacktrace.js/2.0.2/stacktrace-with-promises-and-json-polyfills.min',
            '../../node_modules/stacktrace-js/dist/stacktrace-with-promises-and-json-polyfills.min'
        ],
        ApplicationInsights: [
            'https://az416426.vo.msecnd.net/scripts/b/ai.2.min',
            '../../node_modules/@microsoft/applicationinsights-web/dist/applicationinsights-web.min'
        ],
    }
});

require(["StandAlone"]);