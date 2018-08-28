import { types as t } from '@babel/core';
import { ConvertState } from './types';

export default function mergePropTypes(
  objectExpr: t.ObjectExpression,
  propTypes: t.ObjectProperty[],
  state: ConvertState,
) {
  const { properties } = objectExpr;
  const existingProps: { [key: string]: boolean } = {};

  // Extract existing props so that we don't duplicate
  properties.forEach(property => {
    if (t.isObjectProperty(property) && t.isIdentifier(property.key)) {
      existingProps[property.key.name] = true;

      // Check for `airbnb-prop-types`
      if (state.options.forbidExtraProps) {
        const { namedImports } = state.airbnbPropTypes;

        if (
          // componentWithName()
          (t.isCallExpression(property.value) &&
            t.isIdentifier(property.value.callee) &&
            namedImports.includes(property.value.callee.name)) ||
          // nonNegativeInteger
          (t.isIdentifier(property.value) && namedImports.includes(property.value.name))
        ) {
          state.airbnbPropTypes.count += 1;
        }
      }
    }
  });

  // Add to the beginning of the array so existing/custom prop types aren't overwritten
  propTypes.forEach(propType => {
    if (t.isIdentifier(propType.key) && !existingProps[propType.key.name]) {
      properties.unshift(propType);
    }
  });
}
