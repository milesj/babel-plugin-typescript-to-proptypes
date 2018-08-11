import React from 'react';

export type AProps = {
  a: number;
};

export type BProps = {
  b: boolean;
};

export type Props = AProps &
  BProps & {
    name: string;
  };

export default class ExtendedTypeAliases extends React.Component<Props> {
  render() {
    return null;
  }
}
