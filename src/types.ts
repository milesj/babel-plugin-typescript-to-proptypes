import { types as t, traverse } from '@babel/core';

export type Path<N> = traverse.NodePath<N>;

export type Component<T = t.ClassDeclaration | t.FunctionDeclaration | t.VariableDeclaration> = {
  path: Path<T>;
  name: string;
  type: 'class' | 'function' | 'var';
};

export type TypePropertyMap = { [key: string]: t.TSPropertySignature[] };

export type PropType = t.MemberExpression | t.CallExpression;
