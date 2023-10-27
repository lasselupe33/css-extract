import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";
import type { TracerEntrypoints } from "@css-extract/trace";
import { areArraysEqualSets } from "@css-extract/utils";

import { trackDependency, updateFileIteration } from "../core.deps";
import { getVirtualContent } from "../core.loader";
import { vfs } from "../index.backend";

import type { AST } from "./stage.1.transform";
import { transform } from "./stage.1.transform";
import { traceReachableNodes } from "./stage.2.trace";
import { pruneAST } from "./stage.3.prune";

type FilePath = string;
type NodeName = string;

const evaluatedASTs = new WeakSet<AST>();
const requestedExportsCache = new Map<
  FilePath,
  { identifiers: Set<NodeName>; cssPaths: Set<NodePath<t.Node>> }
>();

export async function prepareFile(
  parentPath: string | undefined,
  filePath: string,
  entrypoints?: Omit<TracerEntrypoints, "paths">
): Promise<boolean> {
  const { ast, cssPaths } = await transform(filePath);

  const cached = evaluatedASTs.has(ast);
  const requestedExports = requestedExportsCache.get(filePath) ?? {
    identifiers: new Set(),
    cssPaths: new Set(),
  };

  // In case we already have a pruned AST which contains all the requested
  // exports, then there is no need to re-prepare the file.
  // @todo should we skip this entirely?
  if (
    cached &&
    !entrypoints?.all &&
    [...(entrypoints?.identifiers ?? [])].every((ident) =>
      requestedExports.identifiers.has(ident)
    ) &&
    areArraysEqualSets([...requestedExports.cssPaths], [...cssPaths])
  ) {
    trackDependency(filePath, parentPath);
    return cssPaths.size > 0;
  }

  evaluatedASTs.add(ast);

  for (const entry of entrypoints?.identifiers ?? []) {
    requestedExports.identifiers.add(entry);
  }

  requestedExportsCache.set(filePath, {
    identifiers: requestedExports.identifiers,
    cssPaths,
  });

  const pruned = await (async () => {
    if (cssPaths.size === 0 && requestedExports.identifiers.size === 0) {
      return { code: "" };
    }

    const tracedNodes = await traceReachableNodes(filePath, ast, {
      ...entrypoints,
      paths: cssPaths,
      identifiers: requestedExports.identifiers,
    });

    return {
      code: pruneAST(ast, tracedNodes.reachableNodes).code,
      encounteredImports: tracedNodes.encounteredImports,
    };
  })();

  await updateVFS(filePath, pruned.code);
  trackDependency(filePath, parentPath);

  for (const [filePath, value] of pruned.encounteredImports?.entries() ?? []) {
    for (const [parentPath, entrypoints] of value.entries()) {
      await prepareFile(parentPath, filePath, entrypoints);
    }
  }

  return cssPaths.size > 0;
}

async function updateVFS(filePath: string, code: string) {
  const prev = getVirtualContent(filePath);

  if (prev?.content === code) {
    return;
  }

  const nextIteration = updateFileIteration(filePath);

  vfs.set(filePath, {
    content: code,
    iteration: nextIteration,
  });

  return nextIteration;
}
