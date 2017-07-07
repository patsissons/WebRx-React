// we can use sync safely here because it's just the gulp file
// gulp tasks prefer unregulated arrow-body-style
/* eslint-disable no-sync,arrow-body-style */

import 'babel-polyfill';
import File from 'vinyl';
import WebpackDevServer from 'webpack-dev-server';
import del from 'del';
import clone from 'clone';
import eslint from 'gulp-eslint';
// eslint-disable-next-line id-length
import fs from 'fs';
import mkdirp from 'mkdirp';
import gulp from 'gulp';
import minimist from 'minimist';
import mocha from 'gulp-mocha';
import path from 'path';
import plumber from 'gulp-plumber';
import runSequence from 'run-sequence';
import stylelint from 'gulp-stylelint';
import through from 'through';
import tslint from 'gulp-tslint';
import util from 'gulp-util';
import webpack from 'webpack';
import webpackStream from 'webpack-stream-fixed';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import webpackConfigTemplate from './webpack.config';
import webpackConfigTestTemplate from './test/webpack.config';

const options = {
  string: [
    'buildPath',
    'distPath',
    'reporter',
    'host',
    'port',
    'publicPath',
  ],
  boolean: [
    'profile',
    'verbose',
    'quiet',
    'force',
  ],
  alias: {
    buildPath: [ 'b', 'build', 'buildpath' ],
    distPath: [ 'd', 'dist', 'distpath' ],
    reporter: [ 'r' ],
    host: [ 'h' ],
    port: [ 'p' ],
    publicPath: [ 'P', 'pp' ],
    verbose: [ 'v' ],
    quiet: [ 'q' ],
  },
  default: {
    buildPath: path.resolve(__dirname, 'build'),
    distPath: path.resolve(__dirname, 'dist'),
    reporter: 'spec',
    host: '0.0.0.0',
    port: 3000,
    publicPath: '/',
    profile: false,
    verbose: false,
    quiet: false,
    force: false,
  },
};

const args = minimist(process.argv, options);

const config = {
  verbose: args.verbose,
  quiet: args.quiet,
  host: args.host,
  port: args.port,
  reporter: args.reporter,
  publicPath: args.publicPath,
  profile: args.profile,
  builds: {
    debug: 'debug',
    release: 'release',
    test: 'test',
    watch: 'watch',
  },
  files: {
    webpack: 'webpack.config.js',
    stats: 'stats.json',
  },
  paths: {
    src: path.resolve(__dirname, 'src'),
    test: path.resolve(__dirname, 'test'),
    build: args.buildPath,
    dist: args.distPath,
    docs: path.resolve(__dirname, 'docs'),
  },
};

function log(...items) {
  if (config.quiet === false) {
    // eslint-disable-next-line prefer-reflect
    util.log.apply(null, items);
  }
}

if (config.verbose) {
  log('Gulp Config:', JSON.stringify(config, null, 2));
}

// Default build task
gulp.task('default', [ 'watch' ]);
// Default test task
gulp.task('test', (done) => {
  runSequence('lint', 'mocha', done);
});
// Default npm test task
gulp.task('npm:test', (done) => {
  runSequence('lint', 'webpack:test', 'mocha:run', 'deploy', done);
});

gulp.task('config', () => {
  util.log('Gulp Config:', config);
});

