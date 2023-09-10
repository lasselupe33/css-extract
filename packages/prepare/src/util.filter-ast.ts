import type { ParseResult } from "@babel/parser";
import _traverse from "@babel/traverse";
import type { File } from "@babel/types";

import type { NodeKey } from "./_trace";
import { nodeToKey } from "./util.node-to-key";

// @ts-expect-error Poor ESM Compatibility
const traverse = _traverse.default as typeof _traverse;

export function removeIrrelevantNodes(
  ast: ParseResult<File>,
  visitedNodes: Set<NodeKey>
) {
  traverse(ast, {
    enter(path) {
      if (["Program", "Directive", "DirectiveLiteral"].includes(path.type)) {
        return;
      }

      if (visitedNodes.has(nodeToKey(path.node))) {
        return;
      }

      path.remove();
    },
  });
}
