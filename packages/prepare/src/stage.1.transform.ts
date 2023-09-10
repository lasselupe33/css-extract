import fs from "fs";
import path from "path";

import type { ParseResult } from "@babel/parser";
import { parse } from "@babel/parser";
import type { File } from "@babel/types";
import esbuild from "esbuild";

import { supportedExtensions } from "./constant.extensions";

export type AST = ParseResult<File>;

type CacheEntry = {
  lastModifiedMs: number;
  ast: AST;
};

const cache = new Map<string, CacheEntry>();

export async function transform(filePath: string): Promise<ParseResult<File>> {
  const prevEntry = cache.get(filePath);
  const modifiedMs = (await fs.promises.stat(filePath)).mtimeMs;

  if (prevEntry && modifiedMs === prevEntry.lastModifiedMs) {
    return prevEntry.ast;
  }

  const transformed = await esbuild.build({
    entryPoints: [filePath],
    outdir: path.dirname(filePath),
    format: "esm",
    resolveExtensions: supportedExtensions,
    bundle: false,
    write: false,
  });

  const transformedSource = transformed.outputFiles[0];

  if (!transformedSource) {
    throw new Error(
      `@css-extract/prepare.transform(${filePath}): Unable to transform file`
    );
  }

  const ast = parse(transformedSource.text, { sourceType: "module" });

  cache.set(filePath, {
    lastModifiedMs: modifiedMs,
    ast,
  });

  return ast;
}
