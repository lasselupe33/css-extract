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

        const hasCssPaths = await prepareFile(undefined, filePath);

        if (hasCssPaths) {
          await evaluate(filePath);
        }

        for (const dependent of dependents) {
          const hasCssPaths = await prepareFile(undefined, dependent);

          if (hasCssPaths) {
            await evaluate(dependent);
            const results = evalutationResults.get(dependent)?.values();

            console.log(
              `\n${
                MessagePrefixes.EVALUATED_DEPENDENT
              }${filePath}:${dependent}:${JSON.stringify(
                [...(results ?? [])].sort(
                  (a, b) => a.context.index - b.context.index
                )
              )}`
            );
          }
        }

        const results = evalutationResults.get(filePath)?.values();

        console.log(
          `\n${MessagePrefixes.EVALUATED_FILE}${filePath}:${JSON.stringify(
            [...(results ?? [])].sort(
              (a, b) => a.context.index - b.context.index
            )
          )}`
        );
      })()
    );
  });

  rl.on("close", () => {
    process.exit(0);
  });
}

// async function changedDeps(filePath: string): Promise<string[]> {
//   const dependencies = depedencyCache.get(filePath) ?? [];

//   const changed = await Promise.all(
//     [...dependencies].map(async (dependency) => {
//       const content = getVirtualContent(dependency);
//       const changedAt = (await fs.promises.stat(dependency)).mtimeMs;

//       return [
//         changedAt !== content?.sourceModifiedAtMs ? dependency : undefined,
//         ...(await changedDeps(dependency)),
//       ];
//     })
//   );

//   return changed.flatMap((it) => it).filter((it): it is string => !!it);
// }
