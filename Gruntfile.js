/**
 * http://gruntjs.com/configuring-tasks
 */
module.exports = function (grunt) {
	// Project configuration.
	grunt.initConfig({
		jsdoc: {
			dist: {
				src    : ['handlers/**/*.js', 'routes/**/*.js', 'models/**/*.js'],
				options: {
					destination: 'public/documentation',
					//template   : "node_modules/grunt-jsdoc/node_modules/ink-docstrap/template",
					configure  : ".jsdoc"
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-jsdoc');

	grunt.registerTask('default', ['jsdoc']);
};
