var Path = require('path');

module.exports = function(config) {
  config.set({
    port: 9876,
    logLevel: config.LOG_WARNING,
    autoWatch: true,
    singleRun: false,
    browsers: [ 'Chrome' ],
    frameworks: [ 'chai', 'mocha' ],
    files: [
      'tests.bundle.js',
    ],
    client: {
      args: parseTestPattern(process.argv),
    },
    preprocessors: {
      'tests.bundle.js': [ 'webpack', 'sourcemap' ]
    },
    plugins: [
      'karma-chai',
      'karma-chrome-launcher',
      'karma-mocha',
      'karma-sourcemap-loader',
      'karma-webpack',
      'karma-spec-reporter',
    ],
    reporters: [ 'spec' ],

    webpack: {
      mode: 'development',
      module: {
        rules: [
          {
            test: /\.(js|jsx|mjs)$/,
            loader: 'babel-loader',
            exclude: Path.resolve('./node_modules'),
            query: {
              presets: [
                '@babel/env',
                '@babel/react',
              ],
              plugins: [
                '@babel/transform-regenerator',
                '@babel/transform-runtime',
                'syntax-async-functions',
              ]
            }
          }
        ]
      },
    },

    webpackMiddleware: {
      noInfo: true,
    },
  })
};

function parseTestPattern(argv) {
  var index = argv.indexOf('--');
  var patterns = (index !== -1) ? argv.slice(index + 1) : [];
  if (patterns.length > 0) {
    return [ '--grep' ].concat(patterns);
  } else {
    return [];
  }
}
