const { resolve } = require('path');

module.exports = (config) => {
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
            exclude: resolve('./node_modules'),
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
  const index = argv.indexOf('--');
  const patterns = (index !== -1) ? argv.slice(index + 1) : [];
  if (patterns.length > 0) {
    return [ '--grep' ].concat(patterns);
  } else {
    return [];
  }
}
