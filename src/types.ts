import { types as t, traverse } from '@babel/core';

export type Path<N> = traverse.NodePath<N>;

export type TypePropertyMap = { [key: string]: t.TSPropertySignature[] };

export type PropType = t.MemberExpression | t.CallExpression | t.Identifier;

export type ConvertState = {
  componentTypes: TypePropertyMap;
  filePath: string;
  hasPropTypesImport: boolean;
  options: PluginOptions;
  propTypeCount: number;
  propTypesImportedName: string;
  reactImportedName: string;
};

export type PluginOptions = {
  customPropTypeSuffixes?: string[];
};
