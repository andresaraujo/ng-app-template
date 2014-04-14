var gulp            = require('gulp'),
    uglify          = require('gulp-uglify'),
    concat          = require('gulp-concat'),
    less            = require('gulp-less'),
    ngmin           = require('gulp-ngmin'),
    minifyHTML      = require('gulp-minify-html'),
    templateCache   = require('gulp-angular-templatecache'),
    clean           = require('gulp-clean'),
    jshint          = require('gulp-jshint'),
    inject          = require("gulp-inject"),
    es              = require("event-stream"),
    karma           = require("gulp-karma"),
    replace         = require('gulp-replace'),
    gutil           = require('gulp-util'),
    notify          = require("gulp-notify");

var userConfig      = require( './build.config.js' );

var APP_FILES = {
    js: ['src/**/*.js', '!src/**/*_test.js', '!src/assets/**/*.js'],
    jsunit: ['src/**/*._test.js'],
    atpl: ['src/app/**/*.tpl.html'],
    ctpl: ['src/common/**/*.tpl.html'],
    html: ['src/index.html'],
    less: 'src/less/main.less'
};

var BUILD_FILES = {
    base_dir: 'build',
    assets_dir: 'build/assets',
    assets: 'build/assets/**',
    js: ['build/src/**/*.js', 'build/templates.js'],
    js_vendor: 'build/vendor/**/*.js'
};
var DIST_FILES = {
    base_dir: 'dist',
    assets_dir: 'dist/assets'
};

var isWatch = false;

/**
 * Clean build files
 */
gulp.task('clean:build', function () {
    return gulp.src( BUILD_FILES.base_dir , {read: false})
        .pipe(clean());
});
gulp.task('clean:compile', ['build'], function () {
    return gulp.src( DIST_FILES.base_dir , {read: false})
        .pipe(clean());
});

// Copy
gulp.task('copy:build', ['clean:build'], function() {

    var copyApp = gulp.src( APP_FILES.js, { base: './src' } )
        .pipe(gulp.dest('build/src'));

    var copyVendor = gulp.src( userConfig.vendor_files.js, { base: './vendor' } )
        .pipe(gulp.dest('build/vendor'));

    var assets = userConfig.vendor_files.assets.slice();
    assets.push('src/assets/**');

    var copyAssets = gulp.src( assets)
        .pipe(gulp.dest( BUILD_FILES.assets_dir ));

    return es.concat(copyApp, copyVendor, copyAssets);

});
gulp.task('copy:compile', ['clean:compile'], function() {
    return gulp.src( BUILD_FILES.assets)
        .pipe(gulp.dest( DIST_FILES.assets_dir ));
});


var extractJshintErrors = function (file) {
    if (file.jshint.success) {
        // Don't show something if success
        return false;
    }

    var errors = file.jshint.results.map(function (data) {
        if (data.error) {
            return "(" + data.error.line + ':' + data.error.character + ') ' + data.error.reason;
        }
    }).join("\n");
    return file.relative + " (" + file.jshint.results.length + " errors)\n" + errors;
};
/**
 * JShint files
 */
gulp.task('lint', function() {
    return gulp.src( APP_FILES.js )
        .pipe(jshint({
            curly: true,
            immed: true,
            newcap: true,
            noarg: true,
            sub: true,
            boss: true,
            eqnull: true
        }))
        .pipe(notify({title: "Jshint error", message: extractJshintErrors}))
        .pipe(isWatch ? gutil.noop() : jshint.reporter('fail'));
});

gulp.task('less', ['copy:build'], function () {
    return gulp.src( APP_FILES.less )
        .pipe(less({
            strictMath: true,
            sourceMap: false,
            outputSourceFiles: true}))
        .pipe(gulp.dest( BUILD_FILES.assets_dir ));
});

/**
 * Generate build files
 */
gulp.task('scripts:build', ['lint', 'copy:build', 'less'], function() {
    return gulp.src( APP_FILES.atpl )
        .pipe(minifyHTML({
            empty: true,
            spare: true,
            quotes: true
        }))
        .pipe(templateCache('templates.js', {standalone:true}))
        .pipe(gulp.dest( BUILD_FILES.base_dir ));
});

gulp.task('scripts:compile', ['copy:compile'], function() {
    var compileApp = gulp.src( BUILD_FILES.js )
         .pipe(concat("bundle.js"))
         .pipe(ngmin())
         .pipe(uglify())
         .pipe(gulp.dest( DIST_FILES.base_dir ));

    var compileVendors = gulp.src(BUILD_FILES.js_vendor)
        .pipe(concat("bundle_vendor.js"))
        .pipe(ngmin())
        .pipe(uglify())
        .pipe(gulp.dest(DIST_FILES.base_dir));

    return es.concat(compileApp, compileVendors);
});

gulp.task('index:build', ['scripts:build'], function() {
    var appFiles = APP_FILES.js.slice();
    appFiles.push("build/templates.js");

    return gulp.src('./src/index.html')
        .pipe(inject(gulp.src(userConfig.vendor_files.js, {read: false}),
            {starttag: '<!-- inject:vendor:{{ext}} -->', addRootSlash: false}))
        .pipe(inject(gulp.src(appFiles, {read: false}), {addRootSlash: false}))
        .pipe(inject(gulp.src('build/assets/*.css', { read: false}), {addRootSlash: false}))
        .pipe(replace("build/", ""))
        .pipe(gulp.dest('./build'));
});

gulp.task('index:compile', ['scripts:compile'], function() {
    return gulp.src('./src/index.html')
        .pipe(inject(gulp.src('dist/bundle_vendor.js', {read: false}),
            {starttag: '<!-- inject:vendor:{{ext}} -->', addRootSlash: false}))
        .pipe(inject(gulp.src('dist/bundle.js', {read: false}), {addRootSlash: false}))
        .pipe(replace("dist/", ""))
        .pipe(gulp.dest('./dist'));
});

gulp.task('test', ['build'], function() {
    var testFiles = [
        'build/vendor/**/*.js',
        'build/templates.js',
        'vendor/angular-mocks/angular-mocks.js',
        'build/src/app/**/*.js',
        'src/app/**/*_test.js'
    ];
    return gulp.src(testFiles)
        .pipe(karma({
            configFile: 'conf/karma.conf.js',
            action: 'run'
        }))
        .on('error', function(err) {
            // If not watching exit with non zero
            if(!isWatch) throw err;

            this.emit('end');
        });
});

gulp.task('default', ['test'], function() {});
gulp.task('build', ['lint', 'less', 'index:build', 'scripts:build'], function() {});
gulp.task("dist", ['index:compile'], function(){});
gulp.task("watch", ['test'], function(){
    isWatch = true;
    gulp.watch("src/app/**/**.js",['test']);
});

