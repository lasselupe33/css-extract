import path from "path";

import { makeEvaluator } from "@css-extract/evaluator";
import MagicString from "magic-string";
import postcssRaw from "postcss";
import postcssPresetEnv from "postcss-preset-env";
import type { Plugin } from "rollup";

const postcss = postcssRaw([
  postcssPresetEnv({
    features: {
      "nesting-rules": true,
    },
  }),
]);

export function extractCssPlugin(): Plugin {
  const evaluator = makeEvaluator();
  const initializationPromise = evaluator.initialize();

  let sourceBase: string | undefined;

  return {
    name: "@css-extract/rollup-plugin",

    async buildStart(this) {
      await initializationPromise;
    },

    async resolveId(source) {
      if (source.includes(".extracted.css")) {
        return {
          id: source,
          external: true,
        };
      }
    },

    async transform(code, id) {
      // @todo, how to resolve the base of the source directory properly?
      if (!sourceBase) {
        sourceBase = path.dirname(id);
      }
      const evaluatedCss = await evaluator.evaluate(id);

      // Update CSS for all affected dependents
      if (this.meta.watchMode) {
        for (const [dependent, result] of evaluatedCss?.dependents ?? []) {
          const css = result
            .map((it) => `.${it.id} {${it.css.trim()}}`)
            .join("\n");

          const dependentOutputFileName = `${resolveOutputFileName(
            dependent,
            sourceBase
          )}.extracted.css`;

          const processedCss = await processCss(
            css,
            dependent,
            dependentOutputFileName
          );

          this.emitFile({
            type: "prebuilt-chunk",
            fileName: dependentOutputFileName,
            code: processedCss.css,
          });
        }
      }

      if (!evaluatedCss?.result || evaluatedCss.result.length === 0) {
        return;
      }

      const s = new MagicString(code, {
        filename: id,
      });
      let resultingCss = "";

      let index = 0;
      s.replaceAll(/css`(.|\s)*?`/gm, (_) => {
        const mapping = evaluatedCss.result?.[index++];

        if (!mapping) {
          return _;
        }

        if (mapping.context.isGlobal) {
          resultingCss += `${mapping.css.trim()}\n`;
        } else {
          resultingCss += `.${mapping.id} {\n${mapping.css.trim()}\n}\n`;
        }

        return `"${mapping.id}"`;
      });

      // @todo include relative path
      const outputFileName =
        resolveOutputFileName(id, sourceBase) + ".extracted.css";

      sourceMapCache.set(
        outputFileName,
        this.getCombinedSourcemap().toString()
      );

      const processedCss = await processCss(resultingCss, id, outputFileName);

      this.emitFile({
        type: "prebuilt-chunk",
        fileName: outputFileName,
        code: processedCss.css,
      });

      s.prepend(`import "./${getFileNameWithoutPath(outputFileName)}";\n`);

      const map = s.generateMap({
        hires: true,
        source: id,
        includeContent: true,
      });

      return {
        code: s.toString(),
        map: {
          ...map,
          sourcesContent: map.sourcesContent?.map((it) => it || "") ?? [],
        },
      };
    },

    async closeBundle() {
      if (!this.meta.watchMode) {
        await evaluator.destroy();
      }
    },
    async closeWatcher() {
      await evaluator.destroy();
    },
  };
}

function resolveOutputFileName(moduleId: string, base: string | undefined) {
  return moduleId
    .replace(base || "", "")
    .replace(/^\//, "")
    .replace(/\.[^.]*$/, "");
}

function getFileNameWithoutPath(filePath: string) {
  return filePath.split(path.sep).at(-1);
}

const sourceMapCache = new Map<string, string>();

async function processCss(css: string, fileId: string, outName: string) {
  const sourceMap = sourceMapCache.get(outName);

  return await postcss.process(css, {
    from: fileId,
    to: outName,
    map: {
      inline: true,
      from: fileId,
      absolute: true,
      sourcesContent: true,
      prev: sourceMap,
    },
  });
}
