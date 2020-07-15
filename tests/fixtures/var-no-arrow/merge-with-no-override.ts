import React from 'react';
import PropTypes from 'prop-types';

interface Props {
  name: string;
}

const CustomShape = PropTypes.string;

const VarMergeWithNoOverride = function (props: Props) {
  return null;
};

// @ts-ignore
VarMergeWithNoOverride.propTypes = {
  name: CustomShape.isRequired,
};

export default VarMergeWithNoOverride;
