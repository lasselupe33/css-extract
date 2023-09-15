import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import type { TraceContext } from "../core.trace";
import { traceNodes } from "../core.trace";
import { nodeToKey } from "../util.node-to-key";

export async function handleImportSpecifier(
  ctx: TraceContext,
  path: NodePath<t.ImportSpecifier>
) {
  ctx.trackedNodes.add(nodeToKey(path.node));

  await traceNodes(
    [path.parentPath, path.get("local"), path.get("imported")],
    ctx
  );
}
