import type { TracerEntrypoints } from "@css-extract/trace";
import { areArraysEqualSets } from "@css-extract/utils";

import { vfs } from "./index.backend";
import type { AST } from "./stage.1.transform";
import { transform } from "./stage.1.transform";
import { traceReachableNodes } from "./stage.2.trace";
import { pruneAST } from "./stage.3.prune";

type FilePath = string;
type ParentPath = string;
type NodeName = string;

const evaluatedASTs = new WeakSet<AST>();
const requestedExportsCache = new Map<
  FilePath,
  Record<ParentPath, NodeName[] | undefined>
>();

export async function prepareFile(
  parentPath: string | undefined,
  filePath: string,
  entrypoints: TracerEntrypoints
) {
  const ast = await transform(filePath);

  const cached = evaluatedASTs.has(ast);
  const requestedExports = requestedExportsCache.get(filePath);

  const allRequestedEntrypoints = Object.values(requestedExports ?? {})
    .flatMap((it) => it)
    .filter((it): it is string => !!it);

  // @todo
  if (
    (cached && !parentPath) ||
    (cached &&
      parentPath &&
      !requestedExports?.[parentPath] &&
      entrypoints.type === "imports" &&
      entrypoints.entries !== "all" &&
      entrypoints.entries.every((requestEntry) =>
        allRequestedEntrypoints.includes(requestEntry)
      )) ||
    (parentPath &&
      requestedExports?.[parentPath] &&
      entrypoints.type === "imports" &&
      entrypoints.entries !== "all" &&
      areArraysEqualSets(
        requestedExports[parentPath] ?? [],
        entrypoints.entries
      ))
  ) {
    trackDependency(parentPath, filePath);
    return;
  }

  evaluatedASTs.add(ast);
  requestedExportsCache.set(filePath, {
    ...requestedExports,
    [parentPath ?? ""]:
      entrypoints.type === "imports" && entrypoints.entries !== "all"
        ? entrypoints.entries
        : undefined,
  });

  const tracedNodes = await traceReachableNodes(
    parentPath,
    filePath,
    ast,
    // @todo, add new entrypoint which points to all previous entrypoints. But,
    // we also need to import previous entrypoints, right?
    entrypoints.entries.length === 0
      ? { type: "imports", entries: allRequestedEntrypoints }
      : entrypoints
  );
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