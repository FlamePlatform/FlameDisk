'use strict';
var gulp = require("gulp")
var watch = require("gulp-watch")
var babel = require("gulp-babel")
var print = require("gulp-print");
var newer = require('gulp-newer');

gulp.task("watch", function() {
  gulp.src("src/**.js").
  pipe(watch("src/**.js")).
  pipe(babel({
    presets: ["es2015", "stage-0"],
    plugins: ["transform-runtime"]
  })).
  pipe(print(function(file){
    return "built "+file
  })).
  pipe(gulp.dest("dist"))
})

gulp.task("build-all",["build"])

gulp.task("build", function() {
  let dest ="dist";
  return gulp.src("src/**.js").
  pipe(newer(dest)).
  pipe(babel({
    presets: ["es2015", "stage-0"],
    plugins: ["transform-runtime"]
  })).
  pipe(print(function(file){
    return "built "+file
  })).
  pipe(gulp.dest(dest))
})
