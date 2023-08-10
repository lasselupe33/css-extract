import path from "path";

import type { ExtractedCss } from "@css-extract/prepare";
import { prepare } from "@css-extract/prepare";
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
  let mappings: ExtractedCss = {};

  return {
    name: "test",

    async buildStart() {
      console.time("prepare");
      mappings = await prepare();
      console.timeEnd("prepare");
    },

    renderChunk: {
      order: "post",
      async handler(source, chunk) {
        const s = new MagicString(source);
        const chunkMappings =
          mappings[
            chunk.facadeModuleId?.replace(`${process.cwd()}/`, "") ?? ""
          ];

        if (!chunk.facadeModuleId || !chunkMappings) {
          return null;
        }

        let resultingCss = "";

        let index = 0;
        s.replaceAll(/css`(.|\s)*?`/gm, (_) => {
          const mapping = chunkMappings[index++];

          if (!mapping) {
            return _;
          }

          resultingCss += `.${mapping.hash} {${mapping.css.trim()}}\n`;

          return `"${mapping.hash}"`;
        });

        const outputFileName =
          getModuleFileNameWithoutExtension(chunk.fileName) + ".extracted.css";

        const processedCss = await postcss.process(resultingCss, {
          from: chunk.facadeModuleId,
          map: {
            inline: true,
            from: chunk.facadeModuleId,
          },
        });

        this.emitFile({
          type: "asset",
          fileName: outputFileName,
          source: processedCss.css,
        });

        s.prepend(`import "./${path.basename(outputFileName)}";\n`);

        return {
          code: s.toString(),
          map: s.generateMap({ hires: true }),
        };
      },
    },
  };

  function getModuleFileNameWithoutExtension(moduleId: string) {
    return moduleId.replace(/\.[^.]*$/, "");
  }
}
