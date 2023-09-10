import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import type { TraceContext } from "../_trace";
import { traceNodes } from "../_trace";

export async function handleTaggedTemplateExpression(
  ctx: TraceContext,
  path: NodePath<t.TaggedTemplateExpression>
) {
  ctx.trackedNodes.add(path.node);

  await traceNodes([path.get("tag"), path.get("quasi")], ctx);
}