gulp.task('help', () => {
  /* eslint-disable max-len */
  util.log(`*** Gulp Help ***

Command Line Overrides:
  ${ util.colors.cyan('--verbose') }          : print webpack module details and stats after bundling (${ util.colors.magenta(config.verbose) })
  ${ util.colors.cyan('--quiet') }            : do not print any extra build details (${ util.colors.magenta(config.quiet) })
  ${ util.colors.cyan('--profile') }          : provides webpack build profiling in ${ util.colors.magenta(config.files.stats) } (${ util.colors.magenta(config.profile) })
  ${ util.colors.cyan('--build') }       ${ util.colors.yellow('<path>') } : override build directory (${ util.colors.magenta(config.paths.build) })
  ${ util.colors.cyan('--dist') }      ${ util.colors.yellow('<path>') } : override dist directory (${ util.colors.magenta(config.paths.dist) })
  ${ util.colors.cyan('--reporter') }  ${ util.colors.yellow('<name>') } : mocha test reporter (${ util.colors.magenta(config.reporter) })
             options : ${ [ 'spec', 'list', 'progress', 'dot', 'min' ].map((x) => util.colors.magenta(x)).join(', ') }

Run ${ util.colors.cyan('gulp --tasks') } to see complete task hierarchy

Tasks:
  ${ util.colors.cyan('gulp') } will build a ${ util.colors.yellow('debug') } bundle and start a webpack development server
  ${ util.colors.cyan('gulp test') } will build a ${ util.colors.yellow('test') } bundle and run mocha against the tests (alias for ${ util.colors.cyan('gulp mocha') })
  ${ util.colors.cyan('gulp help') } will print this help text
  ${ util.colors.cyan('gulp config') } will print the gulp build configuration

  ${ util.colors.cyan('gulp clean') } will delete all files in ${ util.colors.magenta(config.paths.build) }, ${ util.colors.magenta(config.paths.dist) }
       ${ [ 'gulp', 'build', 'dist', 'all' ].map((x) => util.colors.cyan(`clean:${ x }`)).join(', ') }

  ${ util.colors.cyan('gulp lint') } will lint the source files with ${ util.colors.yellow('eslint') }, ${ util.colors.yellow('tslint') }, and ${ util.colors.yellow('stylelint') }
       ${ [ 'es', 'ts', 'style', 'all' ].map((x) => util.colors.cyan(`lint:${ x }`)).join(', ') }

  ${ util.colors.cyan('gulp webpack') } will build the ${ util.colors.yellow('debug') } bundle using webpack (alias for ${ util.colors.cyan('gulp webpack:debug') })
       ${ [ 'debug', 'release', 'release:dist', 'release:dist:min', 'test', 'all' ].map((x) => util.colors.cyan(`webpack:${ x }`)).join(', ') }

  ${ util.colors.cyan('gulp mocha') } will build the ${ util.colors.yellow('test') } bundle and run mocha against the tests
  ${ util.colors.cyan('gulp mocha:run') } will run mocha against the current ${ util.colors.yellow('test') } bundle

  ${ util.colors.cyan('gulp watch') } will start a webpack development server
  ${ util.colors.cyan('gulp watch:mocha') } will start webpack in ${ util.colors.magenta('watch') } mode, and run all tests after any detected change
  ${ util.colors.cyan('gulp watch:lint') } will watch source files for changes and run ${ util.colors.cyan('lint') } after any detected change
  ${ util.colors.cyan('gulp watch:dist') } will watch source files for changes and run ${ util.colors.cyan('dist') } after any detected change

  ${ util.colors.cyan('gulp dist') } will deploy release bundles to ${ util.colors.magenta(config.paths.dist) }

  ${ util.colors.cyan('gulp deploy') } will bundle and deploy release bundles to ${ util.colors.magenta(config.paths.dist) }
`);
  /* eslint-enable max-len */
});

gulp.task('clean', [ 'clean:all' ]);
gulp.task('clean:all', [ 'clean:gulp', 'clean:build', 'clean:dist' ]);

gulp.task('clean:gulp', () => {
  const target = path.resolve('gulpfile.js');

  log('Cleaning', util.colors.magenta(target));

  del.sync([ target ], { force: true });
});

gulp.task('clean:build', () => {
  const target = config.paths.build;

  log('Cleaning', util.colors.magenta(target));

  del.sync([ target ], { force: true });
});

gulp.task('clean:dist', () => {
  const target = config.paths.dist;

  log('Cleaning', util.colors.magenta(target));

  del.sync([ target ], { force: true });
});

gulp.task('clean:docs', () => {
  const target = config.paths.docs;

  log('Cleaning', util.colors.magenta(target));

  del.sync([ target ], { force: true });
});

gulp.task('lint', [ 'lint:all' ]);

gulp.task('lint:all', (done) => {
  runSequence('lint:ts', 'lint:es', 'lint:style:css', 'lint:style:less', done);
});

gulp.task('lint:es', () => {
  log('Linting with ESLint...');

  return gulp
    .src([
      path.resolve('*.js'),
    ], { base: __dirname })
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});

