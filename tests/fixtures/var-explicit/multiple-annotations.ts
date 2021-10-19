import React from 'react';

export interface AProps {
	a: number;
}

export interface BProps {
	b: boolean;
}

const VarMultipleAnnotations: React.SFC<AProps & BProps> = () => null;

export default VarMultipleAnnotations;
