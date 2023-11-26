const webpack = require("webpack")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const TerserPlugin = require("terser-webpack-plugin")
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer")
const { merge } = require("webpack-merge")
const postcssPresetEnv = require("postcss-preset-env")
const postcssNesting = require("postcss-nesting")

const settings = require("./webpack.settings")
const common = require("./webpack.common.js")

const MODERN_CONFIG = "modern"

// Configure Bundle Analyzer
const configureBundleAnalyzer = (buildType) => {
  if (buildType === MODERN_CONFIG) {
    return {
      analyzerMode: "static",
      reportFilename: "report-modern.html",
    }
  }
}

const configureModernCSSLoader = () => {
  return {
    test: /\.s?css$/,
    sideEffects: true,
    use: [
      MiniCssExtractPlugin.loader,
      {
        loader: "css-loader",
        options: {
          importLoaders: 1,
        },
      },
      {
        loader: "postcss-loader",
        options: {
          sourceMap: true,
          postcssOptions: {
            plugins: [
              postcssNesting(),
              postcssPresetEnv({
                stage: false, // disable all polyfill; only polyfill stuff in 'features'
                features: { "custom-properties": true },
                browsers: "last 2 versions",
              }),
            ],
          },
        },
      },
    ],
  }
}

const configureOptimization = () => ({
  // split webpack runtime/manifest code into a separate chunk
  // so that hashes stay same when rebuilding without changes
  runtimeChunk: "single",
  moduleIds: "deterministic",
  splitChunks: {
    chunks: "all",
  },
  minimize: true,
  minimizer: [new TerserPlugin()],
})

const configureHTML = {
  template: settings.templatePath, // use our own template!,
  filename: "index.html",
  // inject: false, // important! cuz we gonna place the <link> and <script> ourselves
  mode: "production",
}

module.exports = merge(common.modernConfig, {
  mode: "production",
  output: {
    filename: `${settings.jsFolder}/[name].[chunkhash].js`,
    chunkFilename: "[name].[chunkhash].js",
    publicPath: "/",
    clean: true,
  },
  devtool: "source-map",
  optimization: configureOptimization(),
  module: {
    rules: [configureModernCSSLoader()],
  },
  plugins: [
    new BundleAnalyzerPlugin(configureBundleAnalyzer(MODERN_CONFIG)),
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css",
      chunkFilename: "[name].[contenthash].css",
    }),
    new HtmlWebpackPlugin(configureHTML),
    new HtmlWebpackPlugin({
      template: "src/about.html",
      filename: "about/index.html",
      excludeChunks: ["main"],
    }),
    new webpack.ids.HashedModuleIdsPlugin(),
  ],
})
