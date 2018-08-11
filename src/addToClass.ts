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

  node.body.body.forEach(property => {
    const valid =
      t.isClassProperty(property, { static: true }) &&
      t.isIdentifier(property.key, { name: 'propTypes' }) &&
      t.isObjectExpression(property.value);

    if (valid) {
      hasPropTypesStaticProperty = true;

      // Add to the beginning of the array so custom prop types aren't overwritten
      (property.value as t.ObjectExpression).properties.unshift(...propTypesList);
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
