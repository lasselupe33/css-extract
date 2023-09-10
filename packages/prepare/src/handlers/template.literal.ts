import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import { traceNodes, type TraceContext } from "../_trace";

export async function handleTemplateLiteral(
  ctx: TraceContext,
  path: NodePath<t.TemplateLiteral>
) {
  ctx.trackedNodes.add(path.node);

  await traceNodes([...path.get("expressions"), ...path.get("quasis")], ctx);
}
