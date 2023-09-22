import type { ChildProcessWithoutNullStreams } from "child_process";
import { spawn } from "child_process";
import path from "path";

import { MessagePrefixes } from "./constant.messages";
import type { EvaluationResult } from "./stage.4.evaluate";

export function makeEvaluator() {
  let preparer: ChildProcessWithoutNullStreams;

  async function initialize() {
    const libDir = path.dirname(new URL(import.meta.url).pathname);
    console.log(libDir);
    preparer = spawn(
      "node",
      [
        "--loader",
        path.resolve(libDir, "loader.mjs"),
        path.resolve(libDir, "empty.mjs"),
      ],
      {
        stdio: "overlapped",
      }
    );

    if (process.env["CSS_EXTRACT__DEBUG"]) {
      preparer.stderr.on("data", (data) => {
        process.stderr.write(data);
      });

      preparer.stdout.on("data", (data) => {
        process.stdout.write(data);
      });
    }
  }

  async function evaluate(filePath: string) {
    const promise = new Promise<EvaluationResult>((resolve, reject) => {
      const onError = (err: Error) => {
        preparer.stdout.off("data", callback);
        preparer.stdout.off("error", onError);

        reject(err);
      };

      const callback = (data: Buffer) => {
        const msg = data.toString();

        const lines = msg.split("\n").map((line) => line.trim());
        const result = lines.find((line) =>
          line.startsWith(MessagePrefixes.EVALUATED_FILE)
        );

        if (!result) {
          return;
        }

        preparer.stdout.off("data", callback);
        preparer.stdout.off("error", onError);

        resolve(
          JSON.parse(result.slice(MessagePrefixes.EVALUATED_FILE.length))
        );
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
