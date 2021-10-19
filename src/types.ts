import { types as t } from '@babel/core';
import type { NodePath } from '@babel/traverse';

export type Path<N> = NodePath<N>;

export type TypePropertyMap = Record<string, t.TSPropertySignature[]>;

export type PropTypeDeclaration = t.TSIntersectionType | t.TSTypeReference | t.TSUnionType;

export type PropType = t.CallExpression | t.Identifier | t.Literal | t.MemberExpression;

export interface PluginOptions {
	comments?: boolean;
	customPropTypeSuffixes?: string[];
	forbidExtraProps?: boolean;
	implicitChildren?: boolean;
	mapUnknownReferenceTypesToAny?: boolean;
	maxDepth?: number;
	maxSize?: number;
	strict?: boolean;
	typeCheck?: boolean | string;
}

export interface ConvertState {
	airbnbPropTypes: {
		count: number;
		forbidImport: string;
		hasImport: boolean;
		namedImports: string[];
	};
	componentTypes: TypePropertyMap;
	filePath: string;
	options: Required<PluginOptions>;
	propTypes: {
		count: number;
		defaultImport: string;
		hasImport: boolean;
	};
	reactImportedName: string;
	referenceTypes: Record<
		string,
		t.TSEnumDeclaration | t.TSEnumMember | t.TSInterfaceDeclaration | t.TSTypeAliasDeclaration
	>;
}
