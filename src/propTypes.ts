import { types as t } from '@babel/core';
import { ConvertState } from './types';

export function createPropTypesObject(
  propTypes: t.ObjectProperty[],
  state: ConvertState,
): t.CallExpression | t.ObjectExpression {
  const object = t.objectExpression(propTypes);

  return state.options.forbidExtraProps
    ? t.callExpression(t.identifier(state.airbnbPropTypes.forbidImport), [object])
    : object;
}

export function mergePropTypes(objectExpr: t.ObjectExpression, propTypes: t.ObjectProperty[]) {
  const { properties } = objectExpr;
  const existingProps: { [key: string]: boolean } = {};

  // Extract existing props so that we don't duplicate
  properties.forEach(property => {
    if (t.isObjectProperty(property) && t.isIdentifier(property.key)) {
      existingProps[property.key.name] = true;
    }
  });

  // Add to the beginning of the array so existing/custom prop types aren't overwritten
  propTypes.forEach(propType => {
    if (t.isIdentifier(propType.key) && !existingProps[propType.key.name]) {
      properties.unshift(propType);
    }
  });
}
