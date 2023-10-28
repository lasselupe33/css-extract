import readline from "readline";

import { MessagePrefixes } from "./constant.messages";
import { fileIterationMap, getTransitiveParents } from "./core.deps";
import { evaluate } from "./core.evaluate";
import { prepareFile } from "./core.prepare-file/core.prepare-file";

export type { EvaluationContext, EvaluatedNode } from "./core.evaluate";

type FilePath = string;

export type VirtualFileSystem = Map<
  FilePath,
  {
    content: string;
    iteration: number;
  }
>;

export const vfs: VirtualFileSystem = new Map();

export function initialize() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  const queue: Promise<undefined>[] = [];

  rl.on("line", async (msg) => {
    if (!msg.startsWith(MessagePrefixes.EVAL_FILE)) {
      console.warn("unknown message", msg);
      return;
    }

    queue.push(
      (async () => {
        await Promise.all(queue);

        const filePath = msg.slice(MessagePrefixes.EVAL_FILE.length);
        console.log("processing", filePath);

        fileIterationMap.set(
          filePath,
          (fileIterationMap.get(filePath) ?? 0) + 1
        );

        const dependents = getTransitiveParents(filePath);

        for (const dependent of dependents) {
          fileIterationMap.set(
            dependent,
            (fileIterationMap.get(dependent) ?? 0) + 1
          );
        }

        const { hasCssPaths, dependsOn } = await prepareFile(
          undefined,
          filePath
        );

        if (hasCssPaths) {
          await evaluate(filePath);
        }

        const results = evalutationResults.get(filePath)?.values();

        console.log(
          `\n${MessagePrefixes.EVALUATED_FILE}${filePath}:${JSON.stringify({
            dependsOn,
            results: [...(results ?? [])].sort(
              (a, b) => a.context.index - b.context.index
            ),
          })}`
        );
      })()
    );
  });

  rl.on("close", () => {
    process.exit(0);
  });
}
