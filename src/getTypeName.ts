import { types as t } from '@babel/core';

export function getTypeName(typeName: t.TSEntityName): string {
	if (t.isIdentifier(typeName)) {
		return typeName.name;
	}

	if (t.isTSQualifiedName(typeName)) {
		return `${getTypeName(typeName.left)}.${typeName.right.name}`;
	}

	return '';
}
