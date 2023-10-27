import type { NodeKey, TracerEntrypoints } from "@css-extract/trace";
import { resolveEntrypoints, traceNodes } from "@css-extract/trace";

import type { AST } from "./stage.1.transform";

type NodeName = string;

const entryPointForASTCache = new WeakMap<AST, Set<NodeName>>();

export async function traceReachableNodes(
  filePath: string,
  ast: AST,
  entrypoints: TracerEntrypoints
) {
  const resolvedEntrypoints = await resolveEntrypoints(ast, entrypoints);
  const reachableNodes = new Set<NodeKey>();
  const encounteredImports = new Map<string, Map<string, TracerEntrypoints>>();

  await traceNodes([...resolvedEntrypoints.paths], {
    trackedNodes: reachableNodes,
    encounteredImports,
    filePath,
  });

  entryPointForASTCache.set(ast, resolvedEntrypoints.names);

  return { reachableNodes, encounteredImports };
}
