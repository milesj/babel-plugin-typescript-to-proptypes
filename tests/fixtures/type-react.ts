import React, {
  ReactText,
  ReactNode,
  ReactType,
  ElementType,
  ComponentType,
  ComponentClass,
  StatelessComponent,
  MouseEvent,
  ReactElement,
  SFCElement,
  FunctionComponentElement,
} from 'react';

export interface Props {
  text: React.ReactText;
  textAlias?: ReactText;
  node: React.ReactNode;
  nodeAlias?: ReactNode;
  type: React.ReactType;
  typeAlias?: ReactType;
  elementType: React.ElementType;
  elementTypeAlias?: ElementType;
  comp: React.ComponentType;
  compGeneric?: React.ComponentType<any>;
  compAlias: ComponentType;
  cls: React.ComponentClass;
  clsGeneric?: React.ComponentClass<any>;
  clsAlias: ComponentClass;
  sfc: React.StatelessComponent;
  sfcGeneric?: React.StatelessComponent<any>;
  sfcAlias: StatelessComponent;
  el: React.ReactElement<any>;
  elAlias?: ReactElement<any>;
  sfcEl: React.SFCElement<any>;
  sfcElAlias?: SFCElement<any>;
  fcEl: React.FunctionComponentElement<any>;
  fcElAlias?: FunctionComponentElement<any>;
  jsx: JSX.Element;
  event: React.MouseEvent;
  eventAlias?: MouseEvent;
  ref: React.Ref<any>;
}

export default class TypeReact extends React.Component<Props> {
  render() {
    return null;
  }
}
