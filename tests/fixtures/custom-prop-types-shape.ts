import React from 'react';
import PropTypes from 'prop-types';

const NameShape = PropTypes.string;
const AgePropType = PropTypes.number;

type NameShape = string;
type AgePropType = number;

export interface Props {
  name: NameShape;
  nameOpt?: NameShape;
  age: AgePropType;
  ageOpt?: AgePropType;
  both: NameShape | AgePropType | boolean;
}

export default class CustomPropTypesShape extends React.Component<Props> {
  render() {
    return null;
  }
}
