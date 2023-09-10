import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import type { TraceContext } from "../_trace";
import { traceNodes } from "../_trace";

export async function handleVariableDeclarator(
  ctx: TraceContext,
  path: NodePath<t.VariableDeclarator>
) {
  ctx.trackedNodes.add(path.parent);
  ctx.trackedNodes.add(path.node);

  await traceNodes([path.get("init"), path.get("id")], ctx);
}
