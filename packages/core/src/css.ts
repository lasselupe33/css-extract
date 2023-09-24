import crypto from "crypto";

import type {
  EvaluatedNode,
  EvaluationContext,
} from "@css-extract/evaluator/backend";

let autoIncrementedId = 0;

export function css(
  _strings: TemplateStringsArray,
  ..._exprs: Array<string | number>
): string {
  const id = `_${autoIncrementedId++}`;

  // @ts-expect-error basically a string, right? :)
  return {
    __extractableCss: true,
    process(context: EvaluationContext) {
      const css = _strings
        .map((val, index) => `${val}${_exprs[index] ?? ""}`)
        .join("");

      const hash = hashCode(`${context.fileName}${context.index}`);
      const id = context.name
        ? `_${hash}_${context.name}`
        : `_${hash}_${context.index}`;

      const fileResults =
        evalutationResults.get(context.fileName) ??
        new Map<string, EvaluatedNode>();

      fileResults.set(id, {
        id,
        css,
        context,
      });

      evalutationResults.set(context.fileName, fileResults);

      return id;
    },
    toString() {
      return id;
    },
  };
}

function hashCode(str: string) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}
