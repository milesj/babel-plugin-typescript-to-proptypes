import { types as t, traverse } from '@babel/core';

export type Path<N> = traverse.NodePath<N>;

export type TypePropertyMap = { [key: string]: t.TSPropertySignature[] };

export type PropType = t.MemberExpression | t.CallExpression;

export type ConvertOptions = {
  reactImportedName: string;
  propTypesImportedName: string;
};
