import nodePath from "path";
import { promisify } from "util";

import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { supportedExtensions } from "@css-extract/utils";
import resolve from "enhanced-resolve";

import type { TraceContext } from "../core.trace";
import { traceNodes } from "../core.trace";
import { nodeToKey } from "../util.node-to-key";

const resolver = resolve.create({
  extensions: supportedExtensions,
});
const asyncResolve = promisify(resolver);

export async function handleImportDeclaration(
  ctx: TraceContext,
  path: NodePath<t.ImportDeclaration>
) {
  ctx.trackedNodes.add(nodeToKey(path.node));

  await traceNodes([path.get("source"), ...path.get("specifiers")], ctx);

  if (
    ctx.onNewFileVisited &&
    t.isStringLiteral(path.node.source) &&
    !path.node.source.value.includes("@css-extract/")
  ) {
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
              value: "",
            } as const;
        }
      });

      await ctx.onNewFileVisited(ctx.filePath, resolvedTarget, {
        paths: [],
        identifiers: specifiers
          .filter((it) => it.type === "specifier")
          .map((it) => it.value),
        all: specifiers.some((it) => it.type === "all"),
      });
    } catch (err) {
      console.warn(`handleCallExpression.require(${target}): cannot resolve`);
    }
  }
}
