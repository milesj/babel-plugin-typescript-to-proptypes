import React from 'react';

interface Props {
  name: string;
}

export function withClass() {
  return (Component) => {
    class HOCComponent extends React.Component<Props> {
      render() {
        return null;
      }
    }

    return HOCComponent;
  };
}

export function withFunction() {
  return (Component) => {
    function HOCFunc(props: Props) {
      return null;
    }

    return HOCFunc;
  };
}

export function withVar() {
  return (Component) => {
    const HOCVar: React.SFC<Props> = () => null;

    return HOCVar;
  };
}