gulp.task('lint:ts', [ 'lint:ts:src', 'lint:ts:test' ]);

gulp.task('lint:ts:src', () => {
  log('Linting ', util.colors.magenta(config.paths.src), ' with TSLint...');

  return gulp
    .src([
      path.resolve(config.paths.src, '**', '*.ts'),
      path.resolve(config.paths.src, '**', '*.tsx'),
    ], { base: __dirname })
    .pipe(tslint({
      formatter: 'verbose',
    }))
    .pipe(tslint.report({
      emitError: true,
      summarizeFailureOutput: true,
    }));
});

gulp.task('lint:ts:test', () => {
  log('Linting ', util.colors.magenta(config.paths.test), ' with TSLint...');

  return gulp
    .src([
      path.resolve(config.paths.test, '**', '*.ts'),
    ], { base: __dirname })
    .pipe(tslint({
      configuration: path.resolve(config.paths.test, 'tslint.json'),
      formatter: 'verbose',
    }))
    .pipe(tslint.report({
      emitError: true,
      summarizeFailureOutput: true,
    }));
});

gulp.task('lint:style', [ 'lint:style:less', 'lint:style:css' ]);

gulp.task('lint:style:less', () => {
  log('Linting with Stylelint:Less...');

  return gulp
    .src(
      path.resolve(config.paths.src, '**', '*.less'),
      { base: __dirname }
    )
    .pipe(stylelint({
      syntax: 'less',
      failAfterError: true,
      reporters: [
        { formatter: 'string', console: true },
      ],
    }));
});

gulp.task('lint:style:css', () => {
  log('Linting with Stylelint:CSS...');

  return gulp
    .src(
      path.resolve(config.paths.src, '**', '*.css'),
      { base: __dirname }
    )
    .pipe(stylelint({
      failAfterError: true,
      reporters: [
        { formatter: 'string', console: true },
      ],
    }));
});

function getWebpackConfig(build, uglify, dist) {
  // dynamic loading of the webpack config
  const webpackConfig = clone(build === config.builds.test ? webpackConfigTestTemplate : webpackConfigTemplate);

  if (build === config.builds.debug) {
    webpackConfig.plugins[0].definitions.DEBUG = true;
  } else if (build === config.builds.release) {
    if (uglify === true) {
      webpackConfig.output.filename = util.replaceExtension(webpackConfig.output.filename, '.min.js');
      webpackConfig.plugins[1].filenameTemplate = util
        .replaceExtension(webpackConfig.plugins[1].filenameTemplate, '.min.js');
      webpackConfig.plugins[2].filename = util.replaceExtension(webpackConfig.plugins[2].filename, '.min.css');
    }

    if (dist === true) {
      // copy vendor modules to externals
      webpackConfig.entry.vendor.forEach((x) => {
        webpackConfig.externals[x] = true;
      });

      // remove vendor chunk entry and common chunk plugin
      // eslint-disable-next-line prefer-reflect
      delete webpackConfig.entry.vendor;
      webpackConfig.plugins.splice(1, 1);

      // configure library output
      webpackConfig.output.library = 'webrx-react';
      webpackConfig.output.libraryTarget = 'commonjs2';
    }

    webpackConfig.plugins[0].definitions.RELEASE = true;
    webpackConfig.plugins[0].definitions['process.env'] = {
      'NODE_ENV': JSON.stringify('production'),
    };

    if (uglify) {
      webpackConfig.plugins.push(
        new webpack.optimize.UglifyJsPlugin({
          comments: false,
          compress: {
            warnings: false,
          },
          sourceMap: true,
        })
      );
    }
  }

  webpackConfig.plugins.push(
    new HtmlWebpackPlugin({
      template: './src/index.ejs',
      filename: 'index.html',
      hash: true,
    })
  );

  webpackConfig.profile = config.profile;

  return webpackConfig;
}

function printAssets(jsonStats, build) {
  const outputPath = path.resolve(config.paths.build, build);
  const assets = jsonStats.assetsByChunkName;

  for (const chunk in assets) {
    const asset = assets[chunk];

    if (Array.isArray(asset)) {
      for (const i in asset) {
        log(util.colors.magenta(path.resolve(outputPath, asset[i])));
      }
    } else {
      log(util.colors.magenta(path.resolve(outputPath, asset)));
    }
  }
}

