import React from 'react';
import PropTypes from 'prop-types';

interface Props {
  name: string;
}

const CustomShape = PropTypes.string;

export default class ClassMergeWithNoOverride extends React.Component<Props> {
  static propTypes = {
    name: CustomShape.isRequired,
  };

  render() {
    return null;
  }
}
