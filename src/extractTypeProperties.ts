import { types as t } from '@babel/core';
import { TypePropertyMap } from './types';

export function extractTypeProperties(
	node: t.Node,
	types: TypePropertyMap,
): t.TSPropertySignature[] {
	const properties: t.TSPropertySignature[] = [];
	const mapToPropertySignature = (data: t.Node[]) => {
		data.forEach((prop) => {
			if (t.isTSPropertySignature(prop)) {
				properties.push(prop);
			}
		});
	};

	// Props
	if (t.isIdentifier(node)) {
		if (types[node.name]) {
			properties.push(...types[node.name]);
		}

		// Props
	} else if (t.isTSTypeReference(node)) {
		properties.push(...extractTypeProperties(node.typeName, types));

		// interface {}
	} else if (t.isTSInterfaceDeclaration(node)) {
		(node.extends ?? []).forEach((ext) => {
			properties.push(...extractTypeProperties(ext.expression, types));
		});

		mapToPropertySignature(node.body.body);

		// type = {}
	} else if (t.isTSTypeAliasDeclaration(node)) {
		properties.push(...extractTypeProperties(node.typeAnnotation, types));

		// {}
	} else if (t.isTSTypeLiteral(node)) {
		mapToPropertySignature(node.members);

		// Props & {}, Props | {}
	} else if (t.isTSIntersectionType(node) || t.isTSUnionType(node)) {
		node.types.forEach((intType) => {
			properties.push(...extractTypeProperties(intType, types));
		});
	}

	return properties;
}
