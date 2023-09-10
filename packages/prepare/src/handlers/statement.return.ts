import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import type { TraceContext } from "../_trace";
import { traceNodes } from "../_trace";

export async function handleReturnStatement(
  ctx: TraceContext,
  path: NodePath<t.ReturnStatement>
) {
  ctx.trackedNodes.add(path.node);

  await traceNodes(path.get("argument"), ctx);
}
