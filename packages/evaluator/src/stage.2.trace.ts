import type { NodeKey, TracerEntrypoints } from "@css-extract/trace";
import { resolveEntrypoints, traceNodes } from "@css-extract/trace";

import type { AST } from "./stage.1.transform";
import { prepareFile } from "./util.prepare-file";

type NodeName = string;

const reachableNodesCache = new WeakMap<AST, Set<NodeKey>>();
const entryPointForASTCache = new WeakMap<AST, NodeName[]>();

export async function traceReachableNodes(
  filePath: string,
  ast: AST,
  entrypoints: TracerEntrypoints
) {
  const prevEntrypoints = entryPointForASTCache.get(ast);

  const resolvedEntrypoints = await resolveEntrypoints(ast, entrypoints);

  const shouldRestart = prevEntrypoints?.some(
    (entrypoint) => !resolvedEntrypoints.names.includes(entrypoint)
  );

  const reachableNodes = shouldRestart
    ? new Set<NodeKey>()
    : reachableNodesCache.get(ast) ?? new Set<NodeKey>();

  await traceNodes([...resolvedEntrypoints.paths], {
    trackedNodes: reachableNodes,
    filePath,
    onNewFileVisited: prepareFile,
  });

  entryPointForASTCache.set(ast, resolvedEntrypoints.names);
  reachableNodesCache.set(ast, reachableNodes);

  return reachableNodes;
}
