import React from 'react';

export interface AProps {
	a: number;
}

export interface BProps {
	b: boolean;
}

export default class ClassMultipleGenerics extends React.Component<AProps & BProps> {
	render() {
		return null;
	}
}
