import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

import type { TraceContext } from "../core.trace";
import { traceNodes } from "../core.trace";
import { nodeToKey } from "../util.node-to-key";

export async function handleExportSpecifier(
  ctx: TraceContext,
  path: NodePath<t.ExportSpecifier>
) {
  ctx.trackedNodes.add(nodeToKey(path.node));
  ctx.trackedNodes.add(nodeToKey(path.parent));

  if (
    t.isExportDeclaration(path.parent) &&
    "source" in path.parent &&
    path.parent.source
  ) {
    ctx.trackedNodes.add(nodeToKey(path.parent.source));
  }

  await traceNodes([path.get("exported"), path.get("local")], ctx);
}
