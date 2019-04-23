const webpack = require('webpack');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = {
  // entry: ["babel-polyfill", "./bootstrap.js"], // babel-polyfill is to make async/await work
  entry: ["./bootstrap.js"],
  output: {
    publicPath: '/image-editor',// deploy on server with http://localhost:8080/image-editor
    path: path.resolve(__dirname, "public"),
    filename: "bootstrap.js",
  },
  mode: "development",
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    host: 'localhost',
    port: '8080',
    inline: true,
    compress: true,
    open: true,
    openPage: 'image-editor'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              {
                plugins: [
                  '@babel/plugin-proposal-class-properties',
                  '@babel/plugin-syntax-dynamic-import'
                ]
              },
              '@babel/react'
            ]
          }
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(jpe?g|gif|png|ico|svg)$/i,
        loader:'url-loader?limit=1024&name=images/[name].[ext]'
      },
      {
        test: /\.(woff|woff2|eot|ttf|svg)(\?.*$|$)/i,
        loader: 'url-loader?limit=10240&name=../fonts/[name].[ext]'
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      PRODUCTION: JSON.stringify(true),
      URL_PATH: JSON.stringify('')
    }),
    new CopyWebpackPlugin(['index.html'])
  ],
};
