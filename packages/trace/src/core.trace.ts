import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import { handleAssignmentPattern } from "./handlers/assignment.pattern";
import { handleFunctionDeclaration } from "./handlers/declaration.function";
import { handleVariableDeclaration } from "./handlers/declaration.variable";
import { handleExportNamedDeclaration } from "./handlers/export.named-declaration";
import { handleExportSpecifier } from "./handlers/export.specifier";
import { handleArrowFunctionExpression } from "./handlers/expression.arrow-function";
import { handleAssignmentExpression } from "./handlers/expression.assignment";
import { handleBinaryExpression } from "./handlers/expression.binary";
import { handleCallExpression } from "./handlers/expression.call";
import { handleConditionalExpression } from "./handlers/expression.conditional";
import { handleMemberExpression } from "./handlers/expression.member";
import { handleNewExpression } from "./handlers/expression.new";
import { handleObjectExpression } from "./handlers/expression.object";
import { handleTaggedTemplateExpression } from "./handlers/expression.tagged-template";
import { handleUnaryExpression } from "./handlers/expression.unary";
import { handleUpdateExpression } from "./handlers/expression.update";
import { handleIdentifier } from "./handlers/identifier";
import { handleImportDeclaration } from "./handlers/import.declaration";
import { handleImportSpecifier } from "./handlers/import.specifier";
import { handleLiteral } from "./handlers/literal";
import { handleObjectMethod } from "./handlers/object.method";
import { handleObjectProperty } from "./handlers/object.property";
import { handlePrivateName } from "./handlers/private-name";
import { handleRestElement } from "./handlers/rest.element";
import { handleBlockStatement } from "./handlers/statement.block";
import { handleExpressionStatement } from "./handlers/statement.expression";
import { handleIfStatement } from "./handlers/statement.if";
import { handleReturnStatement } from "./handlers/statement.return";
import { handleTemplateElement } from "./handlers/template.element";
import { handleTemplateLiteral } from "./handlers/template.literal";
import { handleVariableDeclarator } from "./handlers/variable-declarator";
import type { NodeKey } from "./util.node-to-key";
import { nodeToKey } from "./util.node-to-key";
import type { TracerEntrypoints } from "./util.resolve-entrypoints";

export type TraceContext = {
  trackedNodes: Set<NodeKey>;
  filePath: string;

  onNewFileVisited?(
    parentPath: string,
    filePath: string,
    entrypoints: TracerEntrypoints
  ): Promise<void>;
};

const handlers = {
  Identifier: handleIdentifier,

  BlockStatement: handleBlockStatement,
  ExpressionStatement: handleExpressionStatement,
  IfStatement: handleIfStatement,
  ReturnStatement: handleReturnStatement,

  ArrowFunctionExpression: handleArrowFunctionExpression,
  AssignmentExpression: handleAssignmentExpression,
  BinaryExpression: handleBinaryExpression,
  CallExpression: handleCallExpression,
  ConditionalExpression: handleConditionalExpression,
  MemberExpression: handleMemberExpression,
  NewExpression: handleNewExpression,
  ObjectExpression: handleObjectExpression,
  TaggedTemplateExpression: handleTaggedTemplateExpression,
  UnaryExpression: handleUnaryExpression,
  UpdateExpression: handleUpdateExpression,

  AssignmentPattern: handleAssignmentPattern,

  ObjectMethod: handleObjectMethod,
  ObjectProperty: handleObjectProperty,
  PrivateName: handlePrivateName,

  FunctionDeclaration: handleFunctionDeclaration,
  VariableDeclaration: handleVariableDeclaration,
  VariableDeclarator: handleVariableDeclarator,

  ImportDeclaration: handleImportDeclaration,
  ImportSpecifier: handleImportSpecifier,
  ExportSpecifier: handleExportSpecifier,
  ExportNamedDeclaration: handleExportNamedDeclaration,

  TemplateLiteral: handleTemplateLiteral,
  TemplateElement: handleTemplateElement,

  RestElement: handleRestElement,

  BigIntLiteral: handleLiteral,
  BooleanLiteral: handleLiteral,
  DecimalLiteral: handleLiteral,
  NullLiteral: handleLiteral,
  NumberLiteral: handleLiteral,
  NumericLiteral: handleLiteral,
  RegexLiteral: handleLiteral,
  RegExpLiteral: handleLiteral,
  StringLiteral: handleLiteral,
} as Partial<{
  [key in t.Node["type"]]: (
    ctx: TraceContext,
    path: NodePath<Extract<t.Node, { type: key }>>
  ) => Promise<void>;
}>;

export async function traceNodes(
  pathOrPaths:
    | NodePath<t.Node | null | undefined>
    | NodePath<t.Node | null | undefined>[]
    | undefined,
  ctx: TraceContext
) {
  const paths = pathOrPaths
    ? Array.isArray(pathOrPaths)
      ? pathOrPaths
      : [pathOrPaths]
    : [];

  await Promise.all(
    paths.map(async (path) => {
      if (path.node && ctx.trackedNodes.has(nodeToKey(path.node))) {
        return;
      }

      if (!path.node?.type) {
        return;
      }

      const handler = handlers[path.node.type];

      if (!handler) {
        console.warn(`traceNode(${path.type}): No handler assigned`);
        return;
      }

      return await handler(ctx, path as never);
    })
  );
}
