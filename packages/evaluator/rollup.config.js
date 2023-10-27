const withRecommendedConfig = require("@tooling/rollup-config/recommended");

process.env.WORKSPACE_ROOT = __dirname;

module.exports = withRecommendedConfig({
  input: {
    index: "./src/index.client.ts",
    loader: "./src/core.loader.ts",
    backend: "./src/index.backend.ts",
    debug: "./src/index.debug.ts",
    empty: "./src/index.empty.ts",
  },
});
