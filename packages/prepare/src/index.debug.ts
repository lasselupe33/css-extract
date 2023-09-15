import { resolveCssNodes } from "./stage.0.entrypoints";
import { evaluate } from "./stage.4.evaluate";
import { prepareFile } from "./util.prepare-file";

export async function demo(filePath: string) {
  let start = performance.now();
  let entrypoints = await resolveCssNodes(filePath);

  await prepareFile(undefined, filePath, entrypoints);

  await evaluate(filePath);
  let end = performance.now();

  console.log(end - start);

  start = performance.now();
  entrypoints = await resolveCssNodes(filePath);

  await prepareFile(undefined, filePath, entrypoints);

  await evaluate(filePath);
  end = performance.now();

  console.log(end - start);
}
