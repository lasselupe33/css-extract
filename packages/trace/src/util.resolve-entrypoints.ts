import type { ParseResult } from "@babel/parser";
import type { NodePath } from "@babel/traverse";
import _traverse from "@babel/traverse";
import * as t from "@babel/types";

// @ts-expect-error Poor ESM Compatibility
const traverse = _traverse.default as typeof _traverse;

export type TracerEntrypoints = {
  paths: Set<NodePath<t.Node>>;
  identifiers: Set<string>;
  all?: boolean;
};

export async function resolveEntrypoints(
  ast: ParseResult<t.File>,
  entrypoints: TracerEntrypoints
) {
  const resolvedEntrypoints = (() => {
    const names: Set<string> = new Set();
    const paths: Set<NodePath<t.Node>> = entrypoints.paths;

    const targetedEntrypointIdentifiers = entrypoints.identifiers;

    traverse(ast, {
      // @TODO
      ExportSpecifier: (path) => {
        const value = t.isLiteral(path.node.exported)
          ? path.node.exported.value
          : path.node.exported.name;

        if (entrypoints.all || targetedEntrypointIdentifiers.has(value)) {
          paths.add(path);
          names.add(value);
        }
      },
    });

    return { paths, names };
  })();

  return resolvedEntrypoints;
}
