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

  return {
    name: "@css-extract/rollup-plugin",

    async buildStart(this, opts) {
      console.log(opts);
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
      const evaluatedCss = await evaluator.evaluate(id);

      // Update CSS for all affected dependents
      if (this.meta.watchMode) {
        for (const [dependent, result] of evaluatedCss?.dependents ?? []) {
          const css = result
            .map((it) => `.${it.id} {${it.css.trim()}}`)
            .join("\n");

          const dependentOutputFileName = `${getModuleFileNameWithoutExtension(
            dependent
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

      const s = new MagicString(code);
      let resultingCss = "";

      let index = 0;
      s.replaceAll(/css`(.|\s)*?`/gm, (_) => {
        const mapping = evaluatedCss.result?.[index++];

        if (!mapping) {
          return _;
        }

        resultingCss += `.${mapping.id} {${mapping.css.trim()}}\n`;

        return `"${mapping.id}"`;
      });

      // @todo include relative path
      const outputFileName =
        getModuleFileNameWithoutExtension(id) + ".extracted.css";

      sourceMapCache.set(
        outputFileName,
        s
          .generateMap({
            file: id,
            hires: true,
            includeContent: true,
          })
          .toString()
      );

      const processedCss = await processCss(resultingCss, id, outputFileName);

      this.emitFile({
        type: "prebuilt-chunk",
        fileName: outputFileName,
        code: processedCss.css,
      });

      s.prepend(`import "./${outputFileName}";\n`);

      return {
        code: s.toString(),
        map: s.generateMap({ hires: true }),
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

function getModuleFileNameWithoutExtension(moduleId: string) {
  return moduleId
    .split(path.sep)
    .at(-1)
    ?.replace(/\.[^.]*$/, "");
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
