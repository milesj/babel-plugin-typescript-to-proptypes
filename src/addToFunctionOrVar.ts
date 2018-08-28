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
      sibPath =>
        t.isExpressionStatement(sibPath.node) &&
        t.isAssignmentExpression(sibPath.node.expression, { operator: '=' }) &&
        t.isMemberExpression(sibPath.node.expression.left) &&
        t.isObjectExpression(sibPath.node.expression.right) &&
        t.isIdentifier(sibPath.node.expression.left.object, { name }) &&
        t.isIdentifier(sibPath.node.expression.left.property, { name: 'propTypes' }),
    );

  // Merge with existing `propTypes`
  if (existingExpr.length === 1) {
    const statement = existingExpr[0].node as t.ExpressionStatement;
    const expression = statement.expression as t.AssignmentExpression;

    mergePropTypes(expression.right as t.ObjectExpression, propTypesList, state);

    // Create a new `propTypes` expression
  } else {
    const objectExpr = t.objectExpression(propTypesList);

    rootPath.insertAfter(
      t.expressionStatement(
        t.assignmentExpression(
          '=',
          t.memberExpression(t.identifier(name), t.identifier('propTypes')),
          state.options.forbidExtraProps
            ? t.callExpression(t.identifier(state.airbnbPropTypes.forbidImport), [objectExpr])
            : objectExpr,
        ),
      ),
    );
  }
}
