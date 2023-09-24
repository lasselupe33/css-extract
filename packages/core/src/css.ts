import type {
  EvaluationContext,
  EvaluationResult,
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

      const id = context.name ? `_${context.name}` : `_${context.index}`;

      const fileResults =
        evalutationResults.get(context.fileName) ??
        new Map<string, EvaluationResult>();

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
