import { vfs } from "./backend";

export async function evaluate(filePath: string) {
  const start = performance.now();
  await import(`/virtual/${filePath}`);
  const end = performance.now();

  console.log(`First: ${end - start}ms`);

  vfs.clear();

  // start = performance.now();
  // await import(`/virtual/${filePath}`);
  // end = performance.now();

  console.log(`Second: ${end - start}ms`);
}
