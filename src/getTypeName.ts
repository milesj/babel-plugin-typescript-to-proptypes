/**
 * @copyright   2018-2019, Miles Johnson
 * @license     https://opensource.org/licenses/MIT
 */

import { types as t } from '@babel/core';

export default function getTypeName(typeName: t.TSEntityName): string {
  if (t.isIdentifier(typeName)) {
    return typeName.name;
  } else if (t.isTSQualifiedName(typeName)) {
    return `${getTypeName(typeName.left)}.${typeName.right.name}`;
  }

  return '';
}
