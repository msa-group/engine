#!/usr/bin/env node

const { rspack } = require('@rspack/core');
const { RspackDevServer } = require('@rspack/dev-server');
const path = require('path');
const Router = require('../scripts/mock');


const htmlFile = path.resolve(__dirname, "../demo/index.html");
const entryFile = path.resolve(__dirname, "../demo/index.ts");

const complier = rspack({
  entry: {
    main: entryFile,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      title: 'MSA Config Checker',
      template: htmlFile,
    })
  ],

  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules/, /src/],
        loader: "builtin:swc-loader",
        options: {
          jsc: {
            parser: {
              syntax: 'typescript',
            },
          },
        },
        type: 'javascript/auto',
      }
    ]
  }
});

const devServer = new RspackDevServer({
  client: {
    overlay: false,
  },
  setupMiddlewares: (middlewares) => {
    middlewares.unshift(Router);
    return middlewares;
  },
}, complier);

devServer.start();
