import { types as t, traverse } from '@babel/core';
import ts from 'typescript';

export type Path<N> = traverse.NodePath<N>;

export type TypePropertyMap = { [key: string]: t.TSPropertySignature[] };

export type PropType = t.MemberExpression | t.CallExpression | t.Identifier;

export type ConvertState = {
  airbnbPropTypes: {
    count: number;
    forbidImport: string;
    hasImport: boolean;
    namedImports: string[];
  };
  componentTypes: TypePropertyMap;
  filePath: string;
  options: PluginOptions;
  propTypes: {
    count: number;
    defaultImport: string;
    hasImport: boolean;
  };
  reactImportedName: string;
  typeChecker?: ts.TypeChecker;
};

export type PluginOptions = {
  customPropTypeSuffixes?: string[];
  forbidExtraProps?: boolean;
  typeCheck?: boolean;
};
