import React from 'react';

interface Location {
  lat?: number;
  long: number;
}

interface Props {
  location: Location;
}

export default class CheckerInlineRefShapeInterface extends React.Component<Props> {
  render() {
    return null;
  }
}
