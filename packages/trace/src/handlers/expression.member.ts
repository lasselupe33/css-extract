import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import type { TraceContext } from "../core.trace";
import { traceNodes } from "../core.trace";
import { nodeToKey } from "../util.node-to-key";

export async function handleMemberExpression(
  ctx: TraceContext,
  path: NodePath<t.MemberExpression>
) {
  ctx.trackedNodes.add(nodeToKey(path.node));

  await traceNodes([path.get("property"), path.get("object")], ctx);
}
