import { types as t } from '@babel/core';
import getTypeName from './getTypeName';

export default function extractGenericTypeNames(node?: t.TSTypeParameterInstantiation): string[] {
  const names: string[] = [];

  if (node && node.params.length > 0) {
    node.params.forEach(param => {
      if (t.isTSTypeReference(param)) {
        names.push(getTypeName(param.typeName));
      }
    });
  }

  return names;
}
