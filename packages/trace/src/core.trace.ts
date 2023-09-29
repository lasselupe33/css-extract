import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";

import { handleArrayExpression } from "./handlers/array.expression";
import { handleArrayPattern } from "./handlers/array.pattern";
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
import { handleFunctionExpression } from "./handlers/expression.function";
import { handleLogicalExpression } from "./handlers/expression.logical";
import { handleMemberExpression } from "./handlers/expression.member";
import { handleNewExpression } from "./handlers/expression.new";
import { handleObjectExpression } from "./handlers/expression.object";
import { handleOptionalCallExpression } from "./handlers/expression.optional-call";
import { handleOptionalMemberExpression } from "./handlers/expression.optional-member";
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
import { handleSpreadElement } from "./handlers/spread.element";
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

type FilePath = string;
type ParentPath = string;

const MUST_RETRACE = {
  ImportDeclaration: true,
} as Record<string, boolean>;

export type TraceContext = {
  trackedNodes: Set<NodeKey>;
  filePath: string;

  encounteredImports: Map<FilePath, Map<ParentPath, TracerEntrypoints>>;
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
  FunctionExpression: handleFunctionExpression,
  LogicalExpression: handleLogicalExpression,
  MemberExpression: handleMemberExpression,
  NewExpression: handleNewExpression,
  ObjectExpression: handleObjectExpression,
  OptionalCallExpression: handleOptionalCallExpression,
  OptionalMemberExpression: handleOptionalMemberExpression,
  TaggedTemplateExpression: handleTaggedTemplateExpression,
  UnaryExpression: handleUnaryExpression,
  UpdateExpression: handleUpdateExpression,

  AssignmentPattern: handleAssignmentPattern,
  SpreadElement: handleSpreadElement,

  ArrayExpression: handleArrayExpression,
  ArrayPattern: handleArrayPattern,

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

  for (const path of paths) {
    if (
      path.node &&
      ctx.trackedNodes.has(nodeToKey(path.node)) &&
      !MUST_RETRACE[path.node.type]
    ) {
      return;
    }

    if (!path.node?.type) {
      return;
    }

    const handler = handlers[path.node.type];

    if (!handler) {
      console.warn(`traceNode(${path.type}): No handler assigned`);
      continue;
    }

    await handler(ctx, path as never);
  }
}
