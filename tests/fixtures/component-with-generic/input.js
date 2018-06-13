import React from 'react';

export interface FooProps {
  opt?: string;
  req: number;
}

export default class Foo extends React.Component<FooProps> {
  render() {
    return <div />;
  }
}
