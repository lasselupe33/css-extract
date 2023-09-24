import { extractCssPlugin } from "@css-extract/rollup-plugin";
import esbuild from "rollup-plugin-esbuild";

export default {
  input: {
    index: "./src/index.ts",
    shaker: "./src/shaker.ts",
  },

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
