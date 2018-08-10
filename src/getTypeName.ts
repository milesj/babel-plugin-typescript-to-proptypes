import { types as t } from '@babel/core';

export default function getTypeName(typeName: t.TSEntityName): string {
  if (t.isIdentifier(typeName)) {
    return typeName.name;
  } else if (t.isTSQualifiedName(typeName)) {
    return `${getTypeName(typeName)}.${typeName.right.name}`;
  }

  return '';
}
