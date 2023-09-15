export type EvaluationContext = {
  fileName: string;
};

declare global {
  const evalutationResults: Map<
    string,
    Array<{ id: string; css: string; context: EvaluationContext }>
  >;
}

// @ts-expect-error We need to initialize our evaluationResults map at some point..
globalThis.evalutationResults = new Map();

export async function evaluate(filePath: string) {
  await import(`/virtual/${filePath}`);
}
