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
        codepage: [
            'https://unpkg.com/codepage@1.14.0/dist/sbcs.full',
            '../../node_modules/codepage/dist/sbcs.full'
        ],
        codepage936: [
            'https://unpkg.com/codepage@1.14.0/bits/936',
            '../../node_modules/codepage/bits/936'
        ],
        codepage51949: [
            'https://unpkg.com/codepage@1.14.0/bits/51949',
            '../../node_modules/codepage/bits/51949'
        ],
        fabric: [
            'https://static2.sharepointonline.com/files/fabric/office-ui-fabric-js/1.5.0/js/fabric.min',
            '../../node_modules/office-ui-fabric-js/dist/js/fabric.min'
        ]
    }
});