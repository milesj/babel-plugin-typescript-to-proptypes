import React from 'react';
import PropTypes from 'prop-types';

interface Props {
  name: string;
}

export default function FuncMergeWithExistingPropTypes(props: Props) {
  return null;
}

// @ts-ignore
FuncMergeWithExistingPropTypes.propTypes = {
  custom: PropTypes.number.isRequired,
};
