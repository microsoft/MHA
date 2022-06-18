module.exports = function (grunt) {
    grunt.initConfig({
        connect: {
            server: {
                options: {
                    port: 44337,
                    base: '.',
                }
            }
        },
        qunit: {
            all: {
                options: {
                    urls: [
                        'http://localhost:44337/Pages/unittests.html'
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-qunit');

    grunt.registerTask('test', ['connect', 'qunit']);
};