#!/usr/bin/env node

const { rspack } = require('@rspack/core');
const { RspackDevServer } = require('@rspack/dev-server');
const path = require('path');
const Router = require(path.resolve(__dirname, '../scripts/mock'));


const htmlFile = path.resolve(__dirname, "../demo/index.html");
const entryFile = path.resolve(__dirname, "../demo/index.js");

const complier = rspack({
  entry: {
    main: entryFile,
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      title: 'MSA Config Checker',
      template: htmlFile,
    })
  ],
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
