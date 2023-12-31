import _generate from "@babel/generator";
import type { NodeKey } from "@css-extract/trace";

import { removeIrrelevantNodes } from "../util.filter-ast";

import type { AST } from "./stage.1.transform";

// @ts-expect-error Poor ESM Compatibility
const generate = _generate.default as typeof _generate;

export function pruneAST(ast: AST, reachableNodes: Set<NodeKey>) {
  const clonedAST = structuredClone(ast);

  removeIrrelevantNodes(clonedAST, reachableNodes);

  const source = generate(clonedAST.program);
  return source;
}
