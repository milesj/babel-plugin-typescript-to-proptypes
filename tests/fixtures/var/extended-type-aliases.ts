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

const VarExtendedTypeAliases = (props: Props) => null;

export default VarExtendedTypeAliases;
