import React from 'react';
import PropTypes from 'prop-types';

interface Props {
  name: string;
}

const VarMergeWithExistingPropTypes = function (props: Props) {
  return null;
};

VarMergeWithExistingPropTypes.propTypes = {
  // @ts-ignore
  custom: PropTypes.number.isRequired,
};

export default VarMergeWithExistingPropTypes;
