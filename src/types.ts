import { types as t, traverse } from '@babel/core';
import ts from 'typescript';

export type Path<N> = traverse.NodePath<N>;

export interface TypePropertyMap {
  [key: string]: t.TSPropertySignature[];
}

export type PropTypeDeclaration = t.TSTypeReference | t.TSIntersectionType | t.TSUnionType;

export type PropType = t.MemberExpression | t.CallExpression | t.Identifier | t.Literal;

export type JsxPragma = 'react' | 'preact';

export interface PluginOptions {
  comments?: boolean;
  customPropTypeSuffixes?: string[];
  forbidExtraProps?: boolean;
  implicitChildren?: boolean;
  maxDepth?: number;
  maxSize?: number;
  strict?: boolean;
  typeCheck?: boolean | string;
  jsxPragma?: JsxPragma;
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
  referenceTypes: {
    [key: string]:
      | t.TSEnumDeclaration
      | t.TSEnumMember
      | t.TSInterfaceDeclaration
      | t.TSTypeAliasDeclaration;
  };
  typeChecker?: ts.TypeChecker;
  typeProgram?: ts.Program;
}
