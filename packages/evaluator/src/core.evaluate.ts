export type EvaluationContext = {
  fileName: string;
  name: string | null;
  index: number;
  loc: {
    start: {
      line: number;
      col: number;
    };
  };
};

export type EvaluationResult = Array<EvaluatedNode>;

export type EvaluatedNode = {
  id: string;
  css: string;
  context: EvaluationContext;
  iteration: number;
};

type FileName = string;
type NodeId = string;

declare global {
  const evalutationResults: Map<FileName, Map<NodeId, EvaluatedNode>>;
}

// @ts-expect-error We need to initialize our evaluationResults map at some point..
globalThis.evalutationResults = new Map();

export async function evaluate(filePath: string) {
  try {
    await import(`/virtual/${filePath}`);
  } catch (err) {
    console.error("@css-extract/evaluator: Failed to evalutate code.");

    if (err instanceof Error) {
      // re-map virtual files to their physical location on the file-system
      err.stack = err.stack
        ?.split("\n")
        .map((line) =>
          line.replace(
            /((at )?file:\/\/)\/virtual\/(.*?)\?.*?(\d:\d)/g,
            "$2$3$4"
          )
        )
        .join("\n");

      console.error(err);
    }
  }
}
