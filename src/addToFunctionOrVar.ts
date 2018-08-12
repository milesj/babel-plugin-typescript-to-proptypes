import { types as t } from '@babel/core';
import convertToPropTypes from './convertToPropTypes';
import extractGenericTypeNames from './extractGenericTypeNames';
import mergePropTypes from './mergePropTypes';
import { Path, TypePropertyMap, ConvertOptions } from './types';

export default function addToFunctionOrVar(
  path: Path<t.FunctionDeclaration | t.VariableDeclaration>,
  name: string,
  types: TypePropertyMap,
  options: ConvertOptions,
) {
  // prettier-ignore
  const typeNames = t.isFunctionDeclaration(path.node)
    // @ts-ignore
    ? extractGenericTypeNames(path.node.params[0].typeAnnotation.typeAnnotation)
    : [];
  const propTypesList = convertToPropTypes(types, typeNames, options);

  if (propTypesList.length === 0) {
    return;
  }

  const rootPath =
    t.isExportNamedDeclaration(path.parent) || t.isExportDefaultDeclaration(path.parent)
      ? path.parentPath
      : path;
  const existingExpr = rootPath
    .getAllNextSiblings()
    .filter(
      path =>
        t.isExpressionStatement(path.node) &&
        t.isAssignmentExpression(path.node.expression, { operator: '=' }) &&
        t.isMemberExpression(path.node.expression.left) &&
        t.isObjectExpression(path.node.expression.right) &&
        t.isIdentifier(path.node.expression.left.object, { name }) &&
        t.isIdentifier(path.node.expression.left.property, { name: 'propTypes' }),
    );

  // Merge with existing `propTypes`
  if (existingExpr.length === 1) {
    const statement = existingExpr[0].node as t.ExpressionStatement;
    const expression = statement.expression as t.AssignmentExpression;

    mergePropTypes(expression.right as t.ObjectExpression, propTypesList);

    // Create a new `propTypes` expression
  } else {
    path.insertAfter(
      t.expressionStatement(
        t.assignmentExpression(
          '=',
          t.memberExpression(t.identifier(name), t.identifier('propTypes')),
          t.objectExpression(propTypesList),
        ),
      ),
    );
  }
}
