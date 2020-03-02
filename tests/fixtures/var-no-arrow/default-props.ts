import React from 'react';

interface Props {
  name: string;
}

const VarDefaultProps = function(props: Props) { return null; };

VarDefaultProps.defaultProps = {
  name: 'Foo',
};

export default VarDefaultProps;
