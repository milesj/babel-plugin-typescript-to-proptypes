import React from 'react';
import PropTypes from 'prop-types';

const NameShape = PropTypes.string;
const AgePropType = PropTypes.number;

type NameShape = string;
type AgePropType = number;
type HeightUnsupported = number;

export interface Props {
  name: NameShape;
  nameOpt?: NameShape;
  age: AgePropType;
  ageOpt?: AgePropType;
  both: NameShape | AgePropType | boolean;
  height: HeightUnsupported;
}

export default class CustomSuffix extends React.Component<Props> {
  render() {
    return null;
  }
}
