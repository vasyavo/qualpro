/**
 * http://gruntjs.com/configuring-tasks
 */
module.exports = function (grunt) {
	// Project configuration.
	grunt.initConfig({
		jsdoc: {
			dist: {
				src    : ['src/handlers/**/*.js', 'src/routes/**/*.js', 'src/models/**/*.js'],
				options: {
					destination: 'src/public/documentation',
					//template   : "node_modules/grunt-jsdoc/node_modules/ink-docstrap/template",
					configure  : ".jsdoc"
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-jsdoc');

	grunt.registerTask('default', ['jsdoc']);
};
