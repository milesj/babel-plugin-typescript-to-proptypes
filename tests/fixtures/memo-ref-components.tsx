import React from 'react';

interface RefProps {
	foo?: string;
	ref: React.Ref<HTMLButtonElement>;
}

function BaseRefComp(props: RefProps) {
	return null;
}

const RefComp = React.forwardRef<HTMLButtonElement, RefProps>((props, ref) => (
	<BaseRefComp ref={ref} {...props} />
));

const RefCompAlt = React.forwardRef((props: RefProps, ref: React.Ref<HTMLButtonElement>) => (
	<BaseRefComp ref={ref} {...props} />
));

const RefCompNoTypes = React.forwardRef((props, ref) => null);

interface MemoProps {
	bar: number;
}

const MemoComp = React.memo<MemoProps>((props) => {
	return null;
});

const MemoCompAlt = React.memo((props: MemoProps) => {
	return null;
});

const MemoCompNoTypes = React.memo((props) => {
	return null;
});
