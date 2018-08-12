import { types as t } from '@babel/core';
import convertToPropTypes from './convertToPropTypes';
import extractGenericTypeNames from './extractGenericTypeNames';
import mergePropTypes from './mergePropTypes';
import { TypePropertyMap, ConvertOptions } from './types';

export default function addToClass(
  node: t.ClassDeclaration,
  types: TypePropertyMap,
  options: ConvertOptions,
) {
  if (!node.superTypeParameters) {
    return;
  }

  // @ts-ignore
  const typeNames = extractGenericTypeNames(node.superTypeParameters);
  const propTypesList = convertToPropTypes(types, typeNames, options);
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
    }
  });

  // Add a new static `propTypes` class property
  if (!hasPropTypesStaticProperty) {
    const staticProperty = t.classProperty(
      t.identifier('propTypes'),
      t.objectExpression(propTypesList),
    );

    // @ts-ignore
    staticProperty.static = true;

    node.body.body.unshift(staticProperty);
  }
}
