'use strict';

module.exports = function(grunt) {

    // Load tasks
    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-nodemon');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.initConfig({

        env : {
            options : {
                //Shared Options Hash
            },
            dev : {
                NODE_ENV : 'development'
            },
            test : {
                NODE_ENV : 'test'
            },
            production : {
                NODE_ENV : 'production'
            }
        },

        nodemon: {
            dev: {
                script: 'app.js'
            }
        },

        clean: ["node_modules", "client/components"]
    });

    grunt.registerTask('serverTests', ['env:test', 'mochaTest']);
    grunt.registerTask('test', ['env:test', 'serverTests']);
    grunt.registerTask('dev', ['env:dev', 'nodemon']);
    grunt.registerTask('heroku', ['env:production', 'nodemon']);

};