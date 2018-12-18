import React from 'react';

export interface Foo {
  foo: string;
}

export type Bar = {
  bar?: number;
};

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
}

export default class TypeEnum extends React.Component<Props> {
  render() {
    return null;
  }
}
