import _generate from "@babel/generator";
import type { NodePath } from "@babel/traverse";
import _traverse from "@babel/traverse";
import * as t from "@babel/types";

import { traceNodes } from "./_trace";
import { vfs } from "./backend";
import { removeIrrelevantNodes } from "./util.filter-ast";
import { generateAST } from "./util.generate-ast";

// @ts-expect-error Poor ESM Compatibility
const traverse = _traverse.default as typeof _traverse;
// @ts-expect-error Poor ESM Compatibility
const generate = _generate.default as typeof _generate;

export type ShakerEntrypoints =
  | {
      type: "paths";
      entries: NodePath<t.Node>[];
    }
  | {
      type: "imports";
      entries: "all" | string[];
    };

export async function shake(filePath: string, entrypoints: ShakerEntrypoints) {
  if (vfs.has(filePath)) {
    return;
  }

  const ast = await generateAST(filePath);

  if (!ast) {
    return;
  }

  const resolvedEntrypoints = (() => {
    if (entrypoints.type === "paths") {
      return entrypoints.entries;
    }

    const entries: NodePath<t.Node>[] = [];

    traverse(ast, {
      // @TODO
      ExportSpecifier: (path) => {
        const value = t.isLiteral(path.node.exported)
          ? path.node.exported.value
          : path.node.exported.name;

        if (
          entrypoints.entries === "all" ||
          entrypoints.entries.includes(value)
        ) {
          entries.push(path);
        }
      },
    });

    return entries;
  })();

  const nodes = await traceNodes(resolvedEntrypoints, {
    trackedNodes: new Set(),
    filePath,
  });

  removeIrrelevantNodes(ast, nodes);

  const source = generate(ast.program);

  vfs.set(filePath, source.code);
}

export async function prepare(file: string) {
  const ast = await generateAST(file);

  if (!ast) {
    return;
  }

  const entries: Array<NodePath<t.Node>> = [];

  traverse(ast, {
    ExpressionStatement: (path) => {
      if (
        t.isTaggedTemplateExpression(path.node.expression) &&
        t.isIdentifier(path.node.expression.tag) &&
        path.node.expression.tag.name === "css"
      ) {
        entries.push(path);
      }
    },

    VariableDeclarator: (path) => {
      if (
        t.isTaggedTemplateExpression(path.node.init) &&
        t.isIdentifier(path.node.init.tag) &&
        path.node.init.tag.name === "css"
      ) {
        entries.push(path.parentPath);
      }
    },
  });

  await shake(file, { type: "paths", entries });
}
