import fs from "fs";
import path from "path";

import type { ParseResult } from "@babel/parser";
import { parse } from "@babel/parser";
import type { NodePath, Visitor } from "@babel/traverse";
import _traverse from "@babel/traverse";
import type { File } from "@babel/types";
import * as t from "@babel/types";
import { supportedExtensions } from "@css-extract/utils";
import esbuild from "esbuild";

// @ts-expect-error Poor ESM Compatibility
const traverse = _traverse.default as typeof _traverse;

export type AST = ParseResult<File>;

type CacheEntry = Promise<{
  lastModifiedMs: number;
  ast: AST;
}>;

type TransformVisitors = Omit<Visitor, "TaggedTemplateExpression"> & {
  TaggedTemplateExpression: (
    path: NodePath<t.TaggedTemplateExpression>,
    addedPaths: NodePath<t.Node>[]
  ) => void;
};

const cache = new Map<string, CacheEntry>();

export async function transform(
  filePath: string,
  visitors?: TransformVisitors
): Promise<ParseResult<File>> {
  const prevEntryPromise = cache.get(filePath);
  const modifiedMs = (await fs.promises.stat(filePath)).mtimeMs;

  if (prevEntryPromise) {
    const prevEntry = await prevEntryPromise;

    if (prevEntry && modifiedMs === prevEntry.lastModifiedMs) {
      return prevEntry.ast;
    }
  }

  const astPromise = transformSourceFileToAST(filePath, visitors);

  cache.set(
    filePath,
    astPromise.then((ast) => ({
      lastModifiedMs: modifiedMs,
      ast,
    }))
  );

  return await astPromise;
}

async function transformSourceFileToAST(
  filePath: string,
  visitors?: TransformVisitors
) {
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
      `@css-extract/evaluator.transform(${filePath}): Unable to transform file`
    );
  }

  const ast = parse(transformedSource.text, { sourceType: "module" });

  traverse(ast, {
    ...visitors,
    TaggedTemplateExpression: (path) => {
      if (t.isIdentifier(path.node.tag) && path.node.tag.name === "css") {
        if (path.parent.type !== "MemberExpression") {
          const added = path.replaceWith(
            t.callExpression(
              t.memberExpression(path.node, t.identifier("process")),
              [
                t.objectExpression([
                  t.objectProperty(
                    t.identifier("fileName"),
                    t.stringLiteral(filePath)
                  ),
                ]),
              ]
            )
          );

          visitors?.TaggedTemplateExpression?.(path, added);
        }
      } else {
        visitors?.TaggedTemplateExpression?.(path, []);
      }
    },
  });

  return ast;
}
