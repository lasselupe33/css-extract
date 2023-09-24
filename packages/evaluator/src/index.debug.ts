import fs from "fs";
import path from "path";

import { evaluate } from "./stage.4.evaluate";
import { prepareFile } from "./util.prepare-file";

const TEMP_ROOT = "/Users/lassefelskovagersten/Code/misc/css-extractor";

const demoRoot = path.join(TEMP_ROOT, "dummy", "package", "src");

export async function demo() {
  const entry1 = path.join(demoRoot, "shaker.ts");
  const entry2 = path.join(demoRoot, "shaker2.ts");
  const commonDependency = path.join(demoRoot, "common-dependency.ts");
  const irrelevant = path.join(demoRoot, "irrelevant.ts");

  //
  // STEP 1
  //
  let start = performance.now();

  await prepareFile(undefined, entry1);

  await evaluate(entry1);
  let end = performance.now();

  console.log(evalutationResults);
  console.log(end - start);

  evalutationResults.clear();

  //
  // STEP 2
  //
  start = performance.now();

  await prepareFile(undefined, entry2);

  await evaluate(entry2);
  end = performance.now();

  console.log(evalutationResults);
  console.log(end - start);

  evalutationResults.clear();

  //
  // STEP 3
  //
  start = performance.now();

  await fs.promises.writeFile(
    irrelevant,
    `export const myDependency = ${Math.round(Math.random() * 10000)};`
  );

  await prepareFile(undefined, irrelevant);

  await evaluate(irrelevant);
  end = performance.now();

  console.log(evalutationResults);
  console.log(end - start);

  //
  // STEP 4
  //
  start = performance.now();

  await fs.promises.writeFile(
    irrelevant,
    `export const myDependency = ${Math.round(Math.random() * 10000)};`
  );

  await prepareFile(undefined, irrelevant);

  await evaluate(irrelevant);
  end = performance.now();

  console.log(evalutationResults);
  console.log(end - start);

  //
  // STEP 5
  //
  start = performance.now();

  await fs.promises.writeFile(
    commonDependency,
    `export const myDependency = ${Math.round(Math.random() * 10000)};`
  );

  await prepareFile(undefined, commonDependency);

  await evaluate(commonDependency);
  end = performance.now();

  console.log(evalutationResults);
  console.log(end - start);
}
