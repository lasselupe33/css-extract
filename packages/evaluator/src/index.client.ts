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
    const dependentEvaluatedKey = `${MessagePrefixes.EVALUATED_DEPENDENT}${filePath}:`;

    const dependentChanges = new Map<string, EvaluationResult>();

    const promise = new Promise<{
      result: EvaluationResult | undefined;
      dependents: Map<string, EvaluationResult>;
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
        const dependentChanged = lines.find((line) =>
          line.startsWith(dependentEvaluatedKey)
        );

        if (dependentChanged) {
          const [dependentName, ...evaluationResult] = dependentChanged
            .slice(dependentEvaluatedKey.length)
            .split(":");

          if (dependentName && evaluationResult) {
            dependentChanges.set(
              dependentName,
              JSON.parse(evaluationResult.join(":"))
            );
          }
        }

        if (!result) {
          return;
        }

        preparer.stdout.off("data", callback);
        preparer.stdout.off("error", onError);

        const rawResult = result.slice(evaluationFinishedKey.length);
        const parsedResult = rawResult ? JSON.parse(rawResult) : undefined;

        resolve({ result: parsedResult, dependents: dependentChanges });
      };

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

// async function tmp() {
//   const TEMP_ROOT = "/Users/lassefelskovagersten/Code/misc/css-extractor";
//   const demoRoot = path.join(TEMP_ROOT, "dummy", "package", "src");
//   const entry1 = path.join(demoRoot, "shaker.ts");
//   const entry2 = path.join(demoRoot, "shaker2.ts");
//   const commonDependency = path.join(demoRoot, "common-dependency.ts");
//   const irrelevant = path.join(demoRoot, "irrelevant.ts");

//   await initialize();

//   const res = await evaluate(entry1);
//   console.log("Result", res);

//   await evaluate(entry2);
//   await evaluate(commonDependency);
//   await evaluate(irrelevant);

//   await destroy();
// }

// tmp();
