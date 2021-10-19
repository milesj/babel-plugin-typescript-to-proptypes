import React from 'react';

interface Props {
	name: string;
}

const VarDefaultProps = (props: Props) => null;

VarDefaultProps.defaultProps = {
	name: 'Foo',
};

export default VarDefaultProps;
