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

const baseConfig = {
  entry: {
    app: settings.entryPath,
  },
  module: {
    rules: [
      // FONT loader
      {
        test: /\.(woff|woff2)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: `${settings.fontsFolder}/[name].[hash].[ext]`, // output to /fonts folder under output.path
            },
          },
        ],
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
