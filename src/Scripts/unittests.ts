requirejs.config({
    paths: {
        QUnit: [
            'https://code.jquery.com/qunit/qunit-2.4.0'
        ],
    }
});
requirejs(['./config', 'QUnit'], function () {
    requirejs([
        'unittests/ut-2047',
        'unittests/ut-antispam',
        'unittests/ut-common',
        'unittests/ut-DateTime',
        'unittests/ut-GetHeaderList',
        'unittests/ut-ParseError',
        'unittests/ut-parseHeaders',
        'unittests/ut-Received',
        'unittests/ut-XML']);
    QUnit.start();
});