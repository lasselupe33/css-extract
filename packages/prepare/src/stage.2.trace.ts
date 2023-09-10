import type { NodePath } from "@babel/traverse";
import _traverse from "@babel/traverse";
import * as t from "@babel/types";

import type { NodeKey } from "./_trace";
import { traceNodes } from "./_trace";
import type { AST } from "./stage.1.transform";

// @ts-expect-error Poor ESM Compatibility
const traverse = _traverse.default as typeof _traverse;

export type TracerEntrypoints =
  | {
      type: "paths";
      entries: NodePath<t.Node>[];
    }
  | {
      type: "imports";
      entries: "all" | string[];
    };

type NodeName = string;

const reachableNodesCache = new WeakMap<AST, Set<NodeKey>>();
const entryPointForASTCache = new WeakMap<AST, NodeName[]>();

export async function traceReachableNodes(
  filePath: string,
  ast: AST,
  entrypoints: TracerEntrypoints
) {
  const prevEntrypoints = entryPointForASTCache.get(ast);

  const resolvedEntrypoints = (() => {
    const names: string[] = [];
    const entries: NodePath<t.Node>[] =
      entrypoints.type === "paths" ? entrypoints.entries : [];

    const targetedEntrypointIdentifiers = [
      ...(prevEntrypoints?.values() ?? []),
      entrypoints.type === "imports" ? entrypoints.entries : [],
    ].flatMap((it) => it);

    const includeAll = targetedEntrypointIdentifiers.some((it) => it === "all");

    traverse(ast, {
      // @TODO
      ExportSpecifier: (path) => {
        const value = t.isLiteral(path.node.exported)
          ? path.node.exported.value
          : path.node.exported.name;

        if (includeAll || targetedEntrypointIdentifiers.includes(value)) {
          entries.push(path);
          names.push(value);
        }
      },
    });

    return { entries, names };
  })();

  const shouldRestart =
    !prevEntrypoints ||
    prevEntrypoints.some(
      (entrypoint) => !resolvedEntrypoints.names.includes(entrypoint)
    );

  const reachableNodes = shouldRestart
    ? new Set<NodeKey>()
    : reachableNodesCache.get(ast) ?? new Set<NodeKey>();

  await traceNodes(resolvedEntrypoints.entries, {
    trackedNodes: reachableNodes,
    filePath,
  });

  reachableNodesCache.set(ast, reachableNodes);

  return reachableNodes;
}
