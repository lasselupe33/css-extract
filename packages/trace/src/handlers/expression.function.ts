import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import type { TraceContext } from "../core.trace";
import { traceNodes } from "../core.trace";
import { nodeToKey } from "../util.node-to-key";

export async function handleFunctionExpression(
  ctx: TraceContext,
  path: NodePath<t.FunctionExpression>
) {
  ctx.trackedNodes.add(nodeToKey(path.node));

  await traceNodes(
    [path.get("id"), ...path.get("params"), path.get("body")],
    ctx
  );
}
