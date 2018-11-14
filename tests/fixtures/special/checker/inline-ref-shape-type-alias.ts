import React from 'react';

type Location = {
  lat?: number;
  long: number;
};

interface Props {
  location: Location;
}

export default class CheckerInlineRefShapeTypeAlias extends React.Component<Props> {
  render() {
    return null;
  }
}
