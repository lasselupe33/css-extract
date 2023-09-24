import type { TracerEntrypoints } from "@css-extract/trace";
import { areArraysEqualSets } from "@css-extract/utils";

import { vfs } from "./index.backend";
import type { AST } from "./stage.1.transform";
import { transform } from "./stage.1.transform";
import { traceReachableNodes } from "./stage.2.trace";
import { pruneAST } from "./stage.3.prune";

type FilePath = string;
type NodeName = string;

const evaluatedASTs = new WeakSet<AST>();
const requestedExportsCache = new Map<FilePath, Set<NodeName>>();

export async function prepareFile(
  parentPath: string | undefined,
  filePath: string,
  entrypoints: TracerEntrypoints
) {
  const ast = await transform(filePath);

  const cached = evaluatedASTs.has(ast);
  const requestedExports =
    requestedExportsCache.get(filePath) ?? new Set<string>();

  // In case we already have a pruned AST which contains all the requested
  // exports, then there is no need to re-prepare the file.
  if (
    cached &&
    !entrypoints.all &&
    entrypoints.paths.length === 0 &&
    areArraysEqualSets([...requestedExports], entrypoints.identifiers)
  ) {
    trackDependency(parentPath, filePath);
    return;
  }

  evaluatedASTs.add(ast);

  for (const entry of entrypoints.identifiers) {
    requestedExports.add(entry);
  }
  requestedExportsCache.set(filePath, requestedExports);

  const tracedNodes = await traceReachableNodes(filePath, ast, {
    ...entrypoints,
    identifiers: [...requestedExports],
  });
  const pruned = pruneAST(ast, tracedNodes);

  const prev = vfs.get(filePath);

  vfs.set(filePath, {
    content: pruned.code,
    iteration: (prev?.iteration ?? 0) + 1,
    dependencies: prev?.dependencies ?? new Set(),
  });

  trackDependency(parentPath, filePath);
}

function trackDependency(parentPath: string | undefined, filePath: string) {
  if (!parentPath) {
    return;
  }

  const prevParentData = vfs.get(parentPath);

  const deps = prevParentData?.dependencies ?? new Set();
  deps.add(filePath);

  vfs.set(parentPath, {
    content: "",
    iteration: 0,
    ...prevParentData,
    dependencies: deps,
  });
}
