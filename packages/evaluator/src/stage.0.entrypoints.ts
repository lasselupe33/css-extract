import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import type { TracerEntrypoints } from "@css-extract/trace";

import { transform } from "./stage.1.transform";

export async function resolveCssNodes(
  filePath: string
): Promise<TracerEntrypoints> {
  const entries: Array<NodePath<t.Node>> = [];

  // @todo Can we do this more efficiently?
  await transform(filePath, {
    TaggedTemplateExpression: (path, addedPaths) => {
      if (t.isCallExpression(path.node)) {
        entries.push(path.parentPath, ...addedPaths);
      }
    },
  });

  return { paths: entries, identifiers: [], all: false };
}
