import { types as t } from '@babel/core';
import convertToPropTypes from './convertToPropTypes';
import { Component, TypePropertyMap } from './types';

export default function addToFunctionOrVar(
  component: Component<t.FunctionDeclaration | t.VariableDeclaration>,
  types: TypePropertyMap,
  reactImportedName: string,
) {
  const { name } = component;
  const propTypesList = convertToPropTypes(types, ['Props', `${name}Props`], reactImportedName);

  // @ts-ignore
  const existingExpr: t.ExpressionStatement[] = component.path.getAllNextSiblings().filter(
    path =>
      t.isExpressionStatement(path.node) &&
      t.isAssignmentExpression(path.node.expression, {
        left: {
          type: 'MemberExpression',
          object: { name },
          property: { name: 'propTypes' },
        },
        right: { type: 'ObjectExpression' },
      }),
  );

  // Add to the beginning of the array so custom prop types aren't overwritten
  if (existingExpr.length > 0) {
    // @ts-ignore
    existingExpr[0].expression.right.properties.unshift(...propTypesList);

    // Create a new `propTypes` expression
  } else {
    component.path.insertAfter(
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
