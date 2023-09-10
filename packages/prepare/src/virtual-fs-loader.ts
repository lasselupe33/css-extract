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
        return `${
          new URL(specifier, context.parentURL).href
        }?bust=${Math.random()}`;
      } else if (specifier.startsWith("/virtual")) {
        return `file://${specifier}?bust=${Math.random()}`;
      } else {
        const resolved = resolver(
          context.parentURL.replace("file:///virtual/", ""),
          specifier
        );

        if (!resolved) {
          return `file:///virtual/${specifier}?bust=${Math.random()}`;
        }

        return `file:///virtual/${resolved}?bust=${Math.random()}`;
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

  const path = fileURLToPath(url).replace("/virtual/", "");

  const content =
    vfs.get(path) ||
    supportedExtensions
      .map((ext) => vfs.get(`${path}${ext}`))
      .find((content) => !!content);

  return {
    format: "module",
    shortCircuit: true,
    source: content,
  };
}

demo(path.join(TEMP_ROOT, "dummy", "package", "src", "shaker.ts"));
