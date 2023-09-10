import type { ParseResult } from "@babel/parser";
import _traverse from "@babel/traverse";
import type { File, Node } from "@babel/types";

// @ts-expect-error Poor ESM Compatibility
const traverse = _traverse.default as typeof _traverse;

export function removeIrrelevantNodes(
  ast: ParseResult<File>,
  visitedNodes: Set<Node>
) {
  traverse(ast, {
    enter(path) {
      if (["Program", "Directive", "DirectiveLiteral"].includes(path.type)) {
        return;
      }

      if (visitedNodes.has(path.node)) {
        return;
      }

      path.remove();
    },
  });
}
