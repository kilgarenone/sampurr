const webpack = require("webpack")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const { merge } = require("webpack-merge")
const postcssNesting = require("postcss-nesting")

const settings = require("./webpack.settings")
const common = require("./webpack.common.js")

const devConfig = {
  mode: "development",
  // note: output path defaults to './dist'
  output: {
    filename: "[name].js",
    chunkFilename: "[name].js",
  },
  devtool: "inline-source-map",
  devServer: {
    port: 8008,
    hot: true,
    open: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: settings.templatePath,
      filename: "index.html",
    }),
    new HtmlWebpackPlugin({
      template: "src/about.html",
      filename: "about/index.html",
      excludeChunks: ["main"],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          "style-loader",
          { loader: "css-loader", options: { importLoaders: 1 } },
          {
            loader: "postcss-loader",
            options: {
              sourceMap: true,
              postcssOptions: {
                plugins: [postcssNesting()],
              },
            },
          },
        ],
      },
    ],
  },
}

module.exports = merge(common.modernConfig, devConfig)
