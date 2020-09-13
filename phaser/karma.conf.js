const webpackConfig = require('./webpack.config');

delete webpackConfig.entry;

module.exports = function(config) {
  config.set({
    frameworks: ['mocha'],

    files: [
      'src/testContext.ts'
    ],
    preprocessors: {
      'src/testContext.ts': ['webpack', 'sourcemap']
    },
    reporters: ['mocha'],
    webpack: webpackConfig,
    webpackMiddleware: {
      noInfo: true
    },
    browsers: ['ChromeHeadless'],
  });
};