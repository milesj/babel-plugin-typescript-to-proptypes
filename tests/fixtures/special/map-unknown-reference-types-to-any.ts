import React from 'react';
// @ts-ignore

export interface Props<T> {
  as?: T;
  others: Array<T>;
}

export default class UnknownReferenceTypeToAny<T> extends React.Component<Props<T>> {
  render() {
    return null;
  }
}
