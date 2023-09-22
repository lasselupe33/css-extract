import readline from "readline";

import { MessagePrefixes } from "./constant.messages";
import { resolveCssNodes } from "./stage.0.entrypoints";
import { evaluate } from "./stage.4.evaluate";
import { prepareFile } from "./util.prepare-file";

export type { EvaluationContext } from "./stage.4.evaluate";

export const vfs = new Map<
  string,
  {
    content: string;
    iteration: number;
    dependencies: Set<string>;
  }
>();

export function initialize() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on("line", async (msg) => {
    if (!msg.startsWith(MessagePrefixes.EVAL_FILE)) {
      console.warn("unknown message", msg);
      return;
    }

    const filePath = msg.replace(MessagePrefixes.EVAL_FILE, "");

    const entrypoints = await resolveCssNodes(filePath);
    await prepareFile(undefined, filePath, entrypoints);
    await evaluate(filePath);

    console.log(`\n${MessagePrefixes.EVALUATED_FILE}hejsa`);
  });

  rl.on("close", () => {
    process.exit(0);
  });
}
