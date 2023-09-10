import type { NodePath } from "@babel/traverse";
import _traverse from "@babel/traverse";
import * as t from "@babel/types";

import { transform } from "./stage.1.transform";
import type { TracerEntrypoints } from "./stage.2.trace";

// @ts-expect-error Poor ESM Compatibility
const traverse = _traverse.default as typeof _traverse;

export async function resolveEntrypoints(
  file: string
): Promise<TracerEntrypoints> {
  const ast = await transform(file);

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

  return { type: "paths", entries };
}
