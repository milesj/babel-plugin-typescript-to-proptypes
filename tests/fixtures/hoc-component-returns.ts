import React from 'react';

interface Props {
  name: string;
}

export function withClass() {
  return Component =>
    class HOCComponent extends React.Component<Props> {
      render() {
        return null;
      }
    };
}

export function withFunction() {
  return Component =>
    function HOCFunc(props: Props) {
      return null;
    };
}

export function withVar() {
  return Component => {
    const HOCVar: React.FC<Props> = () => null;

    return HOCVar;
  };
}
