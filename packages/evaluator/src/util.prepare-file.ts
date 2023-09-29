import fs from "fs";

import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";
import type { TracerEntrypoints } from "@css-extract/trace";
import { areArraysEqualSets } from "@css-extract/utils";

import { depedencyCache, vfs } from "./index.backend";
import type { AST } from "./stage.1.transform";
import { transform } from "./stage.1.transform";
import { traceReachableNodes } from "./stage.2.trace";
import { pruneAST } from "./stage.3.prune";
import { getVirtualContent } from "./virtual-fs-loader";

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
) {
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
    await trackDependency(parentPath, filePath);
    return;
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
  await trackDependency(parentPath, filePath);

  for (const [filePath, value] of pruned.encounteredImports?.entries() ?? []) {
    for (const [parentPath, entrypoints] of value.entries()) {
      await prepareFile(parentPath, filePath, entrypoints);
    }
  }
}

async function updateVFS(filePath: string, code: string) {
  const prev = getVirtualContent(filePath);
  const nextIteration = (prev?.iteration ?? 0) + 1;

  vfs.set(filePath, {
    content: code,
    iteration: nextIteration,
    sourceModifiedAtMs: (await fs.promises.stat(filePath)).mtimeMs,
  });

  return nextIteration;
}

async function trackDependency(
  parentPath: string | undefined,
  filePath: string
) {
  if (!parentPath) {
    return;
  }

  const dependencies = depedencyCache.get(parentPath) ?? new Set();
  dependencies.add(filePath);

  depedencyCache.set(parentPath, dependencies);
}
