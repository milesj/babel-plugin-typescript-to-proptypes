import React from 'react';

type Things = 'foo' | 'bar' | 'baz';

export interface Props {
	object: object;
	empty: {};
	index?: { [key: string]: number };
	shape: {
		id: number;
		name?: string;
		status: 'active' | 'pending';
	};
	mapped?: { [K in Things]: string | number };
}

export default class TypeObject extends React.Component<Props> {
	render() {
		return null;
	}
}
