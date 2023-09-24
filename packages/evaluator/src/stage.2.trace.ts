import type { NodeKey, TracerEntrypoints } from "@css-extract/trace";
import { resolveEntrypoints, traceNodes } from "@css-extract/trace";

import type { AST } from "./stage.1.transform";
import { prepareFile } from "./util.prepare-file";

type ParentName = string;
type NodeName = string;

const reachableNodesCache = new WeakMap<AST, Set<NodeKey>>();
const entryPointForASTCache = new WeakMap<
  AST,
  Record<ParentName, NodeName[]>
>();

export async function traceReachableNodes(
  parentPath: string | undefined,
  filePath: string,
  ast: AST,
  entrypoints: TracerEntrypoints
) {
  const prevEntrypoints = entryPointForASTCache.get(ast);
  const prevEntrypointsForParent = prevEntrypoints?.[parentPath ?? ""];

  const additionalEntrypoints = Object.values(prevEntrypoints ?? {}).flatMap(
    (it) => it
  );

  const resolvedEntrypoints = await resolveEntrypoints(
    ast,
    entrypoints,
    additionalEntrypoints
  );

  const shouldRestart = prevEntrypointsForParent?.some(
    (entrypoint) => !resolvedEntrypoints.names.includes(entrypoint)
  );

  const reachableNodes = shouldRestart
    ? new Set<NodeKey>()
    : reachableNodesCache.get(ast) ?? new Set<NodeKey>();

  await traceNodes(
    [...resolvedEntrypoints.entries, ...resolvedEntrypoints.additional],
    {
      trackedNodes: reachableNodes,
      filePath,
      onNewFileVisited: prepareFile,
    }
  );

  entryPointForASTCache.set(ast, {
    ...prevEntrypoints,
    parentPath: resolvedEntrypoints.names,
  });
  reachableNodesCache.set(ast, reachableNodes);

  return reachableNodes;
}
