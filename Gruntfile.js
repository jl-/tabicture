;'use strict';

module.exports = function(grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);


    grunt.initConfig({
        sass: {
            options: {
                style: 'expended'
            },
            app: {
                files: [{
                    expand: true,
                    cwd: './styles',
                    src: '**/*.scss',
                    dest: './styles',
                    ext: '.css'
                }]
            }
        },
        autoprefixer: {
            options: {
                browsers: ['last 5 version']
            },
            app: {
                files: [{
                    expand: true,
                    cwd: './styles',
                    src: '**/*.css',
                    dest: './styles'
                }]
            }
        },
        connect: {
            options: {
                port: 9003,
                hostname: 'localhost',
                base: './',
                livereload: 35730
            },
            app: {
                options: {
                    open: 'http://localhost:9003'
                }
            }
        },
        watch: {
            options: {
                livereload: '<%= connect.options.livereload %>'
            },
            sass: {
                files: ['./styles/**/*.scss'],
                tasks: ['sass:app']
            },
            css: {
                files: ['./styles/**/*.css'],
                tasks: ['newer:autoprefixer:app']
            },
            html: {
                files: ['./**/*.html']
            },
            js: {
                files: ['./scripts/**/*.js']
            }
        }
    });

    grunt.registerTask('app', 'grunt:app', function(target) {
        grunt.task.run([
            'connect' + (target? ':' + target : ''),
            'watch'
        ]);
    });
    grunt.registerTask('build', 'grunt:build', function() {
        grunt.task.run([
            'useminPrepare',
            'concat:adminJs',
            'uglify:admin',
            'concat:indexJs',
            'uglify:index',
            'usemin'
        ]);
    });





};