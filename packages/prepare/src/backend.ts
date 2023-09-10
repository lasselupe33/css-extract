import readline from "readline";

import { MessagePrefixes } from "./constants";
import { evaluate } from "./core.evaluate";

export const vfs = new Map<string, string>();

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

    const fileName = msg.replace(MessagePrefixes.EVAL_FILE, "");

    await evaluate(fileName);

    console.log(`\n${MessagePrefixes.EVALUATED_FILE}hejsa`);
  });

  rl.on("close", () => {
    process.exit(0);
  });
}
