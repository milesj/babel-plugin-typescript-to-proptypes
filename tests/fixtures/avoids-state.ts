import React from 'react';

export interface Props {
  name: string;
}

export interface State {
  age: number;
}

export default class AvoidsState extends React.Component<Props, State> {
  render() {
    return null;
  }
}
