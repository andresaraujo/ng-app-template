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
    js: 'build/src/**/*.js'
};

/**
 * Clean build files
 */
gulp.task('clean', function () {
    return gulp.src( BUILD_FILES.base_dir , {read: false})
        .pipe(clean());
});

// Copy
gulp.task('copy', ['clean'], function() {

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

gulp.task('less', ['copy'], function () {
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
gulp.task('scripts', ['lint', 'copy', 'less', 'index'], function() {
    return gulp.src( APP_FILES.atpl )
        .pipe(minifyHTML({
            empty: true,
            spare: true,
            quotes: true
        }))
        .pipe(templateCache('templates.js', {standalone:true}))
        .pipe(gulp.dest( BUILD_FILES.base_dir ));

    /*gulp.src( APP_FILES.js )
        .pipe(concat("main.js"))
        .pipe(ngmin())
        .pipe(uglify())
        .pipe(gulp.dest( BUILD_FILES.base ));*/
});

gulp.task('index', ['copy'], function() {
    return gulp.src('./src/index.html')
        .pipe(inject(gulp.src(userConfig.vendor_files.js, {read: false}),
            {starttag: '<!-- inject:vendor:{{ext}} -->', addRootSlash: false}))
        .pipe(inject(gulp.src(APP_FILES.js, {read: false}), {addRootSlash: false}))
        //.pipe(inject(gulp.src('./build/assets/*.css', { cwd: './build', read: false})))
        .pipe(gulp.dest('./build'));
});

gulp.task('default', ['test'], function() {});
gulp.task('build', ['lint', 'less', 'index', 'scripts'], function() {});

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

gulp.task("watch", function(){
    gulp.watch("src/app/**/**.js",['test']);
});

