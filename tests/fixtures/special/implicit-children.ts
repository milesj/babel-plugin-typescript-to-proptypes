import React from 'react';

export interface PropsA {
  name: string;
}

export class ImplicitNoChildren extends React.Component<PropsA> {
  render() {
    return null;
  }
}

export interface PropsB {
  children: string;
  name: string;
}

export class ImplicitWithChildren extends React.Component<PropsB> {
  render() {
    return null;
  }
}
