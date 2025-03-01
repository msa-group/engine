const rspack = require('@rspack/core');
const Router = require('./scripts/mock');
const watchFile = require('./scripts/ymlToStr');

globalThis.process.env.RUNNER = 'rspack';

/**
 * @type {import('@rspack/core').Configuration}
 */
module.exports = {
  entry: {
    main: './demo/index.js',
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      title: "MSA parser engine",
      template: 'demo/index.html',
    })
  ],
  devServer: {
    setupMiddlewares: (middlewares) => {
      watchFile();
      middlewares.unshift(Router);
      return middlewares;
    }
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules/],
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'typescript',
            },
          },
        },
        type: 'javascript/auto',
      }
    ],
  },
};