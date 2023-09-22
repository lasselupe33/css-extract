const withRecommendedConfig = require("@tooling/rollup-config/recommended");

process.env.WORKSPACE_ROOT = __dirname;

module.exports = withRecommendedConfig({
  input: {
    index: "./src/index.client.ts",
    backend: "./src/index.backend.ts",
    debug: "./src/index.debug.ts",
    empty: "./src/index.empty.ts",
    loader: "./src/virtual-fs-loader.ts",
  },
});
