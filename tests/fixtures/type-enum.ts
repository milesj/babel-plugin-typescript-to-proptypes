import React from 'react';

export interface Foo {
  foo: string;
}

export type Bar = {
  bar?: number;
};

export enum Baz {
  Foo,
  Bar,
}

export enum Qux {
  Foo,
  Bar,
}

export interface Props {
  union: number | string | object;
  intersection?: number & string & object;
  combined: number & (string | object);
  strUnion?: 'foo' | 'bar' | 'baz';
  strIntersection: 'foo' & 'bar' & 'baz';
  numUnion: 1 | 2 | 3;
  numIntersection?: 1 & 2 & 3;
  anyUnion: any | number | string;
  typeRefUnion: Foo | Bar;
  typeRefIntersection?: Foo & Bar;
  typeRefEnumIntersection?: Baz.Bar & Qux.Bar;
  typeRefEnumUnion?: Baz.Foo | Baz.Bar | Qux.Bar;
  typeRefEnum?: Qux;
}

export default class TypeEnum extends React.Component<Props> {
  render() {
    return null;
  }
}
