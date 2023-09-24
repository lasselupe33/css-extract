import fs from "fs";
import readline from "readline";

import { MessagePrefixes } from "./constant.messages";
import { evaluate } from "./stage.4.evaluate";
import { prepareFile } from "./util.prepare-file";
import { getVirtualContent } from "./virtual-fs-loader";

export type { EvaluationContext, EvaluatedNode } from "./stage.4.evaluate";

type FilePath = string;

export type VirtualFileSystem = Map<
  FilePath,
  {
    content: string;
    iteration: number;
    sourceModifiedAtMs: number;
  }
>;

export const depedencyCache = new Map<FilePath, Set<FilePath>>();
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

        for (const changed of await changedDeps(filePath)) {
          await prepareFile(undefined, changed);
        }

        await prepareFile(undefined, filePath);
        await evaluate(filePath);

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

async function changedDeps(filePath: string): Promise<string[]> {
  const dependencies = depedencyCache.get(filePath) ?? [];

  const changed = await Promise.all(
    [...dependencies].map(async (dependency) => {
      const content = getVirtualContent(dependency);
      const changedAt = (await fs.promises.stat(dependency)).mtimeMs;

      return [
        changedAt !== content?.sourceModifiedAtMs ? dependency : undefined,
        ...(await changedDeps(dependency)),
      ];
    })
  );

  return changed.flatMap((it) => it).filter((it): it is string => !!it);
}
