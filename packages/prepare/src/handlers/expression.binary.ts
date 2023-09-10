import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import type { TraceContext } from "../_trace";
import { traceNodes } from "../_trace";

export async function handleBinaryExpression(
  ctx: TraceContext,
  path: NodePath<t.BinaryExpression>
) {
  ctx.trackedNodes.add(path.node);

  await traceNodes([path.get("left"), path.get("right")], ctx);
}
