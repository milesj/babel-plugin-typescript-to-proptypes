import React from 'react';

export interface Props {
	errors?: Record<string, boolean>;
	attributes: Record<string, string>;
}

export default class TypeRecord extends React.Component<Props> {
	render() {
		return null;
	}
}
