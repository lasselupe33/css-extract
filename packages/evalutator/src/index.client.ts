import type { ChildProcessWithoutNullStreams } from "child_process";
import { spawn } from "child_process";

import { MessagePrefixes } from "./constant.messages";

let preparer: ChildProcessWithoutNullStreams;

export async function initialize() {
  preparer = spawn(
    "node",
    ["--loader", "./lib/loader.mjs", "./lib/empty.mjs"],
    {
      stdio: "overlapped",
    }
  );

  preparer.stdout.on("data", (data) => {
    console.log(`[BACKEND]: ${data}`);
  });
  preparer.stderr.on("data", (data) => {
    console.error(`[BACKEND]: ${data}`);
  });
}

export async function evaluate(filePath: string) {
  const promise = new Promise((resolve, reject) => {
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

      resolve(result);
    };

    preparer.stdout.on("data", callback);
    preparer.stdout.on("error", onError);
  });

  preparer.stdin.write(`${MessagePrefixes.EVAL_FILE}${filePath}\n`);

  return await promise;
}

export async function destroy() {
  preparer.kill(9);
}

// async function tmp() {
//   await initialize();
//   const res = await evaluate(
//     path.join(TEMP_ROOT, "dummy", "package", "src", "shaker")
//   );

//   console.log("Result", res);

//   await destroy();
// }

// tmp();
