import React from 'react';

export interface AProps {
	a: number;
}

export interface BProps {
	b: boolean;
}

const VarMultipleAnnotations = (props: AProps & BProps) => null;

export default VarMultipleAnnotations;
