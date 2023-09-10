import nodePath from "path";
import { promisify } from "util";

import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import resolve from "enhanced-resolve";

import type { TraceContext } from "../_trace";
import { traceNodes } from "../_trace";
import { shake } from "../core.prepare";

const resolver = resolve.create({
  extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".mts", ".node"],
});
const asyncResolve = promisify(resolver);

export async function handleImportDeclaration(
  ctx: TraceContext,
  path: NodePath<t.ImportDeclaration>
) {
  ctx.trackedNodes.add(path.node);

  await traceNodes([path.get("source"), ...path.get("specifiers")], ctx);

  if (t.isStringLiteral(path.node.source)) {
    const target = path.node.source.value;

    try {
      const resolvedTarget = await asyncResolve(
        nodePath.dirname(ctx.filePath),
        target
      );

      if (!resolvedTarget) {
        throw new Error("Cannot resolve target");
      }

      const specifiers = path.node.specifiers.map((specifier) => {
        switch (specifier.type) {
          case "ImportSpecifier":
            return {
              type: "specifier",
              value: t.isLiteral(specifier.imported)
                ? specifier.imported.value
                : specifier.imported.name,
            } as const;

          case "ImportDefaultSpecifier":
          case "ImportNamespaceSpecifier":
            return {
              type: "all",
            } as const;
        }
      });

      const entries = specifiers.find((it) => it.type === "all")
        ? "all"
        : specifiers.map((it) => it.value).filter((it): it is string => !!it);

      const resolvedWithoutExtension = resolvedTarget
        .split(".")
        .slice(0, -1)
        .join(".");

      await shake(resolvedWithoutExtension, {
        type: "imports",
        entries,
      });
    } catch (err) {
      console.warn(`handleCallExpression.require(${target}): cannot resolve`);
    }
  }
}
