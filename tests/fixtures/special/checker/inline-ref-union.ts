import React from 'react';

type List = 'foo' | 'bar' | 'baz';

interface Props {
  list: List;
}

export default class CheckerInlineRefUnion extends React.Component<Props> {
  render() {
    return null;
  }
}
