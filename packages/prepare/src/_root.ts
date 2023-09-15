import { vfs } from "./backend";
import { resolveEntrypoints } from "./stage.0.entrypoints";
import { transform } from "./stage.1.transform";
import type { TracerEntrypoints } from "./stage.2.trace";
import { traceReachableNodes } from "./stage.2.trace";
import { pruneAST } from "./stage.3.prune";
import { evaluate } from "./stage.4.evaluate";

export async function demo(filePath: string) {
  let start = performance.now();
  let entrypoints = await resolveEntrypoints(filePath);

  await prepareFile(filePath, entrypoints);

  await evaluate(filePath);
  let end = performance.now();

  console.log(end - start);

  start = performance.now();
  entrypoints = await resolveEntrypoints(filePath);

  await prepareFile(filePath, entrypoints);

  await evaluate(filePath);
  end = performance.now();

  console.log(end - start);
}

export async function prepareFile(
  filePath: string,
  entrypoints: TracerEntrypoints
) {
  const ast = await transform(filePath);
  const tracedNodes = await traceReachableNodes(filePath, ast, entrypoints);
  const pruned = pruneAST(ast, tracedNodes);

  const prev = vfs.get(filePath);

  vfs.set(filePath, {
    content: pruned.code,
    iteration: (prev?.iteration ?? 0) + 1,
  });
}
