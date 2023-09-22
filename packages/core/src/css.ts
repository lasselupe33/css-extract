import type { EvaluationContext } from "@css-extract/evaluator/backend";

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

      evalutationResults.set(context.fileName, [
        ...(evalutationResults.get(context.fileName) ?? []),
        { context, id, css },
      ]);

      return id;
    },
    toString() {
      return id;
    },
  };
}
