import React from 'react';

export interface AProps {
  a: number;
}

export interface BProps {
  b: boolean;
}

const VarMultipleAnnotations = function(props: AProps & BProps) { return null; };

export default VarMultipleAnnotations;
