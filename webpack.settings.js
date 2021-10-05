const path = require("path");

module.exports = {
  outputPath: path.resolve(__dirname, "./dist"),
  srcPath: path.resolve(__dirname, "./"),
  entryPath: path.resolve(__dirname, "./index.js"),
  envPath: path.resolve(__dirname, "./.env"),
  templatePath: path.resolve(__dirname, "./index.html"),
  jsFolder: "js",
  imagesFolder: "img",
  fontsFolder: "fonts",
  babelLoaderConfig: {
    exclude: [/(node_modules|bower_components)/],
  },
};
