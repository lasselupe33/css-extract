const withRecommendedConfig = require("@tooling/rollup-config/recommended");

process.env.WORKSPACE_ROOT = __dirname;

module.exports = withRecommendedConfig({
  input: {
    index: "./src/index.ts",
    empty: "./src/empty.ts",
    loader: "./src/virtual-fs-loader.ts",
  },
});
