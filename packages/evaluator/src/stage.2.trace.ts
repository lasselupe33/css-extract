import type { NodeKey, TracerEntrypoints } from "@css-extract/trace";
import { resolveEntrypoints, traceNodes } from "@css-extract/trace";

import type { AST } from "./stage.1.transform";
import { prepareFile } from "./util.prepare-file";

type NodeName = string;

const entryPointForASTCache = new WeakMap<AST, NodeName[]>();

export async function traceReachableNodes(
  filePath: string,
  ast: AST,
  entrypoints: TracerEntrypoints
) {
  const resolvedEntrypoints = await resolveEntrypoints(ast, entrypoints);
  const reachableNodes = new Set<NodeKey>();

  await traceNodes([...resolvedEntrypoints.paths], {
    trackedNodes: reachableNodes,
    filePath,
    onNewFileVisited: prepareFile,
  });

  entryPointForASTCache.set(ast, resolvedEntrypoints.names);

  return reachableNodes;
}
