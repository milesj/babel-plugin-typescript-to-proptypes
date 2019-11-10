import React from 'react';

export interface Props {
  void: () => void;
  objReturn: () => {};
  typeReturn?: () => string;
  args: (a: number, b: boolean) => null;
  parens?: () => void;
  handler: React.ChangeEventHandler;
}

export default class TypeFunction extends React.Component<Props> {
  render() {
    return null;
  }
}
