import React from 'react';

interface Props {
  name: string;
}

export default class ClassDefaultProps extends React.Component<Props> {
  static defaultProps = {
    name: 'Foo',
  };

  render() {
    return null;
  }
}
