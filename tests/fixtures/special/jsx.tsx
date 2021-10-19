import React from 'react';

export interface Props {
	name: string;
}

export default class JSX extends React.Component<Props> {
	render() {
		return <div />;
	}
}
