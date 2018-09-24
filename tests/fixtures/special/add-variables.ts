import React from 'react';

interface AProps {
  a: number;
}

interface BProps {
  b: boolean;
}

export interface Props extends AProps, BProps {
  name: string;
}
