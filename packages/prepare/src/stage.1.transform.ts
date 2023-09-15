import fs from "fs";
import path from "path";

import type { ParseResult } from "@babel/parser";
import { parse } from "@babel/parser";
import type { File } from "@babel/types";
import { supportedExtensions } from "@css-extract/utils";
import esbuild from "esbuild";

export type AST = ParseResult<File>;

type CacheEntry = Promise<{
  lastModifiedMs: number;
  ast: AST;
}>;

const cache = new Map<string, CacheEntry>();

export async function transform(filePath: string): Promise<ParseResult<File>> {
  const prevEntryPromise = cache.get(filePath);
  const modifiedMs = (await fs.promises.stat(filePath)).mtimeMs;

  if (prevEntryPromise) {
    const prevEntry = await prevEntryPromise;

    if (prevEntry && modifiedMs === prevEntry.lastModifiedMs) {
      return prevEntry.ast;
    }
  }

  const astPromise = transformSourceFileToAST(filePath);

  cache.set(
    filePath,
    astPromise.then((ast) => ({
      lastModifiedMs: modifiedMs,
      ast,
    }))
  );

  return await astPromise;
}

async function transformSourceFileToAST(filePath: string) {
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

  return ast;
}
