import React from 'react';

interface Props {
  name: string;
}

export default function FuncDefaultProps(props: Props) {
  return null;
}

// @ts-ignore
FuncDefaultProps.defaultProps = {
  name: 'Foo',
};
