import React from 'react';
import PropTypes from 'prop-types';

export default class Foo extends React.Component {
  static propTypes = {
    opt: PropTypes.string,
    req: PropTypes.number.isRequired,
  };

  render() {
    return <div />;
  }
}
