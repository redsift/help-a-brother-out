'use strict';
               
var gulp = require('gulp');
var browserSync = require('browser-sync').create();

var fs = require('fs'),
    del = require('del'),
    crypto = require('crypto'),
    url = require('url'),
    path = require('path');

var expect = require('gulp-expect-file'),
    htmllint = require('gulp-htmllint'),
    gulpif = require('gulp-if'),
    jsonlint = require('gulp-jsonlint'),
    nunjucksRender = require('gulp-nunjucks-render'),
    plumber = require('gulp-plumber'),
    postcss = require('gulp-postcss'),
    rename = require('gulp-rename'),
    sourcemaps = require('gulp-sourcemaps'),
    stylus = require('gulp-stylus'),
    minifyCss = require('gulp-cleancss'),
    autoprefixer = require('gulp-autoprefixer'),    
    uglify = require('gulp-uglify'),
    gutil = require('gulp-util'),
    buffer = require('vinyl-buffer'),
    source = require('vinyl-source-stream'),
    s3 = require('vinyl-s3'),
    merge = require('merge-stream'),
    runSequence = require('run-sequence'); // temporary use of run-sequence until Gulp 4.0

var rollup = require('rollup-stream'),
    buble = require('rollup-plugin-buble'),
    commonjs = require('rollup-plugin-commonjs'),
    json = require('rollup-plugin-json'),
    nodeResolve = require('rollup-plugin-node-resolve'),
    string = require('rollup-plugin-string');

var options = {
    plumb: true
};

gulp.task('clean', () => del([ 'distribution/**' ]));  

gulp.task('static', function() {
    return gulp.src('static/*.+(jpg|svg|webp)').pipe(gulp.dest('distribution/'));
});

gulp.task('html', function() {
    return gulp.src([ 'templates/index.nunjucks' ])
                .pipe(gulpif(options.plumb, plumber()))
                .pipe(nunjucksRender({
                    path: ['templates']
                }))
                .pipe(htmllint({ config: '.htmllintrc' }))
                .pipe(gulp.dest('distribution'));
        
});


gulp.task('css', () => {
  return gulp.src('style/index.styl')
    .pipe(gulpif(options.plumb, plumber()))
    .pipe(stylus({
      include: __dirname + '/node_modules'
    }))
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('distribution/'))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(minifyCss({
      compatibility: '*',
      roundingPrecision: 4,
      keepSpecialComments: 0
    }))
    .pipe(sourcemaps.write('.'))    
    .pipe(gulp.dest('distribution/'));
});

gulp.task('umd', () => {  
  return rollup({
            moduleName: 'index',
            globals: [],
            entry: 'index.js',
            format: 'umd',
            sourceMap: true,
            plugins: [ 
                        json({
                            include: [ '**/package.json', '**/configuration.json' , 'node_modules/**/*.json' ], 
                            exclude: [  ]
                        }),
                        string({
                            include: [ '**/*.tmpl' ]
                        }),
                        nodeResolve({
                            skip: [],
                            jsnext: true
                        }),
                        commonjs(), 
                        buble() 
                        ]
        })
        .pipe(source('index.js', 'src'))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(rename({basename: 'index'}))
        .pipe(rename({suffix: '.umd-es2015'}))
        .pipe(gulp.dest('distribution/'))
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('distribution/'));
});

gulp.task('options', function () {
    options.plumb = true;
});

gulp.task('browser-sync', function() {
    return browserSync.init({
        server: {
            baseDir: [ 'distribution/' ],
            directory: true
        }
    });
});

gulp.task('watch', function() {
    gulp.watch(['index.js', 'src/*.js'], [ 'umd' ]);
    gulp.watch('style/*.styl', [ 'css' ]);
    gulp.watch('templates/**/*.+(html|nunjucks)', [ 'html' ]);
    gulp.watch('configuration.json', [ 'html', 'umd' ]);
    gulp.watch('static/*.+(svg|jpg)', [ 'static' ]);

    gulp.watch('distribution/*.js').on('change', () => browserSync.reload('*.js'));
    gulp.watch('distribution/*.css').on('change', () => browserSync.reload('*.css'));
    gulp.watch('distribution/*.html').on('change', () => browserSync.reload('*.html'));

    gulp.watch('distribution/*.svg').on('change', () => browserSync.reload('*.svg'));
    gulp.watch('distribution/*.jpg').on('change', () => browserSync.reload('*.jpg'));
    gulp.watch('distribution/*.webp').on('change', () => browserSync.reload('*.webp'));
});

gulp.task('serve', function(callback) {
  runSequence('options',
              'default',
              'browser-sync',
              'watch',
              callback);
});

gulp.task('build', function(callback) {
  runSequence('clean',
              'default',
              callback);
});

gulp.task('default', function(callback) {
  runSequence([ 'css', 'html', 'static' ],
              'umd',
              callback);
});
