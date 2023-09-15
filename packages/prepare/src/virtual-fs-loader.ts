import { fileURLToPath, pathToFileURL } from "node:url";

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
  // We always want to use our original implementations of css-extract. No need
  // to run these in a virtual environment.
  if (specifier.includes("@css-extract/")) {
    try {
      const resolved = resolver(
        context.parentURL.replace("file:///virtual/", ""),
        specifier
      );

      return next(resolved ? pathToFileURL(resolved).pathname : specifier);
    } catch {
      return next(specifier);
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

    const deps = [...content.dependencies.values()]
      .sort()
      .map((dep) => {
        const iteration = getVirtualContent(dep)?.iteration;

        return `${dep}=${iteration}`;
      })
      .join("&");

    console.debug("[RESOLVE]", url, content.iteration);

    return {
      format: "module",
      shortCircuit: true,
      url: `${url}?iteration=${content.iteration}${deps ? `&${deps}` : ""}`,
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

demo();
