requirejs(['./config'], function () {
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
});