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
    build.onLoad({ filter: /\.ts$/ }, async (args) => {
      const text = await fs.promises.readFile(args.path, "utf8");
      const lines = text
        .split("\n")
        .filter((line) => !/^(\d|\w)*?\((\d|\w)*?\)/.test(line))
        .join("\n");

      return {
        contents: lines,
        loader: "ts",
      };
    });

    build.onLoad({ filter: /\.ts$/ }, async (args) => {
      const text = await fs.promises.readFile(args.path, "utf8");
      const lines = text
        .split("\n")
        .filter((line) => !/^(\d|\w)*?\((\d|\w)*?\)/.test(line))
        .join("\n");

      return {
        contents: lines,
        loader: "tsx",
      };
    });
  },
} as Plugin;

// @todo allow configuration of externals
const externalsPlugin = {
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

type Options = {
  entryPoint: string;
};

export async function prepare(options: Options): Promise<ExtractedCss> {
  // @todo configure ESBuild correctly
  const result = await esbuild.build({
    entryPoints: [options.entryPoint],
    outfile: "./lib/out.js",
    format: "cjs",
    bundle: true,
    write: false,
    plugins: [externalsPlugin, stripSideEffectsPlugin],
  });

  const bundleText = result.outputFiles[0]?.text;

  let transformedText = `require("jsdom-global")();\n`;

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
    const cssExtractImportIdentifier = content.match(
      /var (.*?) = require\("@css-extract\/core"\);/
    )?.[1];

    if (!cssExtractImportIdentifier) {
      transformedText += content;

      continue;
    }

    const cssExtractFunctionIdentifier = `${cssExtractImportIdentifier}\\.css`;

    const cssExtractCallsRegex = new RegExp(
      `${cssExtractFunctionIdentifier}\`((.|\\s)*?)\``,
      "gm"
    );

    transformedText += content.replaceAll(
      cssExtractCallsRegex,
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    results[output.fileName]!.push({
      hash: output.hash,
      css: output.css,
    });
  }

  return results;
}
