export async function evaluate(filePath: string) {
  await import(`/virtual/${filePath}`);
}
