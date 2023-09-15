import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import type { TraceContext } from "../core.trace";
import { traceNodes } from "../core.trace";
import { nodeToKey } from "../util.node-to-key";

export async function handleExpressionStatement(
  ctx: TraceContext,
  path: NodePath<t.ExpressionStatement>
) {
  ctx.trackedNodes.add(nodeToKey(path.node));

  await traceNodes(path.get("expression"), ctx);
}
