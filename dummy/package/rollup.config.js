import { extractCssPlugin } from "@css-extract/rollup-plugin";
import esbuild from "rollup-plugin-esbuild";
import rollup from "@tooling/rollup-config/recommended.js";
import path from "path";

process.env["WORKSPACE_ROOT"] = path.dirname(new URL(import.meta.url).pathname);
process.env["ROLLUP_CONFIG"] = "linaria";

// export default rollup({
//   input: {
//     index: "./src/linaria/index.ts",
//   },
// });

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
