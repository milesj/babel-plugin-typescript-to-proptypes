import React from 'react';
import { integer as int } from 'airbnb-prop-types';

interface Props {
  name: string;
  age: number;
}

export default class MergeForbidExtraProps extends React.Component<Props> {
  static propTypes = {
    age: int(),
  };

  render() {
    return null;
  }
}
