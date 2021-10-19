import React from 'react';

export interface Props {
	a: number;
	b?: string | boolean;
	c: 1 | 'foo' | false;
	d?: { name?: string }[];
	e: {
		e1: string[][];
		e2: () => void;
		e3?: { e1a: object } | null;
	};
	f?: any;
	g: ((e: Event) => null) | (() => {});
	h?: { [key: string]: number } & { [key: string]: string[] };
}

export default class TypeComplex extends React.Component<Props> {
	render() {
		return null;
	}
}
