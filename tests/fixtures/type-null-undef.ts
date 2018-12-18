import React from 'react';

export interface Props {
  nullable: string | null;
  undefined: string | undefined;
  optional?: string;
  optionalUndefined?: string | undefined;
  optionalNullable?: string | null;
  optionalBoth?: string | null | undefined;
  literalNullable: 'foo' | null;
  literalUndefined: 'foo' | undefined;
  literalOptional?: 'foo';
  literalOptionalUndefined?: 'foo' | undefined;
  literalOptionalNullable?: 'foo' | null;
  literalOptionalBoth?: 'foo' | null | undefined;
}

export default class NullUndefined extends React.Component<Props> {
  render() {
    return null;
  }
}
