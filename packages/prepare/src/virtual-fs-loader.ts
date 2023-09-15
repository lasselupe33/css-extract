import path from "node:path";
import { fileURLToPath } from "node:url";

import { supportedExtensions } from "@css-extract/utils";
import enhancedResolve from "enhanced-resolve";

import { initialize, vfs } from "./index.backend";
import { demo } from "./index.debug";

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

    console.debug("[LOAD]", url, content.iteration);

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

// initialize();
const TEMP_ROOT = "/Users/lassefelskovagersten/Code/misc/css-extractor";

demo(path.join(TEMP_ROOT, "dummy", "package", "src", "shaker.ts"));
