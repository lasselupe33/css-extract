import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import type { TraceContext } from "../_trace";
import { traceNodes } from "../_trace";

export async function handleFunctionDeclaration(
  ctx: TraceContext,
  path: NodePath<t.FunctionDeclaration>
) {
  ctx.trackedNodes.add(path.node);
  ctx.trackedNodes.add(path.node.body);

  await traceNodes(
    [path.get("id"), ...path.get("body").get("body"), ...path.get("params")],
    ctx
  );
}
