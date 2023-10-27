import type {
  EvaluatedNode,
  EvaluationContext,
} from "@css-extract/evaluator/backend";

let autoIncrementedId = 0;

type AdditionalContext = {
  isGlobal?: boolean;
};

export const makeCssTemplateLiteral = (additionalContext: AdditionalContext) =>
  function css(
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

        const prev = fileResults.get(id);

        fileResults.set(id, {
          id,
          css,
          context: {
            ...context,
            ...additionalContext,
          },
          iteration: prev?.iteration ? prev.iteration + 1 : 1,
        });

        evalutationResults.set(context.fileName, fileResults);

        return id;
      },
      toString() {
        return id;
      },
    };
  };

function hashCode(str: string) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}
