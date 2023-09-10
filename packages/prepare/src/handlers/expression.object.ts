import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import type { TraceContext } from "../_trace";
import { traceNodes } from "../_trace";

export async function handleObjectExpression(
  ctx: TraceContext,
  path: NodePath<t.ObjectExpression>
) {
  ctx.trackedNodes.add(path.node);

  await traceNodes(path.get("properties"), ctx);
}
