import { types as t } from '@babel/core';
import convertToPropTypes from './convertToPropTypes';
import extractGenericTypeNames from './extractGenericTypeNames';
import { createPropTypesObject, mergePropTypes } from './propTypes';
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
      (t.isObjectExpression(property.value) || t.isCallExpression(property.value));

    if (valid) {
      hasPropTypesStaticProperty = true;

      // Merge with existing `propTypes`
      property.value = mergePropTypes(property.value, propTypesList, state);
    }
  });

  // Add a new static `propTypes` class property
  if (!hasPropTypesStaticProperty) {
    const staticProperty = t.classProperty(
      t.identifier('propTypes'),
      createPropTypesObject(propTypesList, state),
    );

    // @ts-ignore
    staticProperty.static = true;

    node.body.body.unshift(staticProperty);
  }
}
