import React from 'react';

interface Props {
	shape: {
		foo: string;
		bar: number;
		baz: boolean;
		qux: null;
	};
	union: 'foo' | 'bar' | 'baz' | 'qux';
}

export default class MaxSize extends React.Component<Props> {
	render() {
		return null;
	}
}
