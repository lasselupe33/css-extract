import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import type { TraceContext } from "../core.trace";
import { nodeToKey } from "../util.node-to-key";

export async function handleLiteral(
  ctx: TraceContext,
  path: NodePath<
    | t.BigIntLiteral
    | t.BooleanLiteral
    | t.DecimalLiteral
    | t.NullLiteral
    | t.NumericLiteral
    | t.NumberLiteral
    | t.RegexLiteral
    | t.RegExpLiteral
    | t.StringLiteral
  >
) {
  ctx.trackedNodes.add(nodeToKey(path.node));
}
