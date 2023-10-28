type FilePath = string;

export type VirtualFileSystem = Map<
  FilePath,
  {
    content: string;
    iteration: number;
  }
>;

export const vfs: VirtualFileSystem = new Map();
