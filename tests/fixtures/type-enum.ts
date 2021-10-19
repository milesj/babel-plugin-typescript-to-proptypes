import React from 'react';

enum Standard {
	FOO,
	BAR,
	BAZ,
}

enum FirstInitializer {
	FOO = 10,
	BAR,
	BAZ,
}

enum AllNumbers {
	FOO = 10,
	BAR = 20,
	BAZ = 30,
}

enum AllStrings {
	FOO = 'Foo',
	BAR = 'Bar',
	BAZ = 'Baz',
}

enum MixedTypes {
	FOO = 1,
	BAR = 'Bar',
	BAZ = 2,
}

const enum ConstEnum {
	Up,
	Down,
	Left,
	Right,
}

export interface Props {
	standard: Standard;
	first?: FirstInitializer;
	numbers?: AllNumbers;
	strings: AllStrings;
	mixed?: MixedTypes;
	constant?: ConstEnum;
}

export default class TypeEnum extends React.Component<Props> {
	render() {
		return null;
	}
}
