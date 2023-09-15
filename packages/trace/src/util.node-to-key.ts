import type { Node } from "@babel/types";

export type NodeKey =
  `${string}-${string},${string}:${string}@${string},${string}:${string}`;

export function nodeToKey(node: Node): NodeKey {
  if (!node.loc) {
    return JSON.stringify(node) as NodeKey;
  }

  return `${node.type}-${node.loc.start.line},${node.loc.start.column}:${node.loc.start.index}@${node.loc.end.line},${node.loc.end.column}:${node.loc.end.index}`;
}
