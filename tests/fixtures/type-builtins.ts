import React from 'react';

export interface Props {
	error: Error;
	errorOpt?: Error;
	date: Date;
	dateOpt?: Date;
	regexp: RegExp;
	regexpOpt?: RegExp;
	map: Map<string, number>;
	mapOpt?: WeakMap<object, number>;
	set: Set<number>;
	setOpt?: WeakSet<object>;
	promise: Promise<any>;
	promiseOpt?: Promise<any>;
	union: Error | Date | RegExp | null;
}

export default class TypeBuiltins extends React.Component<Props> {
	render() {
		return null;
	}
}
