import { types as t } from '@babel/core';
import convertToPropTypes from './convertBabelToPropTypes';
import extractGenericTypeNames from './extractGenericTypeNames';
import { createPropTypesObject, mergePropTypes } from './propTypes';
import { Path, ConvertState } from './types';

function extractTypeNames(path: Path<t.FunctionDeclaration | t.VariableDeclaration>): string[] {
  if (t.isFunctionDeclaration(path.node)) {
    return extractGenericTypeNames(
      // @ts-ignore
      path.node.params[0].typeAnnotation.typeAnnotation,
    );
  }

  if (t.isVariableDeclaration(path.node)) {
    return extractGenericTypeNames(
      // @ts-ignore
      path.node.declarations[0].id.typeAnnotation.typeAnnotation.typeParameters.params[0],
    );
  }

  return [];
}

function findStaticProperty(
  path: Path<t.Node>,
  funcName: string,
  name: string,
): t.AssignmentExpression | undefined {
  const expr = path
    .getAllNextSiblings()
    .find(
      sibPath =>
        t.isExpressionStatement(sibPath.node) &&
        t.isAssignmentExpression(sibPath.node.expression, { operator: '=' }) &&
        t.isMemberExpression(sibPath.node.expression.left) &&
        t.isObjectExpression(sibPath.node.expression.right) &&
        t.isIdentifier(sibPath.node.expression.left.object, { name: funcName }) &&
        t.isIdentifier(sibPath.node.expression.left.property, { name }),
    );

  // @ts-ignore
  return expr && expr.node.expression;
}

export default function addToFunctionOrVar(
  path: Path<t.FunctionDeclaration | t.VariableDeclaration>,
  name: string,
  state: ConvertState,
) {
  const rootPath =
    t.isExportNamedDeclaration(path.parent) || t.isExportDefaultDeclaration(path.parent)
      ? path.parentPath
      : path;
  const defaultProps = findStaticProperty(rootPath, name, 'defaultProps');
  const defaultPropsKeyList: string[] = [];

  if (
    defaultProps &&
    t.isAssignmentExpression(defaultProps) &&
    t.isObjectExpression(defaultProps.right)
  ) {
    defaultProps.right.properties.forEach(prop => {
      if (t.isProperty(prop) && t.isIdentifier(prop.key)) {
        defaultPropsKeyList.push(prop.key.name);
      }
    });
  }

  const typeNames = extractTypeNames(path);
  const propTypesList = convertToPropTypes(
    state.componentTypes,
    typeNames,
    state,
    defaultPropsKeyList,
  );

  if (typeNames.length === 0 || propTypesList.length === 0) {
    return;
  }

  const propTypes = findStaticProperty(rootPath, name, 'propTypes');

  if (propTypes) {
    propTypes.right = mergePropTypes(propTypes.right, propTypesList, state);
  } else {
    rootPath.insertAfter(
      t.expressionStatement(
        t.assignmentExpression(
          '=',
          t.memberExpression(t.identifier(name), t.identifier('propTypes')),
          createPropTypesObject(propTypesList, state),
        ),
      ),
    );
  }
}
