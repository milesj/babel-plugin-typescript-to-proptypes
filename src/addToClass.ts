import { types as t } from '@babel/core';
import convertToPropTypes from './convertToPropTypes';
import extractGenericTypeNames from './extractGenericTypeNames';
import mergePropTypes from './mergePropTypes';
import { ConvertState } from './types';

export default function addToClass(node: t.ClassDeclaration, state: ConvertState) {
  if (!node.superTypeParameters || node.superTypeParameters.params.length <= 0) {
    return;
  }

  // @ts-ignore
  const typeNames = extractGenericTypeNames(node.superTypeParameters.params[0]);
  const propTypesList = convertToPropTypes(state.componentTypes, typeNames, state);
  let hasPropTypesStaticProperty = false;

  if (propTypesList.length === 0) {
    return;
  }

  node.body.body.forEach(property => {
    const valid =
      t.isClassProperty(property, { static: true }) &&
      t.isIdentifier(property.key, { name: 'propTypes' }) &&
      t.isObjectExpression(property.value);

    if (valid) {
      hasPropTypesStaticProperty = true;

      // Merge with existing `propTypes`
      mergePropTypes(property.value as t.ObjectExpression, propTypesList);

      if (state.options.forbidExtraProps) {
        property.value = t.callExpression(t.identifier(state.airbnbPropTypes.forbidImport), [
          property.value as t.ObjectExpression,
        ]);
      }
    }
  });

  // Add a new static `propTypes` class property
  if (!hasPropTypesStaticProperty) {
    const objectExpr = t.objectExpression(propTypesList);
    const staticProperty = t.classProperty(
      t.identifier('propTypes'),
      state.options.forbidExtraProps
        ? t.callExpression(t.identifier(state.airbnbPropTypes.forbidImport), [objectExpr])
        : objectExpr,
    );

    // @ts-ignore
    staticProperty.static = true;

    node.body.body.unshift(staticProperty);
  }
}
