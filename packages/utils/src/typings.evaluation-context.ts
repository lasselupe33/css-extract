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
  isGlobal?: boolean;
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
