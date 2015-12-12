var gulp = require("gulp")
var watch = require("gulp-watch")
var babel = require("gulp-babel")
var print = require("gulp-print");


gulp.task("build", function() {
  return gulp.src("src/**.js").
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
