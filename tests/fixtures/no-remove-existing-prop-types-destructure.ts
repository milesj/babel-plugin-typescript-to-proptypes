import React from 'react';
import { string } from 'prop-types';

export default class NoRemoveExistingPropTypesDestructure extends React.Component {
  static propTypes = {
    name: string,
  };

  render() {
    return null;
  }
}
