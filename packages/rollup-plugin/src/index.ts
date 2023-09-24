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

type Options = {
  entryPoint?: string;
};

export function extractCssPlugin(pluginOptions: Options): Plugin {
  const evaluator = makeEvaluator();
  const initializationPromise = evaluator.initialize();

  return {
    name: "test",

    async buildStart() {
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

      if (!evaluatedCss || evaluatedCss.length === 0) {
        return;
      }

      const s = new MagicString(code);
      let resultingCss = "";

      let index = 0;
      s.replaceAll(/css`(.|\s)*?`/gm, (_) => {
        const mapping = evaluatedCss[index++];

        if (!mapping) {
          return _;
        }

        resultingCss += `.${mapping.id} {${mapping.css.trim()}}\n`;

        return `"${mapping.id}"`;
      });

      const outputFileName =
        getModuleFileNameWithoutExtension(id) + ".extracted.css";

      const processedCss = await postcss.process(resultingCss, {
        from: id,
        to: outputFileName,
        map: {
          inline: true,
          from: id,
          absolute: true,
          sourcesContent: true,
          prev: s
            .generateMap({
              file: id,
              hires: true,
              includeContent: true,
            })
            .toString(),
        },
      });

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
