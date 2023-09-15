import path from "node:path";
import { fileURLToPath } from "node:url";

import enhancedResolve from "enhanced-resolve";

import { demo } from "./_root";
import { initialize, vfs } from "./backend";
import { supportedExtensions } from "./constant.extensions";
import { TEMP_ROOT } from "./util.generate-ast";

const resolver = enhancedResolve.create.sync({
  extensions: supportedExtensions,
});

// initialize();

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
        return `${new URL(specifier, context.parentURL).href}`;
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

    const path = fileURLToPath(url).replace("/virtual/", "");
    const content = getVirtualContent(path);

    if (!content) {
      return next(specifier);
    }

    return {
      format: "module",
      shortCircuit: true,
      url: `${url}?iteration=${content.iteration}`,
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

  const path = fileURLToPath(url).replace("/virtual/", "");
  const content = getVirtualContent(path);

  return {
    format: "module",
    shortCircuit: true,
    source: content?.content,
  };
}

function getVirtualContent(path: string) {
  return (
    vfs.get(path) ||
    supportedExtensions
      .map((ext) => vfs.get(`${path}${ext}`))
      .find((content) => !!content)
  );
}

demo(path.join(TEMP_ROOT, "dummy", "package", "src", "shaker.ts"));
