import { types as t } from '@babel/core';
import { getTypeName } from './getTypeName';

export function extractGenericTypeNames(node: t.Node): string[] {
	const names: string[] = [];

	// <Foo>
	if (t.isTSTypeParameterInstantiation(node)) {
		node.params.forEach((param) => {
			names.push(...extractGenericTypeNames(param));
		});

		// Foo
	} else if (t.isTSTypeReference(node)) {
		names.push(getTypeName(node.typeName));

		// Foo & Bar, Foo | Bar
	} else if (t.isTSIntersectionType(node) || t.isTSUnionType(node)) {
		node.types.forEach((param) => {
			names.push(...extractGenericTypeNames(param));
		});
	}

	return names;
}
