import React from 'react';

interface RefProps {
  foo?: string;
  ref: React.Ref<HTMLButtonElement>;
}

function BaseRefComp(props: RefProps) {
  return null;
}

const RefComp = React.forwardRef<HTMLButtonElement>((props, ref) => (
  <BaseRefComp ref={ref} {...props} />
));

interface MemoProps {
  bar: number;
}

const MemoComp = React.memo((props: MemoProps) => {
  return null;
});
