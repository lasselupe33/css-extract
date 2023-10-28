import type { ChildProcessWithoutNullStreams } from "child_process";
import { spawn } from "child_process";
import path from "path";

import { MessagePrefixes } from "./constant.messages";
import type { EvaluationResult } from "./core.evaluate";

export type { EvaluationResult };

export function makeEvaluator() {
  let preparer: ChildProcessWithoutNullStreams;

  async function initialize() {
    const libDir = path.dirname(new URL(import.meta.url).pathname);

    preparer = spawn(
      "node",
      [
        "--inspect",
        "--loader",
        path.resolve(libDir, "loader.mjs"),
        path.resolve(libDir, "empty.mjs"),
      ],
      {
        stdio: "overlapped",
      }
    );

    preparer.stderr.on("data", (data) => {
      console.log(data.toString());
    });

    if (process.env["CSS_EXTRACT__DEBUG"] === "true") {
      preparer.stdout.on("data", (data) => {
        process.stdout.write(data);
      });
    }
  }

  async function evaluate(filePath: string) {
    const evaluationFinishedKey = `${MessagePrefixes.EVALUATED_FILE}${filePath}:`;

    const promise = new Promise<{
      result: EvaluationResult | undefined;
      dependsOn: string[];
    }>((resolve, reject) => {
      const onError = (err: Error) => {
        preparer.stdout.off("data", callback);
        preparer.stdout.off("error", onError);

        reject(err);
      };

      const callback = (data: Buffer) => {
        const msg = data.toString();

        const lines = msg.split("\n").map((line) => line.trim());
        const result = lines.find((line) =>
          line.startsWith(evaluationFinishedKey)
        );

        if (!result) {
          return;
        }

        preparer.stdout.off("data", callback);
        preparer.stdout.off("error", onError);

        const rawResult = result.slice(evaluationFinishedKey.length);

        const parsedResult = rawResult
          ? (JSON.parse(rawResult) as {
              results: EvaluationResult;
              dependsOn: string[];
            })
          : undefined;

        resolve({
          result: parsedResult?.results,
          dependsOn: parsedResult?.dependsOn ?? [],
        });
      };

      // Allow for up to a 1000 files being evaluated in parallel without
      // warnings.
      preparer.stdout.setMaxListeners(1000);
      preparer.stdout.on("data", callback);
      preparer.stdout.on("error", onError);
    });

    preparer.stdin.write(`${MessagePrefixes.EVAL_FILE}${filePath}\n`);

    return await promise;
  }

  async function destroy() {
    preparer.kill(9);
  }

  return {
    initialize,
    evaluate,
    destroy,
  };
}
