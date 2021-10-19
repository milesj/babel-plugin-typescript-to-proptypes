import { types as t } from '@babel/core';
import { ConvertState, PropType } from './types';

export function hasCustomPropTypeSuffix(name: string, suffixes?: string[]): boolean {
	return !!suffixes && suffixes.some((suffix) => name.endsWith(suffix));
}

export function isReactTypeMatch(name: string, type: string, reactImportedName: string): boolean {
	return name === type || name === `React.${type}` || name === `${reactImportedName}.${type}`;
}

export function wrapIsRequired(propType: PropType, optional?: boolean | null): PropType {
	return optional ? propType : t.memberExpression(propType, t.identifier('isRequired'));
}

export function createMember(
	value: t.Identifier,
	propTypesImportedName: string,
): t.MemberExpression {
	return t.memberExpression(t.identifier(propTypesImportedName), value);
}

export function createCall(
	value: t.Identifier,
	args: (PropType | t.ArrayExpression | t.ObjectExpression)[],
	propTypesImportedName: string,
): t.CallExpression {
	return t.callExpression(createMember(value, propTypesImportedName), args);
}

export function createPropTypesObject(
	propTypes: t.ObjectProperty[],
	state: ConvertState,
): t.CallExpression | t.ObjectExpression {
	const object = t.objectExpression(propTypes);

	// Wrap with forbid
	return state.options.forbidExtraProps
		? t.callExpression(t.identifier(state.airbnbPropTypes.forbidImport), [object])
		: object;
}

export function mergePropTypes(
	expr: t.Node | null | undefined,
	propTypes: t.ObjectProperty[],
	state: ConvertState,
	wrapForbid: boolean = true,
): t.CallExpression | t.ObjectExpression | undefined {
	if (!expr) {
		return undefined;
	}

	if (t.isCallExpression(expr)) {
		if (t.isIdentifier(expr.callee, { name: 'forbidExtraProps' })) {
			expr.arguments.forEach((arg, index) => {
				expr.arguments[index] = mergePropTypes(arg, propTypes, state, false)!;
			});
		}

		return expr;
	}

	if (!t.isObjectExpression(expr)) {
		return undefined;
	}

	const { properties } = expr;
	const existingProps: Record<string, boolean> = {};

	// Extract existing props so that we don't duplicate
	properties.forEach((property) => {
		if (t.isObjectProperty(property) && t.isIdentifier(property.key)) {
			existingProps[property.key.name] = true;
		}
	});

	// Add to the beginning of the array so existing/custom prop types aren't overwritten
	propTypes.forEach((propType) => {
		if (t.isIdentifier(propType.key) && !existingProps[propType.key.name]) {
			properties.unshift(propType);
		}
	});

	// Wrap with forbid
	if (wrapForbid && state.options.forbidExtraProps) {
		return t.callExpression(t.identifier(state.airbnbPropTypes.forbidImport), [expr]);
	}

	return expr;
}

let installedVersion = 0;

export function getInstalledPropTypesVersion(): number {
	if (installedVersion) {
		return installedVersion;
	}

	try {
		installedVersion = Number.parseFloat(
			// eslint-disable-next-line import/no-extraneous-dependencies
			(require('prop-types/package.json') as { version: string }).version,
		);
	} catch {
		// Swallow
	}

	return installedVersion;
}
