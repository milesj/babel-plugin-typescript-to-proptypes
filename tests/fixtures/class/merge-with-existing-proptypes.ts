import React from 'react';
import PropTypes from 'prop-types';

interface Props {
	name: string;
}

export default class ClassMergeWithExistingPropTypes extends React.Component<Props> {
	static propTypes = {
		custom: PropTypes.number.isRequired,
	};

	render() {
		return null;
	}
}
