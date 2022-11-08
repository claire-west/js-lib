module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      pre: {
        src: ['build', 'util/js/preload.min.js']
      },
      post:  {
        src: ['build']
      }
    },
    uglify: {
      files: {
        expand: true,
        cwd: 'util',
        src: 'js/*.js',
        dest: 'build'
      }
    },
    build_preload: {
      options: {
        dest: 'util/js',
        namespace: 'lib'
      },
      files: {
        cwd: 'build',
        src: 'js/*',
        expand: true
      }
    }
  });

  grunt.loadTasks('./grunt');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('default', ['clean:pre', 'uglify', 'build_preload', 'clean:post']);
};