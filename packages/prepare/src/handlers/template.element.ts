import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import { type TraceContext } from "../_trace";

export async function handleTemplateElement(
  ctx: TraceContext,
  path: NodePath<t.TemplateElement>
) {
  ctx.trackedNodes.add(path.node);
}
