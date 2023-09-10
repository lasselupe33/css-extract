const { extractCssPlugin } = require("@css-extract/rollup-plugin");
const esbuild = require("rollup-plugin-esbuild").default;

module.exports = {
  input: "./src/index.ts",

  output: {
    dir: "./lib",
    format: "esm",

    assetFileNames: "[name][extname]",
    preserveModules: true,
    sourcemap: "inline",
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