function logWebpackIssues(jsonStats) {
  const warnings = jsonStats.warnings || [];
  const errors = jsonStats.errors || [];

  if (warnings.length) {
    log(`${ util.colors.yellow(`${ warnings.length } Warnings`) }:
${ warnings.map((x) => x.trim()).join('\r\n') }`);
  }

  if (errors.length) {
    log(`${ util.colors.red(`${ errors.length } Errors`) }:
${ errors.map((x) => x.trim()).join('\r\n') }`);
  }
}

function onWebpackComplete(build, err, stats, omitAssets) {
  if (err) {
    throw new util.PluginError(`webpack: ${ build }`, err.message);
  }

  if (stats) {
    const jsonStats = stats.toJson({ chunkModules: true }) || {};

    if (config.quiet === false) {
      if (config.verbose) {
        log(stats.toString({
          colors: util.colors.supportsColor,
        }));
      } else {
        logWebpackIssues(jsonStats);

        if (!omitAssets) {
          printAssets(jsonStats, build);
        }
      }
    }

    if (config.profile) {
      const statsPath = path.resolve(config.paths.build, build, config.files.stats);

      log('Writing Webpack Profile Stats to', util.colors.magenta(statsPath));

      if (fs.existsSync(path.dirname(statsPath)) === false) {
        mkdirp.sync(path.dirname(statsPath));
      }

      fs.writeFileSync(statsPath, JSON.stringify(jsonStats, null, 2));
    }
  }
}

