import React from 'react';

interface AProps {
	foo: string;
}

interface BProps {
	bar: number;
}

class NestedComponentsClass extends React.Component<AProps> {
	render() {
		function NestedComponentsFunc(props: BProps) {
			return null;
		}

		return null;
	}
}
