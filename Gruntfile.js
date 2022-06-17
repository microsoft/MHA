module.exports = function(grunt) {
    grunt.initConfig({
        qunit: {
            all:['Pages/unittests.html'],
            options:{
                force: true,
                tiemout: 20000,
            }
        },
    });
  
    grunt.loadNpmTasks('grunt-contrib-qunit');
};