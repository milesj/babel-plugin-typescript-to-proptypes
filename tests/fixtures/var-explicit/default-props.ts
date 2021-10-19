import React from 'react';

interface Props {
	name: string;
}

const VarDefaultProps: React.SFC<Props> = () => null;

VarDefaultProps.defaultProps = {
	name: 'Foo',
};

export default VarDefaultProps;
