import { fileURLToPath } from "node:url";

import enhancedResolve from "enhanced-resolve";

import { initialize, vfs } from "./backend";
import { prepare } from "./core.prepare";

const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".mts", ".node"];
const resolver = enhancedResolve.create.sync({
  extensions,
});

initialize();

export function resolve(
  specifier: string,
  context: { conditions: string[]; parentURL: string },
  next: (...args: unknown[]) => void
) {
  if (
    specifier.startsWith("/virtual") ||
    context?.parentURL?.startsWith("file:///virtual/")
  ) {
    const url = (() => {
      if (specifier.startsWith(".")) {
        return new URL(specifier, context.parentURL).href;
      } else if (specifier.startsWith("/virtual")) {
        return `file://${specifier}`;
      } else {
        const resolved = resolver(
          context.parentURL.replace("file:///virtual/", ""),
          specifier
        );

        if (!resolved) {
          return `file:///virtual/${specifier}`;
        }

        return `file:///virtual/${resolved}`;
      }
    })();

    return {
      format: "module",
      shortCircuit: true,
      url: url,
    };
  }

  return next(specifier);
}

export async function load(
  url: string,
  context: { format: string; conditions: string[]; parentURL: string },
  next: (...args: unknown[]) => void
) {
  if (!url.startsWith("file:///virtual/")) {
    return next(url, context);
  }

  const path = (() => {
    const rawPath = fileURLToPath(url);

    if (extensions.some((ext) => rawPath.endsWith(ext))) {
      return rawPath.split(".").slice(0, -1).join(".");
    }

    return rawPath;
  })();

  let content = vfs.get(path.replace("/virtual/", ""));
  await prepare(path.replace("/virtual/", ""));

  if (!content) {
    content = vfs.get(path.replace("/virtual/", ""));
  }

  return {
    format: "module",
    shortCircuit: true,
    source: content,
  };
}
