import type { TracerEntrypoints } from "@css-extract/trace";
import { areArraysEqualSets } from "@css-extract/utils";

import { vfs } from "./index.backend";
import type { AST } from "./stage.1.transform";
import { transform } from "./stage.1.transform";
import { traceReachableNodes } from "./stage.2.trace";
import { pruneAST } from "./stage.3.prune";

type ParentPath = string;
type NodeName = string;

const prepareCache = new WeakMap<
  AST,
  Record<ParentPath, NodeName[] | undefined>
>();

export async function prepareFile(
  parentPath: string | undefined,
  filePath: string,
  entrypoints: TracerEntrypoints
) {
  const ast = await transform(filePath);

  const cached = prepareCache.get(ast);

  if (
    parentPath &&
    cached?.[parentPath] &&
    entrypoints.type === "imports" &&
    entrypoints.entries !== "all" &&
    areArraysEqualSets(cached[parentPath] ?? [], entrypoints.entries)
  ) {
    return;
  }

  prepareCache.set(ast, {
    ...cached,
    parentPath:
      entrypoints.type === "imports" && entrypoints.entries !== "all"
        ? entrypoints.entries
        : undefined,
  });

  const tracedNodes = await traceReachableNodes(
    parentPath,
    filePath,
    ast,
    entrypoints
  );
  const pruned = pruneAST(ast, tracedNodes);

  const prev = vfs.get(filePath);

  vfs.set(filePath, {
    content: pruned.code,
    iteration: (prev?.iteration ?? 0) + 1,
  });
}
