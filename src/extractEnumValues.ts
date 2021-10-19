import { types as t } from '@babel/core';

export function extractEnumValues(enumDecl: t.TSEnumDeclaration): (number | string)[] {
	const values: (number | string)[] = [];
	let lastIndex = -1;

	enumDecl.members.forEach(({ initializer }) => {
		if (initializer) {
			if (t.isNumericLiteral(initializer)) {
				lastIndex = initializer.value;
				values.push(initializer.value);
			} else if (t.isStringLiteral(initializer)) {
				values.push(initializer.value);
			} else {
				// Skip
			}
		} else {
			lastIndex += 1;
			values.push(lastIndex);
		}
	});

	return values;
}
