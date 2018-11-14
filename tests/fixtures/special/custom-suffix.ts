import React from 'react';
// @ts-ignore
import { NameShape, AgePropType, HeightUnsupported } from './shapes';

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
