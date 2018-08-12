import React from 'react';
import PropTypes from 'prop-types';

interface Props {
  name: string;
}

const CustomShape = PropTypes.string;

export default function FuncMergeWithNoOverride(props: Props) {
  return null;
}

// @ts-ignore
FuncMergeWithNoOverride.propTypes = {
  name: CustomShape.isRequired,
};
