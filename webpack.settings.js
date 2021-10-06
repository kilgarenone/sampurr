const path = require("path");

module.exports = {
  srcPath: path.resolve(__dirname, "./"),
  envPath: path.resolve(__dirname, "./.env"),
  templatePath: path.resolve(__dirname, "./src/index.html"),
  jsFolder: "js",
  imagesFolder: "img",
  fontsFolder: "fonts",
  babelLoaderConfig: {
    exclude: [/(node_modules|bower_components)/],
  },
};
