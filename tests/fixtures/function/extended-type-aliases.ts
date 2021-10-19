import React from 'react';

export type AProps = {
	a: number;
};

export type BProps = {
	b: boolean;
};

export type Props = AProps &
	BProps & {
		name: string;
	};

export default function FuncExtendedTypeAliases(props: Props) {
	return null;
}
