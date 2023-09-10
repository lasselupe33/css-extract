import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import type { TraceContext } from "../_trace";
import { traceNodes } from "../_trace";

export async function handleExpressionStatement(
  ctx: TraceContext,
  path: NodePath<t.ExpressionStatement>
) {
  ctx.trackedNodes.add(path.node);

  await traceNodes(path.get("expression"), ctx);
}
