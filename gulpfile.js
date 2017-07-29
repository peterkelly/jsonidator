const del = require("del");
const fs = require("fs");
const gulp = require("gulp");
const gulpTslint = require("gulp-tslint");
const merge = require("merge2");
const pegjs = require("gulp-pegjs");
const runSequence = require("run-sequence");
const tslint = require("tslint");
const typescript = require("gulp-typescript");

gulp.task("gen-parser", () => {
    return gulp.src("src/*.pegjs")
        .pipe(pegjs({ format: "commonjs" }))
        .pipe(gulp.dest("dist"));
});

gulp.task("compile", () => {
    const project = typescript.createProject("src/tsconfig.json");
    const tsResult = project.src().pipe(project());
    return merge([
        tsResult.js.pipe(gulp.dest("dist")),
        tsResult.dts.pipe(gulp.dest("dist"))
    ]);
});

gulp.task("tslint", () => {
    const program = tslint.Linter.createProgram("./src/tsconfig.json");
    return gulp.src("src/**/*.ts")
        .pipe(gulpTslint({ program: program, formatter: "verbose" }))
        .pipe(gulpTslint.report())
});

gulp.task("clean", () => {
    return del(["dist", "src/model.js"]);
});

gulp.task("default", (cb) => {
    runSequence("gen-parser", "compile", "tslint", cb);
});
