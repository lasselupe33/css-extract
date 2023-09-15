import type { ParseResult } from "@babel/parser";
import type { NodePath } from "@babel/traverse";
import _traverse from "@babel/traverse";
import * as t from "@babel/types";

// @ts-expect-error Poor ESM Compatibility
const traverse = _traverse.default as typeof _traverse;

export type TracerEntrypoints =
  | {
      type: "paths";
      entries: NodePath<t.Node>[];
    }
  | {
      type: "imports";
      entries: "all" | string[];
    };

export async function resolveEntrypoints(
  ast: ParseResult<t.File>,
  entrypoints: TracerEntrypoints,
  additionalEntrypoints?: string[]
) {
  const resolvedEntrypoints = (() => {
    const names: string[] = [];
    const entries: NodePath<t.Node>[] =
      entrypoints.type === "paths" ? entrypoints.entries : [];
    const additional: NodePath<t.Node>[] = [];

    const targetedEntrypointIdentifiers = [
      entrypoints.type === "imports" ? entrypoints.entries : [],
    ].flatMap((it) => it);

    const includeAll = targetedEntrypointIdentifiers.some((it) => it === "all");

    traverse(ast, {
      // @TODO
      ExportSpecifier: (path) => {
        const value = t.isLiteral(path.node.exported)
          ? path.node.exported.value
          : path.node.exported.name;

        if (includeAll || targetedEntrypointIdentifiers.includes(value)) {
          entries.push(path);
          names.push(value);
        }

        if (additionalEntrypoints?.includes(value)) {
          additional.push(path);
        }
      },
    });

    return { entries, names, additional };
  })();

  return resolvedEntrypoints;
}
