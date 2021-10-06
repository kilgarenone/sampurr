const path = require("path");
const { merge } = require("webpack-merge");

const settings = require("./webpack.settings");

let envFileName = "";

if (process.env.TEST_RUN || process.env.NODE_ENV !== "production") {
  envFileName = ".development";
}

// Configure Babel loader
const configureModernBabelLoader = () => {
  return {
    test: /\.m?js$/,
    exclude: settings.babelLoaderConfig.exclude, // remove this when library authors ship ESM
    use: {
      loader: "babel-loader",
      // options: {
      //   envName: "modern", // Points to env.modern in babel.config.js
      // },
    },
  };
};

// note: 'entry' path defaults to './src/index.js'
const baseConfig = {
  module: {
    rules: [
      // FONT loader
      {
        test: /\.(woff|woff2)$/,
        type: "asset/resource",
        generator: {
          filename: `${settings.fontsFolder}/[contenthash][ext][query]`,
        },
      },
      // IMAGE loader
      {
        test: /\.(png|svg|jpg|jpeg)$/i,
        type: "asset",
        generator: {
          filename: `${settings.imagesFolder}/[contenthash][ext][query]`,
        },
      },
    ],
  },
  plugins: [],
};

// Modern webpack config
const modernConfig = {
  module: {
    rules: [configureModernBabelLoader()],
  },
};

module.exports = {
  modernConfig: merge(baseConfig, modernConfig),
};
