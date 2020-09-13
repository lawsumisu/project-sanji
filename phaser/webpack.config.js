const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const SRC_DIR = path.join(__dirname, 'src');
module.exports = {
  entry: path.join(SRC_DIR, 'app.ts'),
  mode: "development",
  devtool: "eval-source-map",
  module: {
    rules: [
      {
        test: /\.[jt]s$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: [/\.vert$/, /\.frag$/],
        use: "raw-loader"
      },
      {
        test: /\.(gif|png|jpe?g|svg|xml)$/i,
        use: "file-loader"
      }
    ]
  },
  devServer: {
    hot: true,
    port: 8080,
    contentBase: SRC_DIR,
  },
  resolve: {
    alias: {
      src: SRC_DIR,
    },
    extensions: ['.js', '.ts']
  },
  plugins: [
    new webpack.DefinePlugin({
      CANVAS_RENDERER: JSON.stringify(true),
      WEBGL_RENDERER: JSON.stringify(true)
    }),
    new HtmlWebpackPlugin({
      template: "./index.html"
    }),
    new webpack.SourceMapDevToolPlugin({
      test: /\.(ts|js)($|\?)/i
    })
  ]
};