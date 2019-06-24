import React, { useState, useRef, useMemo, useEffect, useCallback, useDebugValue, ReactElement } from 'react';
import { AsyncRenderingCycle } from './async-rendering-cycle';

function use(asyncFunc) {
	// create synchronous function wrapper
	var syncFunc = function(props, ref) {
		var state = useState({});
		var target = { func: syncFunc, props };
		var options = { showProgress: true, performCheck: true, clone: clone };
		var cycle = AsyncRenderingCycle.acquire(state, target, options);

		// cancel current cycle on unmount
		useEffect(function() {
			cycle.mount();
			return function() {
				if (!cycle.hasEnded()) {
					cycle.cancel();
				}
			};
		}, [ cycle ]);
		useEffect(function() {
			cycle.fulfill();
		});

		// call async function
		cycle.run(function() {
			return asyncFunc(props, ref);
		});

        AsyncRenderingCycle.release();

		// throw error that had occurred in async code
		var error = cycle.getError();
        if (error) {
        	throw error;
        }

        // return either the promised element or progress
		var element = cycle.getElement();
        return element;

	};

	// attach async function (that returns a promise to the final result)
	syncFunc.renderAsyncEx = function(props) {
		var state = [ {}, function(v) {} ];
		var target = { func: syncFunc, props };
		var options = { performCheck: true, clone: clone };
		var cycle = AsyncRenderingCycle.acquire(state, target, options);
		var promise = asyncFunc(props);
		AsyncRenderingCycle.release();
		if (promise && typeof(promise.then) === 'function') {
			return promise.then(function(element) {
				if (element === undefined) {
					element = cycle.progressElement;
				}
				return element;
			});
		} else {
			return promise;
		}
	};

	// add prop types if available
	if (asyncFunc.propTypes) {
		syncFunc.propTypes = asyncFunc.propTypes;
	}
	// add default props if available
	if (asyncFunc.defaultProps) {
		syncFunc.defaultProps = asyncFunc.defaultProps;
	}
	// set display name
	syncFunc.displayName = asyncFunc.displayName || asyncFunc.name;
	return syncFunc;
}

function memo(asyncFunc, areEqual) {
	var syncFunc = use(asyncFunc);
	return React.memo(syncFunc, areEqual);
}

function forwardRef(asyncFunc, areEqual) {
	var syncFunc = use(asyncFunc);
	return React.memo(React.forwardRef(syncFunc), areEqual);
}

function clone(element, props) {
	if (React.isValidElement(props)) {
		return props;
	} else if (React.isValidElement(element)) {
		return React.cloneElement(element, props);
	} else {
		return null;
	}
}

function useProgress(delayEmpty, delayRendered) {
	// set delays
	var cycle = AsyncRenderingCycle.need();
	cycle.delay(delayEmpty, delayRendered, true);

	// return functions (bound in constructor)
	return [ cycle.show, cycle.check, cycle.delay ];
}

function useProgressTransition() {
	var cycle = AsyncRenderingCycle.need();
	return [ cycle.transition, cycle.hasRendered ];
}

function useRenderEvent(name, f) {
	if (!AsyncRenderingCycle.skip()) {
		var cycle = AsyncRenderingCycle.need();
		cycle.on(name, f);
	}
}

function useEventTime() {
	var state = useState();
	var date = state[0];
	var setDate = state[1];
	var callback = useCallback(function(evt) {
		setDate(new Date);
	});
	useDebugValue(date);
	return [ date, callback ];
}

function useListener(f) {
	var ref = useRef({});
	if (!AsyncRenderingCycle.skip()) {
		ref.current.f = f;
	}
	useDebugValue(f);
	return useCallback(function () {
		return ref.current.f.apply(null, arguments);
	}, []);
}

function useAsyncEffect(f, deps) {
	useEffect(function() {
		var cleanup;
		var unmounted = false;
		var promise = f();
		Promise.resolve(promise).then(function(ret) {
			cleanup = ret;
			if (unmounted) {
				cleanup();
			}
		});
		return function() {
			unmounted = true;
			if (cleanup) {
				cleanup();
			}
		};
	}, deps);
	useDebugValue(f);
}

function useErrorCatcher(rethrow) {
	var [ error, setError ] = useState();
	if (rethrow && error) {
		throw error;
	}
	var run = useCallback(function(f) {
		try {
			var promise = f();
			if (promise && promise.catch instanceof Function) {
				promise = promise.catch(function(err) {
					setError(err);
				});
			}
			return promise;
		} catch (err) {
			setError(err);
		}
	});
	useDebugValue(error);
	return [ error, run ];
}

function useComputed(f, deps) {
	var pair = useState({});
	var state = pair[0];
	var setState = pair[1];
	if (deps instanceof Array) {
		deps = deps.concat(state);
	} else {
		deps = [ state ];
	}
	var value = useMemo(function() {
		return (state.current = f(state.current));
	}, deps);
	var recalc = useCallback(function() {
		setState({ value: state.value });
	}, []);
	useDebugValue(value);
	return [ value, recalc ];
}

function useLastAcceptable(value, acceptable) {
	var ref = useRef();
	if (typeof(acceptable) === 'function') {
		acceptable = acceptable(value);
	}
	if (acceptable) {
		ref.current = value;
	}
	useDebugValue(ref.current);
	return ref.current;
}

export {
	use,
	memo,
	forwardRef,

	useProgress,
	useProgressTransition,
	useRenderEvent,
	useEventTime,
	useListener,
	useAsyncEffect,
	useErrorCatcher,
	useComputed,
	useLastAcceptable,
};
