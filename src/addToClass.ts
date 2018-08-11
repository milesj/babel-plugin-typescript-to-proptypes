import { types as t } from '@babel/core';
import extractGenericTypeNames from './extractGenericTypeNames';
import convertToPropTypes from './convertToPropTypes';
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

      const { properties } = property.value as t.ObjectExpression;
      const existingProps: { [key: string]: boolean } = {};

      // Extract existing props so that we don't duplicate
      properties.forEach(objectProperty => {
        if (t.isObjectProperty(objectProperty) && t.isIdentifier(objectProperty.key)) {
          existingProps[objectProperty.key.name] = true;
        }
      });

      // Add to the beginning of the array so existing/custom prop types aren't overwritten
      propTypesList.forEach(propType => {
        if (t.isIdentifier(propType.key) && !existingProps[propType.key.name]) {
          properties.unshift(propType);
        }
      });
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
