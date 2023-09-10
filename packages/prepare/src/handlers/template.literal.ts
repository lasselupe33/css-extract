import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import { traceNodes, type TraceContext } from "../_trace";
import { nodeToKey } from "../util.node-to-key";

export async function handleTemplateLiteral(
  ctx: TraceContext,
  path: NodePath<t.TemplateLiteral>
) {
  ctx.trackedNodes.add(nodeToKey(path.node));

  await traceNodes([...path.get("expressions"), ...path.get("quasis")], ctx);
}
