import React from 'react';

export interface Props {
  number: number;
  string: string;
  boolean: boolean;
  symbol: symbol;
  numberOpt?: number;
  stringOpt?: string;
  booleanOpt?: boolean;
  symbolOpt?: symbol;
}

export default class TypePrimitives extends React.Component<Props> {
  render() {
    return null;
  }
}
