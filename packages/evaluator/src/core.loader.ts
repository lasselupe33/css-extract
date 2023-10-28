import { fileURLToPath, pathToFileURL } from "node:url";

import { supportedExtensions } from "@css-extract/utils";
import enhancedResolve from "enhanced-resolve";

import { getFileIteration } from "./core.deps";
import { initialize } from "./index.backend";
import { demo } from "./index.debug";
import { vfs } from "./util.virtual-file-system";

const resolver = enhancedResolve.create.sync({
  extensions: supportedExtensions,
});

initialize();
// demo();

export function resolve(
  specifier: string,
  context: { conditions: string[]; parentURL: string | undefined },
  next: (...args: unknown[]) => void
) {
  // We always want to use our original implementations of css-extract. No need
  // to run these in a virtual environment.
  if (specifier.includes("@css-extract/")) {
    try {
      const resolved = resolver(
        context.parentURL?.replace("file:///virtual/", "") ?? process.cwd(),
        specifier
      );

      return next(
        resolved ? pathToFileURL(resolved).pathname : specifier,
        context
      );
    } catch {
      return next(specifier, context);
    }
  }

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
          context.parentURL?.replace("file:///virtual/", "") ?? process.cwd(),
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
      return next(specifier, context);
    }

    const pathURL = new URL(url);
    pathURL.searchParams.set("iteration", `${getFileIteration(path)}`);

    return {
      format: "module",
      shortCircuit: true,
      url: pathURL.href,
    };
  }

  return next(specifier, context);
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

export function getVirtualContent(path: string, _vfs = vfs) {
  return (
    _vfs.get(path) ||
    supportedExtensions
      .map((ext) => _vfs.get(`${path}${ext}`))
      .find((content) => !!content)
  );
}
