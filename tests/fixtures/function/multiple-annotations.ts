import React from 'react';

export interface AProps {
  a: number;
}

export interface BProps {
  b: boolean;
}

export default function FuncMultipleAnnotations(props: AProps & BProps) {
  return null;
}
