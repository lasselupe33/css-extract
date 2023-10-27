import { supportedExtensions } from "@css-extract/utils";

type FilePath = string;
type ParentPath = FilePath;

export const fileToParentDependencies = new Map<FilePath, Set<ParentPath>>();
export const fileIterationMap = new Map<FilePath, number>();

export function trackDependency(
  filePath: FilePath,
  parentPath: ParentPath | undefined
) {
  if (!parentPath) {
    return;
  }

  const base = fileToParentDependencies.get(filePath) ?? new Set<FilePath>();
  base.add(parentPath);

  fileToParentDependencies.set(filePath, base);
}

export function getTransitiveParents(
  path: string,
  foundParents = new Set<string>()
) {
  for (const parent of fileToParentDependencies.get(path) ?? []) {
    if (foundParents.has(parent)) {
      continue;
    }

    foundParents.add(parent);
    getTransitiveParents(parent, foundParents);
  }

  return foundParents;
}

export function updateFileIteration(filePath: FilePath) {
  const nextIteration = (fileIterationMap.get(filePath) ?? 0) + 1;

  fileIterationMap.set(filePath, nextIteration);

  return nextIteration;
}

export function getFileIteration(filePath: FilePath): number {
  return (
    fileIterationMap.get(filePath) ||
    supportedExtensions
      .map((ext) => fileIterationMap.get(`${filePath}${ext}`))
      .find((content) => !!content) ||
    0
  );
}
