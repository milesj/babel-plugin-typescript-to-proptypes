import React from 'react';

interface Shape {
  nested: Shape;
}

interface Props {
  shape: Shape;
}

export default class RecursiveType extends React.Component<Props> {
  render() {
    return null;
  }
}
