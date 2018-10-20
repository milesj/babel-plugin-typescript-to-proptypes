import React from 'react';

type List = 'foo' | 'bar' | 'baz';

interface Props {
  name: string;
  list: List;
}

export default class TSPreset extends React.Component<Props> {
  render() {
    return null;
  }
}
