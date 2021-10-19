import React from 'react';

type SigAlias = {
	(): string;
};

interface SigInt {
	(): number;
}

interface Props {
	typeAlias: SigAlias;
	interface: SigInt;
}

export default class CallSigs extends React.Component<Props> {
	render() {
		return null;
	}
}
