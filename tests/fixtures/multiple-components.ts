import React from 'react';

interface AProps {
	foo: string;
}

class MultipleComponentsClass extends React.Component<AProps> {
	render() {
		return null;
	}
}

interface BProps {
	bar: number;
}

function MultipleComponentsFunc(props: BProps) {
	return null;
}

interface CProps {
	bar: number;
}

const MultipleComponentsVar: React.SFC<CProps> = () => null;

const MultipleComponentsVarFC: React.FunctionComponent<CProps> = () => null;
