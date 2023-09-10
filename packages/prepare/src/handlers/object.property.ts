import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import type { TraceContext } from "../_trace";
import { traceNodes } from "../_trace";

export async function handleObjectProperty(
  ctx: TraceContext,
  path: NodePath<t.ObjectProperty>
) {
  ctx.trackedNodes.add(path.node);

  await traceNodes([path.get("key"), path.get("value")], ctx);
}