function webpackBuild(build, webpackConfig, callback) {
  const target = path.resolve(config.paths.build, build);

  webpackConfig.output.path = target;
  webpackConfig.output.publicPath = config.publicPath;

  log('Bundling', util.colors.yellow(build), 'Build:', util.colors.magenta(target));

  return webpackStream(webpackConfig, webpack, (err, stats) => {
    if (callback) {
      callback(err, stats);

      return;
    }

    onWebpackComplete(build, err, stats);

    if (webpackConfig.watch !== true && (err || (stats.compilation.errors || []).length)) {
      // this is required for external scripts to handle webpack errors
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  })
  // this is required to swallow webpack-stream errors (we handle them on our own)
  .on('error', () => null);
}

function webpackWatcherStream(webpackConfig, build) {
  const target = path.resolve(config.paths.build, build);

  webpackConfig.output.path = target;
  webpackConfig.output.publicPath = config.publicPath;

  // eslint-disable-next-line prefer-arrow-callback
  const stream = through(() => null, function () {
    // eslint-disable-next-line no-invalid-this
    const self = this;

    const { compiler } = webpack(webpackConfig, (err, stats) => {
      onWebpackComplete(config.builds.watch, err, stats, true);

      log('watching for changes');
    });

    compiler.plugin('compile', () => {
      log('Bundling...');
    });

    compiler.plugin('after-emit', (compilation, callback) => {
      Object.keys(compilation.assets).forEach((outname) => {
        const filePath = path.resolve(compiler.outputPath, outname);

        if (compilation.assets[outname].emitted) {
          const file = new File({
            base: compiler.outputPath,
            path: filePath,
            contents: fs.readFileSync(filePath),
          });

          self.queue(file);
        } else {
          log(util.colors.yellow(`${ filePath } NOT emitted`));
        }
      });
      callback();
    });
  });

  // this makes the stream begin immediately
  stream.end();

  return stream;
}

gulp.task('webpack', [ 'webpack:debug' ]);
gulp.task('webpack:all', (done) => {
  runSequence('webpack:debug', 'webpack:release', 'webpack:test', done);
});

gulp.task('webpack:debug', [ 'clean:build' ], () => {
  const webpackConfig = getWebpackConfig(config.builds.debug);

  return webpackBuild(config.builds.debug, webpackConfig)
    .pipe(gulp.dest(webpackConfig.output.path));
});

gulp.task('webpack:release', [ 'clean:build' ], () => {
  const webpackConfig = getWebpackConfig(config.builds.release);

  return webpackBuild(config.builds.release, webpackConfig)
    .pipe(gulp.dest(webpackConfig.output.path));
});

gulp.task('webpack:release:dist', [ 'clean:build' ], () => {
  const webpackConfig = getWebpackConfig(config.builds.release, false, true);

  return webpackBuild(config.builds.release, webpackConfig)
    .pipe(gulp.dest(webpackConfig.output.path));
});

gulp.task('webpack:release:dist:min', [ 'clean:build' ], () => {
  const webpackConfig = getWebpackConfig(config.builds.release, true, true);

  return webpackBuild(config.builds.release, webpackConfig)
    .pipe(gulp.dest(webpackConfig.output.path));
});

gulp.task('webpack:test', [ 'clean:build' ], () => {
  const webpackConfig = getWebpackConfig(config.builds.test);

  return webpackBuild(config.builds.test, webpackConfig)
    .pipe(gulp.dest(webpackConfig.output.path));
});

gulp.task('mocha', (done) => {
  runSequence('webpack:test', 'mocha:run', done);
});

gulp.task('mocha:run', () => {
  const webpackConfig = getWebpackConfig(config.builds.test);
  const target = path.resolve(config.paths.build, config.builds.test, webpackConfig.output.filename);

  log('Testing with Mocha:', util.colors.magenta(target));

  return gulp
    .src(target)
    .pipe(mocha({ reporter: args.reporter || (config.quiet ? 'dot' : config.reporter) }));
});

gulp.task('watch', [ 'watch:webpack' ]);

gulp.task('watch:webpack', [ 'clean:build' ], (done) => {
  const webpackConfig = getWebpackConfig(config.builds.debug);
  const uri = `http://${ config.host === '0.0.0.0' ? 'localhost' : config.host }:${ config.port }`;

  webpackConfig.entry = {
    app: [
      `webpack-dev-server/client?${ uri }`,
      'webpack/hot/only-dev-server',
      path.resolve(config.paths.src, 'app.tsx'),
    ],
  };
  // remove CommonsChunkPlugin and ExtractTextPlugin
  webpackConfig.plugins.splice(1, 2);
  // eslint-disable-next-line id-match
  webpackConfig.plugins[0].definitions.WEBPACK_DEV_SERVER = true;
  webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
  webpackConfig.devtool = 'eval';
  webpackConfig.watch = true;

  webpackConfig.module.rules = [
    { test: /\.css$/, loader: [ 'style-loader', 'css-loader' ] },
    { test: /\.less$/, loader: [ 'style-loader', 'css-loader', 'less-loader' ] },
    { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url-loader?mimetype=application/font-woff' },
    { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url-loader' },
    { test: /\.(png|jpg|gif)$/, loader: 'url-loader' },
    { test: /\.tsx?$/, loader: [ 'react-hot-loader', 'awesome-typescript-loader' ] },
  ];

  const compiler = webpack(webpackConfig);

  compiler.plugin('compile', () => {
    log('Bundling...');
  });

  compiler.plugin('done', (stats) => {
    onWebpackComplete(config.builds.watch, null, stats);

    if (done) {
      // eslint-disable-next-line callback-return
      done();
      done = null;

      log('[webpack-dev-server]', `Listening at ${ util.colors.magenta(`${ config.host }:${ config.port }`) }`);
      log('[webpack-dev-server]', util.colors.magenta(`${ uri }/index.html`));
      log('[webpack-dev-server]', util.colors.magenta(`${ uri }/webpack-dev-server/index.html`));

      return;
    }

    log('watching for changes');
  });

  compiler.plugin('failed', (err) => {
    if (err) {
      throw new util.PluginError(`webpack: ${ config.builds.debug }`, err.message);
    }
  });

  new WebpackDevServer(compiler, {
    publicPath: webpackConfig.output.publicPath,
    contentBase: path.resolve(config.paths.build, config.builds.watch),
    hot: true,
    historyApiFallback: true,
    quiet: true,
    noInfo: false,
    stats: {
      colors: true,
    },
  }).listen(config.port, config.host, (err) => {
    if (err) {
      throw new util.PluginError('webpack-dev-server', err);
    }
  });
});

gulp.task('watch:mocha', [ 'clean:build' ], () => {
  const webpackConfig = getWebpackConfig(config.builds.test);

  webpackConfig.devtool = 'eval';
  webpackConfig.watch = true;

  const reporter = args.reporter || 'dot';

  return webpackWatcherStream(webpackConfig, config.builds.test)
    .pipe(gulp.dest(webpackConfig.output.path))
    .pipe(through((file) => {
      log('Testing', util.colors.magenta(file.path), '...');

      gulp
        .src(file.path, { read: false })
        .pipe(plumber())
        .pipe(mocha({ reporter }));
    }));
});

gulp.task('watch:lint', () => {
  runSequence('lint');

  gulp
    .watch([
      path.resolve(config.paths.src, '**', '*.ts'),
      path.resolve(config.paths.src, '**', '*.tsx'),
      path.resolve(config.paths.test, '**', '*.ts'),
      path.resolve(config.paths.src, '**', '*.js'),
      path.resolve(config.paths.test, '**', '*.js'),
      path.resolve(config.paths.src, '**', '*.css'),
      path.resolve(config.paths.src, '**', '*.less'),
      path.resolve('*.js'),
    ], [ 'lint' ]);
});

gulp.task('watch:dist', [ 'clean:build', 'clean:dist' ], () => {
  const target = path.resolve(config.paths.dist);
  const webpackConfig = getWebpackConfig(config.builds.release);

  log('Deploying', util.colors.yellow(config.builds.release), 'Build to', util.colors.magenta(target));

  webpackConfig.watch = true;

  return webpackWatcherStream(webpackConfig, config.builds.watch)
    .pipe(gulp.dest(target))
    .pipe(through((file) => {
      util.log('Deployed', util.colors.magenta(file.path));
    }));
});

gulp.task('dist', () => {
  const target = path.resolve(config.paths.dist);

  log('Deploying', util.colors.yellow(config.builds.release), 'Build to', util.colors.magenta(target));

  return gulp
    .src(path.resolve(config.paths.build, config.builds.release, '**', '*'))
    .pipe(gulp.dest(target))
    .pipe(through((file) => {
      util.log('Deploying', util.colors.magenta(file.path));
    }));
});

gulp.task('deploy', (done) => {
  runSequence('clean:dist', 'webpack:release:dist', 'dist', 'webpack:release:dist:min', 'dist', done);
});

gulp.task('deploy:docs', [ 'clean:docs' ], () => {
  const webpackConfig = getWebpackConfig(config.builds.release, true, false);

  // configure the deployed public path (allow overrides for local test bundles)
  // see: https://stackoverflow.com/a/34133809/2789877
  webpackConfig.output.publicPath = config.publicPath || 'https://marinels.github.io/webrx-react/';

  // we don't want to emit source maps
  delete webpackConfig.devtool;

  // remove CommonsChunkPlugin and ExtractTextPlugin
  webpackConfig.plugins.splice(1, 2);

  // set up the entry and output for github docs
  webpackConfig.entry = {
    app: path.resolve(__dirname, 'src', 'app.tsx'),
  };
  webpackConfig.output = {
    path: path.join(__dirname, 'docs'),
    filename: 'app.js',
  };

  // we aren't using ExtractTextPlugin so just use the normal loaders
  webpackConfig.module.rules.splice(0, 2,
    { test: /\.css$/, loader: [ 'style-loader', 'css-loader' ] },
    { test: /\.less$/, loader: [ 'style-loader', 'css-loader', 'less-loader' ] }
  );

  return webpackStream(webpackConfig, webpack)
    .pipe(gulp.dest(webpackConfig.output.path));
});

gulp.task('deploy:modules', [ 'deploy:modules:ts', 'deploy:modules:less' ]);

gulp.task('deploy:modules:ts', () => {
  return gulp
    .src([
      path.resolve(config.paths.src, '**', '*.d.ts'),
    ])
    .pipe(gulp.dest(__dirname));
});

gulp.task('deploy:modules:less', () => {
  return gulp
    .src(path.resolve(config.paths.src, '**', '*.less'))
    .pipe(gulp.dest(__dirname));
});
