import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import type { TraceContext } from "../_trace";
import { traceNodes } from "../_trace";

export async function handleExportSpecifier(
  ctx: TraceContext,
  path: NodePath<t.ExportSpecifier>
) {
  ctx.trackedNodes.add(path.node);

  await traceNodes(
    [path.parentPath, path.get("exported"), path.get("local")],
    ctx
  );
}
