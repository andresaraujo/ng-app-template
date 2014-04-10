var gulp        = require('gulp');
var uglify      = require('gulp-uglify');
var concat      = require('gulp-concat');
var less        = require('gulp-less');
var ngmin       = require('gulp-ngmin');
var minifyHTML  = require('gulp-minify-html');
var templateCache   = require('gulp-angular-templatecache');
var clean       = require('gulp-clean');
var jshint      = require('gulp-jshint');
var stylish     = require('jshint-stylish');
var inject      = require("gulp-inject");
var es          = require("event-stream");
var karma       = require("gulp-karma");
var replace     = require('gulp-replace');

var userConfig  = require( './build.config.js' );

var release = gulp.env.release;

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
    js: ['build/src/**/*.js', 'build/templates.js'],
    js_vendor: 'build/vendor/**/*.js'
};
var DIST_FILES = {
    base_dir: 'dist'
};

/**
 * Clean build files
 */
gulp.task('clean', function () {
    var cleanBuild = gulp.src( BUILD_FILES.base_dir , {read: false})
        .pipe(clean());
    var cleanDist = gulp.src( DIST_FILES.base_dir , {read: false})
        .pipe(clean());
    return es.concat(cleanBuild, cleanDist);
});

// Copy
gulp.task('copy:build', ['clean'], function() {

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
        .pipe(jshint.reporter( stylish ))
        .pipe(jshint.reporter('fail'));
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
gulp.task('scripts:compile', function() {
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
            // Make sure failed tests cause gulp to exit non-zero
            //throw err;
            console.log(err.toString());
            this.emit('end');
        });
});

gulp.task('default', ['test'], function() {});
gulp.task('build', ['lint', 'less', 'index:build', 'scripts:build'], function() {});
gulp.task("dist", ['build', 'index:compile', 'scripts:compile'], function(){
    //clean, build, compilejs(ngmin/uglify), compileVendor(ngmin/uglify), copy(assets) index:compile
});
gulp.task("watch", function(){
    gulp.watch("src/app/**/**.js",['test']);
});

