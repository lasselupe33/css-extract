import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import type { TraceContext } from "../_trace";
import { traceNodes } from "../_trace";
import { nodeToKey } from "../util.node-to-key";

export async function handleVariableDeclarator(
  ctx: TraceContext,
  path: NodePath<t.VariableDeclarator>
) {
  ctx.trackedNodes.add(nodeToKey(path.parent));
  ctx.trackedNodes.add(nodeToKey(path.node));

  await traceNodes([path.get("init"), path.get("id")], ctx);
}
