import React from 'react';

export interface Props {
	any: any;
	unknowns: unknown;
	voids: void;
	number: number;
	string: string;
	boolean: boolean;
	symbol: symbol;
	anyOpt?: any;
	numberOpt?: number;
	stringOpt?: string;
	booleanOpt?: boolean;
	symbolOpt?: symbol;
	literalNumber: 123;
	literalString?: 'abc';
	literalBool: true;
}

export default class TypePrimitives extends React.Component<Props> {
	render() {
		return null;
	}
}
