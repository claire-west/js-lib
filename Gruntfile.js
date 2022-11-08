module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: ['build', 'util/js/preload.min.js'],
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
  grunt.registerTask('default', ['clean', 'uglify', 'build_preload']);
};