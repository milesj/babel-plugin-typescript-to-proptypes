import { types as t } from '@babel/core';
import extractGenericTypeNames from './extractGenericTypeNames';
import convertToPropTypes from './convertToPropTypes';
import { Component, TypePropertyMap } from './types';

export default function addToClass(
  component: Component<t.ClassDeclaration>,
  types: TypePropertyMap,
  reactImportedName: string,
) {
  const { node } = component.path;

  if (!node.superTypeParameters) {
    return;
  }

  // @ts-ignore
  const typeNames = extractGenericTypeNames(node.superTypeParameters);
  const propTypesList = convertToPropTypes(types, typeNames, reactImportedName);
  let hasPropTypesStaticProperty = false;

  node.body.body.forEach(property => {
    const valid = t.isClassProperty(property, {
      static: true,
      key: { name: 'propTypes' },
      value: { type: 'ObjectExpression' },
    });

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

    node.body.body.push(staticProperty);
  }
}
