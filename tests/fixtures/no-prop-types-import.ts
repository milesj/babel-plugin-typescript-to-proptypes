import React from 'react';

export interface Props {
	name: string;
}

export default class NoPropTypesImport extends React.Component<Props> {
	render() {
		return null;
	}
}
