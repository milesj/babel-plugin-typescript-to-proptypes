import { types as t } from '@babel/core';
import getTypeName from './getTypeName';

export default function extractGenericTypeNames(node?: t.TSTypeParameterInstantiation): string[] {
  const names: string[] = [];

  const mapTypeName = (param: any) => {
    if (t.isTSTypeReference(param)) {
      names.push(getTypeName(param.typeName));
    } else if (t.isTSIntersectionType(param)) {
      param.types.forEach(mapTypeName);
    }
  };

  if (node && node.params.length > 0) {
    node.params.forEach(mapTypeName);
  }

  return names;
}
