import React from 'react';

export interface Props {
	any: any[];
	null: null[];
	numbers?: Array<number>;
	strings: string[];
	booleans: boolean[];
	objects?: Array<object>;
	union: (string | number)[];
	intersection: (string & number)[];
	nested?: string[][];
}

export default class TypeArray extends React.Component<Props> {
	render() {
		return null;
	}
}
