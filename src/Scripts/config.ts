requirejs.config({
    paths: {
        moment: [
            'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.27.0/moment.min',
            '../../node_modules/moment/min/moment.min'
        ],
        StackTrace: [
            'https://cdnjs.cloudflare.com/ajax/libs/stacktrace.js/2.0.2/stacktrace-with-promises-and-json-polyfills.min',
            '../../node_modules/stacktrace-js/dist/stacktrace-with-promises-and-json-polyfills.min'
        ]
    }
});

require(["StandAlone"]);