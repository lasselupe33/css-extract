import nodePath from "path";
import { promisify } from "util";

import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { supportedExtensions } from "@css-extract/utils";
import resolve from "enhanced-resolve";

import type { TracerEntrypoints } from "..";
import type { TraceContext } from "../core.trace";
import { traceNodes } from "../core.trace";
import { nodeToKey } from "../util.node-to-key";

const resolver = resolve.create({
  extensions: supportedExtensions,
});
const asyncResolve = promisify(resolver);

export async function handleImportSpecifier(
  ctx: TraceContext,
  path: NodePath<t.ImportSpecifier>
) {
  ctx.trackedNodes.add(nodeToKey(path.node));
  ctx.trackedNodes.add(nodeToKey(path.parent));

  await traceNodes([path.get("local"), path.get("imported")], ctx);

  if (!t.isImportDeclaration(path.parent)) {
    return;
  }

  ctx.trackedNodes.add(nodeToKey(path.parent.source));

  if (
    t.isStringLiteral(path.parent.source) &&
    !path.parent.source.value.includes("@css-extract/")
  ) {
    const target = path.parent.source.value;

    try {
      const resolvedTarget = await asyncResolve(
        nodePath.dirname(ctx.filePath),
        target
      );

      if (!resolvedTarget) {
        throw new Error("Cannot resolve target");
      }

      if (resolvedTarget.includes("node_modules")) {
        throw new Error(
          "Node modules are not evaluated in order to improve performance"
        );
      }

      const fileImports =
        ctx.encounteredImports.get(resolvedTarget) ??
        new Map<string, TracerEntrypoints>();

      const fileImportsForParent = (() => {
        const initial = fileImports?.get(ctx.filePath);
        const identifiers = initial?.identifiers ?? new Set();

        identifiers.add(
          t.isLiteral(path.node.imported)
            ? path.node.imported.value
            : path.node.imported.name
        );

        return {
          paths: initial?.paths ?? new Set(),
          identifiers,
        } satisfies TracerEntrypoints;
      })();

      fileImports.set(ctx.filePath, fileImportsForParent);
      ctx.encounteredImports.set(resolvedTarget, fileImports);
    } catch (err) {
      console.warn(
        `handleImportSpecifier(${target}): cannot resolve target`,
        ctx.filePath
      );
    }
  }
}
