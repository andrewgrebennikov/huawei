var gulp          = require('gulp'),
    del 		  = require('del'),
    posthtml 	  = require('gulp-posthtml'),
    include 	  = require('posthtml-include'),
    sourcemaps    = require('gulp-sourcemaps'),
    runsequence   = require('run-sequence'),
    svgmin 		  = require('gulp-svgmin'),
    ghPages 	  = require('gulp-gh-pages'),
    mqpacker 	  = require('css-mqpacker'),
    svgstore 	  = require('gulp-svgstore'),
    imagemin 	  = require('gulp-imagemin'),
    plumber       = require('gulp-plumber'),
    cache         = require('gulp-cache'),
    postcss       = require('gulp-postcss'),
    csso 		  = require('postcss-csso'),
    sass          = require('gulp-sass'),
    browsersync   = require('browser-sync'),
    concat        = require('gulp-concat'),
    uglify        = require('gulp-uglify'),
    rename        = require('gulp-rename'),
    smartgrid     = require('smart-grid'),
    mode          = require('gulp-mode')();
    autoprefixer  = require('autoprefixer');

gulp.task('smartgrid', function () {
    var settings = {
        outputStyle: 'scss',
        columns: 12,
        offset: '30px',
        mobileFirst: false,
        container: {
            maxWidth: '1200px',
            fields: '30px'
        },
        breakPoints: {
            lg: {
                width: '1100px'
            },
            md: {
                width: '960px'
            },
            sm: {
                width: '780px',
                fields: '15px'
            },
            xs: {
                width: '560px'
            }
        }
    };
    smartgrid('app/libs/smartgrid', settings);
});

gulp.task('sass', function () {
    return gulp.src('app/sass/**/*.{scss,sass}')
        .pipe(plumber({
			errorHandler: function (err) {
				console.log(err);
				this.emit('end');
			}
		}))
        .pipe(mode.development(sourcemaps.init()))
        .pipe(sass())
        .pipe(postcss([
            autoprefixer(),
            mqpacker({
                sort: true
            }),
            csso({
                comments: false
            })
        ]))
        .pipe(rename({
            suffix: '.min',
            prefix: ''
        }))
        .pipe(mode.development(sourcemaps.write('.')))
        .pipe(gulp.dest('build/css'))
        .pipe(browsersync.reload({
            stream: true
        }))
});

gulp.task('common-js', function () {
    return gulp.src([
        'app/js/common.js'
    ])
        .pipe(plumber({
			errorHandler: function (err) {
				console.log(err);
				this.emit('end');
			}
		}))
        .pipe(concat('common.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('app/js'));
});

gulp.task('js', ['common-js'], function () {
    return gulp.src([
		'app/libs/jquery/jquery.min.js',
		'app/libs/owl-carousel/owl.carousel.min.js',
        'app/js/common.min.js' // Always at the end
    ])
        .pipe(plumber({
			errorHandler: function (err) {
				console.log(err);
				this.emit('end');
			}
		}))
        .pipe(mode.development(sourcemaps.init()))
        .pipe(concat('scripts.min.js'))
        .pipe(uglify())
        .pipe(mode.development(sourcemaps.write('.')))
        .pipe(gulp.dest('build/js'))
        .pipe(browsersync.reload({
            stream: true
        }))
});

gulp.task('svgsprite', function () {
	return gulp.src('app/img/icons/icon-*.svg')
		.pipe(plumber({
			errorHandler: function (err) {
				console.log(err);
				this.emit('end');
			}
		}))
        .pipe(cache(svgmin(function (file) {
            return {
                plugins: [{
                    cleanupIDs: {
                        minify: true
                    },
                    removeViewBox: true
                }]
            };
        })))
        .pipe(svgstore({
            inlineSvg: true
        }))
        .pipe(rename('sprite.svg'))
        .pipe(gulp.dest('build/img'));
});

let spriteSvgPath = 'app/img/icons';
gulp.task('html', function () {
	if (fileExist(spriteSvgPath) !== false) {
		return gulp.src('app/*.html')
			.pipe(plumber({
				errorHandler: function (err) {
					console.log(err);
					this.emit('end');
				}
			}))
			.pipe(posthtml([
				include()
			]))
			.pipe(gulp.dest('build'))
			.pipe(browsersync.reload({
				stream: true
			}))
	}
});

gulp.task('imagemin', function () {
    return gulp.src('app/img/*{jpg,png,gif,svg}')
        .pipe(plumber({
			errorHandler: function (err) {
				console.log(err);
				this.emit('end');
			}
		}))
        .pipe(cache(imagemin([
            imagemin.gifsicle({
                interlaced: true
            }),
            imagemin.optipng({
                optimizationLevel: 3
            }),
            imagemin.jpegtran({
                progressive: true
			}),
			imagemin.svgo({
				plugins: [
					{removeViewBox: false}
				]
			})
        ])))
        .pipe(gulp.dest('build/img'));
});

gulp.task('browser-sync', function () {
	browsersync({
		server: {
			baseDir: 'build/'
		},
		open: false
	});
    gulp.watch('app/sass/**/*.{scss,sass}', ['sass']);
	gulp.watch(['libs/**/*.js', 'app/js/common.js'], ['js']);
	gulp.watch('app/img/*{jpg,png,gif,svg}', ['imagemin']);
	gulp.watch('app/img/icons/icon-*.svg', ['svgsprite']);
	gulp.watch('app/*.html', ['html']);
});

gulp.task('delbuild', function () {
    return del('build');
});

gulp.task('clearcache', function () {
    return cache.clearAll();
});

gulp.task('copy', function () {
    return gulp.src([
        'app/.htaccess',
        'app/fonts/**/*'
    ], {
        base: 'app'
    })
    .pipe(gulp.dest('build'))
});

gulp.task('build', function (done) {
    runsequence('delbuild', 'copy', 'sass', 'js', 'imagemin', 'svgsprite', 'html', done);
});

gulp.task('deploy', function () {
    return gulp.src('build/**/*')
        .pipe(ghPages());
});

function fileExist(filepath) {
	let flag = true;
	try {
		fs.accessSync(filepath, fs.F_OK);
	} catch(e) {
		flag = false;
	}
	return flag;
}
