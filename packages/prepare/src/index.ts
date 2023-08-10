import { spawnSync } from "child_process";
import fs from "fs";

import esbuild from "esbuild";
import type { Plugin } from "esbuild";

type FileName = string;
export type ExtractedCss = Record<
  FileName,
  Array<{ hash: string; css: string }>
>;

// STEP: Ensure that all side-effects are removed before evaluating css
const stripSideEffectsPlugin = {
  name: "strip-side-effects",
  setup(build) {
    build.onLoad({ filter: /\.tsx?$/ }, async (args) => {
      const text = await fs.promises.readFile(args.path, "utf8");
      const lines = text
        .split("\n")
        .filter((line) => !/^(\d|\w)*?\((\d|\w)*?\)/.test(line))
        .join("\n");

      return {
        contents: lines,
        loader: (args.path.split(".").at(-1) as "ts" | "tsx") ?? "ts",
      };
    });
  },
} as Plugin;

const exampleOnResolvePlugin = {
  name: "externals",
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      if (
        args.path.startsWith(".") ||
        ["@utils/", "@ui/"].some((it) => args.path.startsWith(it))
      ) {
        return null;
      }

      return { external: true };
    });
  },
} as Plugin;

export async function prepare(): Promise<ExtractedCss> {
  const result = await esbuild.build({
    entryPoints: ["./src/index.ts"],
    outfile: "./lib/out.js",
    format: "cjs",
    bundle: true,
    write: false,
    plugins: [exampleOnResolvePlugin, stripSideEffectsPlugin],
  });

  const bundleText = result.outputFiles[0]?.text;
  let transformedText = "";

  if (!bundleText) {
    return {};
  }

  // STEP: Extract all css`...` statements from all virtual files
  const virtualFiles = bundleText.split("// ");

  for (const virtualFile of virtualFiles) {
    if (!virtualFile) {
      continue;
    }

    const [fileName, ...lines] = virtualFile.split("\n");
    transformedText += `// ${fileName}\n`;

    if (!fileName || lines.length === 0) {
      continue;
    }

    const content = lines.join("\n");

    transformedText += content.replaceAll(
      /css`((.|\s)*?)`/gm,
      (_) => `${_}.process("${fileName}")`
    );
  }

  // STEP: Evaluate bundle to determine evaluated CSS statements
  // @todo Use node VM?
  const evaluated = spawnSync("node", {
    input: transformedText,
  }).stdout.toString("utf-8");
  console.log(evaluated);

  // STEP: Map evaluated CSS to original css``.
  const results: Record<string, Array<{ hash: string; css: string }>> = {};

  for (const line of evaluated.split("\n")) {
    if (!line.startsWith(`{"__extracted":true`)) {
      continue;
    }

    const output = JSON.parse(line);

    results[output.fileName] ??= [];
    results[output.fileName]!.push({
      hash: output.hash,
      css: output.css,
    });
  }

  return results;
}
