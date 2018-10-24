import React from 'react';

interface Root {
  one: {
    two: {
      three: {
        four: {
          five: {
            key: 'value';
          };
        };
      };
    };
  };
}

interface Props {
  root: Root;
}

export default class MaxDepth extends React.Component<Props> {
  render() {
    return null;
  }
}
