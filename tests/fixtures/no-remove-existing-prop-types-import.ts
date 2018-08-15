import React from 'react';
import PropTypes from 'prop-types';

export default class NoRemoveExistingPropTypesImport extends React.Component {
  static propTypes = {
    name: PropTypes.string,
  };

  render() {
    return null;
  }
}
