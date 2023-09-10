import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import { type TraceContext } from "../_trace";
import { nodeToKey } from "../util.node-to-key";

export async function handleTemplateElement(
  ctx: TraceContext,
  path: NodePath<t.TemplateElement>
) {
  ctx.trackedNodes.add(nodeToKey(path.node));
}
