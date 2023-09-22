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

const touchedFiles = new Set<string>();

export async function evaluate(filePath: string) {
  touchedFiles.add(filePath);

  for (const touchedFile of touchedFiles) {
    try {
      await import(`/virtual/${touchedFile}`);
    } catch (err) {
      console.error("@css-extract/evaluator: Failed to evalutate code.");

      if (err instanceof Error) {
        // re-map virtual files to their physical location on the file-system
        err.stack = err.stack
          ?.split("\n")
          .map((line) =>
            line.replace(
              /(at file:\/\/)\/virtual\/(.*?)\?.*?(:\d:\d)/g,
              "$1$2$3"
            )
          )
          .join("\n");

        console.error(err);
      }
    }
  }
}