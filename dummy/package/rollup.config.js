const esbuild = require("rollup-plugin-esbuild").default;
const { extractCssPlugin } = require("@css-extract/rollup-plugin");

module.exports = {
  input: "./src/index.ts",

  output: {
    dir: "./lib",
    format: "esm",

    assetFileNames: "[name][extname]",
    preserveModules: true,
    sourcemap: true,
    interop: "auto",
  },

  plugins: [
    esbuild({
      sourceMap: true,
      jsx: "automatic",
    }),
    extractCssPlugin(),
  ],
};
