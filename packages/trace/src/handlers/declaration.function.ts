import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import type { TraceContext } from "../core.trace";
import { traceNodes } from "../core.trace";
import { nodeToKey } from "../util.node-to-key";

export async function handleFunctionDeclaration(
  ctx: TraceContext,
  path: NodePath<t.FunctionDeclaration>
) {
  ctx.trackedNodes.add(nodeToKey(path.node));
  ctx.trackedNodes.add(nodeToKey(path.node.body));

  await traceNodes(
    [path.get("id"), ...path.get("body").get("body"), ...path.get("params")],
    ctx
  );
}
