var gulp = require('gulp');

var jshint = require('gulp-jshint'),
	changed = require('gulp-changed'),
	watch = require('gulp-watch');

gulp.task('default', ['jshint'], function() {
	gulp.watch(['index.js', './src/**/*.js'], function() {
		gulp.run('jshint');
	});
});

gulp.task('jshint', function() {
	gulp.src('./src/**/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter('jshint-stylish'));
});
