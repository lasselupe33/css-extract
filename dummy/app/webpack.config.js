/* eslint-disable @typescript-eslint/no-var-requires */

const path = require("path");

const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HtmlPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

// resolve runtime environment configurations to use when building the project
let runtimeEnvironment = "test";

switch (process.env.APP_ENV) {
  case "production":
  case "staging":
    runtimeEnvironment = process.env.APP_ENV;
}

process.env.APP_ENV = runtimeEnvironment;

const entryPoints = {
  main: [path.join(__dirname, "src", "index.tsx")],
};

module.exports = {
  entry: entryPoints,

  output: {
    path: path.join(__dirname, "lib"),
    filename:
      process.env.NODE_ENV === "production"
        ? "[name].[fullhash].js"
        : "[name].js",

    publicPath: process.env.WEBPACK_DEV_SERVER_PORT
      ? `http://localhost:${process.env.WEBPACK_DEV_SERVER_PORT}/`
      : "/",

    crossOriginLoading: "anonymous",
  },

  mode: process.env.NODE_ENV === "production" ? "production" : "development",

  devtool: "source-map",

  optimization: {
    minimizer:
      process.env.NODE_ENV === "production"
        ? [new CssMinimizerPlugin({}), "..."]
        : [],
  },

  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        loader: "esbuild-loader",
        options: {
          jsx: "automatic",
          sourcemap: true,
        },
      },

      {
        test: /\.css$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: "css-loader",
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },

  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
  },

  plugins: [
    new webpack.EnvironmentPlugin(process.env),

    new CleanWebpackPlugin(),

    new HtmlPlugin({
      template: path.join(__dirname, "src", "index.html"),
      filename: "./index.html",
      inject: false,
    }),

    new MiniCssExtractPlugin({
      ignoreOrder: true,
      filename:
        process.env.NODE_ENV === "production"
          ? "[name].[fullhash].css"
          : "[name].css",
    }),

    process.env.NODE_ENV === "production" &&
      process.env.WEBPACK_DISABLE_COMPRESSION === undefined &&
      new CompressionPlugin({
        test: /\.(js|css|html|svg|json)$/,
        exclude: process.env.WEBPACK_DISABLE_COMPRESSION && /.*/,
      }),

    process.env.WEBPACK_BUNDLE_ANALYZER && new BundleAnalyzerPlugin(),
  ].filter(Boolean),

  devServer: {
    hot: true,
    port: process.env.WEBPACK_DEV_SERVER_PORT,

    allowedHosts: ["localhost:3000"],
    headers: {
      "Access-Control-Allow-Origin": "*",
    },

    devMiddleware: {
      writeToDisk: true,
      stats: "minimal",
    },

    client: {
      overlay: false,
    },
  },

  stats: process.env.NODE_ENV !== "production" ? "minimal" : "normal",
};
