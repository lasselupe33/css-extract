import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import { traceNodes, type TraceContext } from "../_trace";

export async function handleIdentifier(
  ctx: TraceContext,
  path: NodePath<t.Identifier>
) {
  ctx.trackedNodes.add(path.node);

  await traceNodes(path.scope.getBinding(path.node.name)?.path, ctx);
}
