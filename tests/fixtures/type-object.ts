import React from 'react';

export interface Props {
  object: object;
  empty: {};
  index?: { [key: string]: number };
  shape: {
    id: number;
    name?: string;
    status: 'active' | 'pending';
  };
}

export default class TypeObject extends React.Component<Props> {
  render() {
    return null;
  }
}
