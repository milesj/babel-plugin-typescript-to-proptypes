import React from 'react';

export interface AProps {
  a: number;
}

export interface BProps {
  b: boolean;
}

export interface Props extends AProps, BProps {
  name: string;
}

export default function FuncExtendedInterfaces(props: Props) {
  return null;
}
