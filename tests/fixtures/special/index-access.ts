import React from 'react';

interface Base {
	union: 1 | 2 | 3 | 4 | 5;
}

interface Props {
	// @ts-ignore Test for missing property
	name: Base['unknown'];
	list: Base['union'];
}

export default class IndexAccess extends React.Component<Props> {
	render() {
		return null;
	}
}
