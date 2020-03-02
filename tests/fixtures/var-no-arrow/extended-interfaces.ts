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

const VarExtendedInterfaces = function(props: Props) { return null; };

export default VarExtendedInterfaces;
