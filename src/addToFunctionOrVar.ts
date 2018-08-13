import { types as t } from '@babel/core';
import convertToPropTypes from './convertToPropTypes';
import extractGenericTypeNames from './extractGenericTypeNames';
import mergePropTypes from './mergePropTypes';
import { Path, ConvertState } from './types';

export default function addToFunctionOrVar(
  path: Path<t.FunctionDeclaration | t.VariableDeclaration>,
  name: string,
  state: ConvertState,
) {
  const typeNames = [];

  if (t.isFunctionDeclaration(path.node)) {
    typeNames.push(
      ...extractGenericTypeNames(
        // @ts-ignore
        path.node.params[0].typeAnnotation.typeAnnotation,
      ),
    );
  } else if (t.isVariableDeclaration(path.node)) {
    typeNames.push(
      ...extractGenericTypeNames(
        // @ts-ignore
        path.node.declarations[0].id.typeAnnotation.typeAnnotation.typeParameters.params[0],
      ),
    );
  }

  const propTypesList = convertToPropTypes(state.componentTypes, typeNames, state);

  if (typeNames.length === 0 || propTypesList.length === 0) {
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
    rootPath.insertAfter(
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
