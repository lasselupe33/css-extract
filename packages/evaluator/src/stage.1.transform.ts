import fs from "fs";
import path from "path";

import type { ParseResult } from "@babel/parser";
import { parse } from "@babel/parser";
import type { NodePath } from "@babel/traverse";
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
  cssPaths: NodePath<t.Node>[];
}>;

const cache = new Map<string, CacheEntry>();

export async function transform(
  filePath: string
): Promise<{ cssPaths: NodePath<t.Node>[]; ast: AST }> {
  const prevEntryPromise = cache.get(filePath);
  const modifiedMs = (await fs.promises.stat(filePath)).mtimeMs;

  if (prevEntryPromise) {
    const prevEntry = await prevEntryPromise;

    if (prevEntry && modifiedMs === prevEntry.lastModifiedMs) {
      return prevEntry;
    }
  }

  const astPromise = transformSourceFileToAST(filePath);

  cache.set(
    filePath,
    astPromise.then(({ ast, cssPaths }) => ({
      lastModifiedMs: modifiedMs,
      ast,
      cssPaths,
    }))
  );

  return await astPromise;
}

async function transformSourceFileToAST(filePath: string) {
  const transformed = await esbuild.build({
    // @todo implement pre stage that collects all entrypoints so we can do
    // this once instead of multiple times.
    entryPoints: [filePath],
    outdir: path.dirname(filePath),
    format: "esm",
    target: "node18",
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
  const cssPaths: NodePath<t.Node>[] = [];

  let index = 0;

  traverse(ast, {
    TaggedTemplateExpression: (path) => {
      if (!t.isIdentifier(path.node.tag) || path.node.tag.name !== "css") {
        return;
      }

      if (path.parent.type !== "MemberExpression") {
        const importDeclaration = path.scope.getBinding(path.node.tag.name)
          ?.path.parent;

        // In case we're visiting something that is NOT our own css`` tag,
        // then bail out on transformations
        if (
          !t.isImportDeclaration(importDeclaration) ||
          importDeclaration.source.value !== "@css-extract/core"
        ) {
          return;
        }

        const name = (() => {
          if (
            t.isVariableDeclarator(path.parent) &&
            t.isIdentifier(path.parent.id)
          ) {
            return path.parent.id.name;
          }

          return undefined;
        })();

        const added = path.replaceWith(
          t.callExpression(
            t.memberExpression(path.node, t.identifier("process")),
            [
              t.objectExpression([
                t.objectProperty(
                  t.identifier("fileName"),
                  t.stringLiteral(filePath)
                ),
                t.objectProperty(
                  t.identifier("name"),
                  name ? t.stringLiteral(name) : t.nullLiteral()
                ),
                t.objectProperty(
                  t.identifier("index"),
                  t.numericLiteral(index++)
                ),
              ]),
            ]
          )
        );

        cssPaths.push(path.parentPath, ...added);
      }
    },
  });

  return { ast, cssPaths };
}
