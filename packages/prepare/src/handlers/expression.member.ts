import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import type { TraceContext } from "../_trace";
import { traceNodes } from "../_trace";

export async function handleMemberExpression(
  ctx: TraceContext,
  path: NodePath<t.MemberExpression>
) {
  ctx.trackedNodes.add(path.node);

  await traceNodes([path.get("property"), path.get("object")], ctx);
}
