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

const clock = {
  totalTime: 0,
  evalTime: 0,
};

export function extractCssPlugin(pluginOptions: Options): Plugin {
  const evaluator = makeEvaluator();
  const initializationPromise = evaluator.initialize();

  let buildStartTime: number;

  return {
    name: "test",

    async buildStart() {
      clock.evalTime = 0;
      clock.totalTime = 0;

      buildStartTime = performance.now();
      await initializationPromise;
    },

    buildEnd() {
      const buildTime = performance.now() - buildStartTime;
      clock.totalTime += buildTime;

      console.log(
        `@css-extract: ${clock.evalTime.toFixed(2)}ms (${(
          (100 * clock.evalTime) /
          buildTime
        ).toFixed(2)}%)`
      );
    },

    transform: {
      order: "post",
      async handler(code, id) {
        const evalStartTime = performance.now();
        const x = await evaluator.evaluate(id);
        clock.evalTime += performance.now() - evalStartTime;

        console.log(id, x);

        const out = this.parse(code);

        return;
      },
    },

    async closeBundle() {
      if (!this.meta.watchMode) {
        await evaluator.destroy();
      }
    },
    async closeWatcher() {
      await evaluator.destroy();
    },

    // renderChunk: {
    //   order: "post",
    //   async handler(source, chunk, options) {
    //     const s = new MagicString(source);
    //     const chunkMappings =
    //       mappings[
    //         chunk.facadeModuleId?.replace(`${process.cwd()}/`, "") ?? ""
    //       ];

    //     if (!chunk.facadeModuleId || !chunkMappings) {
    //       return null;
    //     }

    //     let resultingCss = "";

    //     let index = 0;
    //     s.replaceAll(/css`(.|\s)*?`/gm, (_) => {
    //       const mapping = chunkMappings[index++];

    //       if (!mapping) {
    //         return _;
    //       }

    //       resultingCss += `.${mapping.hash} {${mapping.css.trim()}}\n`;

    //       return `"${mapping.hash}"`;
    //     });

    //     const outputFileName =
    // getModuleFileNameWithoutExtension(chunk.fileName) + ".extracted.css";

    //     const processedCss = await postcss.process(resultingCss, {
    //       from: chunk.facadeModuleId,
    //       to: `${options.dir}/${outputFileName}`,
    //       map: {
    //         inline: true,
    //         from: chunk.facadeModuleId,
    //         absolute: true,
    //         sourcesContent: true,
    //         prev: s
    //           .generateMap({
    //             file: chunk.facadeModuleId,
    //             hires: true,
    //             includeContent: true,
    //           })
    //           .toString(),
    //       },
    //     });

    //     this.emitFile({
    //       type: "prebuilt-chunk",
    //       fileName: outputFileName,
    //       code: processedCss.css,
    //     });

    //     s.prepend(`import "./${path.basename(outputFileName)}";\n`);

    //     return {
    //       code: s.toString(),
    //       map: s.generateMap({ hires: true }),
    //     };
    //   },
    // },
  };

  function getModuleFileNameWithoutExtension(moduleId: string) {
    return moduleId.replace(/\.[^.]*$/, "");
  }
}
