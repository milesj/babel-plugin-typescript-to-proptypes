import React from 'react';

interface BasicProps {
	foo: boolean;
}

interface ConditionA extends BasicProps {
	A: string;
	B?: string;
}

interface ConditionB extends BasicProps {
	A?: string;
	B: string;
}

export interface Props {
	name: ConditionA | ConditionB;
}

export default class ConditionalUnions extends React.Component<Props> {
	render() {
		return null;
	}
}
