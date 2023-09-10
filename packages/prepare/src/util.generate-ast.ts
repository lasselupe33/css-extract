import path from "node:path";

import type { ParseResult } from "@babel/parser";
import { parse } from "@babel/parser";
import { cloneNode, type File } from "@babel/types";
import type { OutputFile } from "esbuild";
import esbuild from "esbuild";

export const TEMP_ROOT = "/Users/lassefelskovagersten/Code/misc/css-extractor";

const esbuildCache = new Map<string, OutputFile>();
const astCache = new Map<string, ParseResult<File>>();

export async function generateAST(filePath: string) {
  let ast = astCache.get(filePath);

  if (ast) {
    return ast;
  }

  let transformedSource = esbuildCache.get(filePath);

  if (!transformedSource) {
    // @TODO
    // const glob = await FastGlob(`${TEMP_ROOT}/**/*.ts`, {
    //   onlyFiles: true,
    //   ignore: ["**/node_modules/**"],
    // });

    const transformed = await esbuild.build({
      entryPoints: [filePath],
      outdir: path.dirname(filePath),
      format: "esm",
      resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".mts"],
      bundle: false,
      write: false,
    });

    transformedSource = transformed.outputFiles.find(
      (it) => it.path.replace(".js", "") === filePath
    );

    transformed.outputFiles.forEach((file) =>
      esbuildCache.set(file.path.replace(".js", ""), file)
    );

    if (!transformedSource) {
      return;
    }
  }

  ast = parse(transformedSource.text, { sourceType: "module" });

  astCache.set(transformedSource.path.replace(".js", ""), ast);

  return ast;
}
