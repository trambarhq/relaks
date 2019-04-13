import React, { useState, useEffect, useCallback } from 'react';
import { AsyncRenderingCycle } from './async-rendering-cycle';

// variable used for communicating between wrapper functions and hook functions
var state;

function use(asyncFunc) {
	// create synchronous function wrapper
	var syncFunc = function(props) {
		state = useState({});
		var target = { func: syncFunc, props };
		var cycle = AsyncRenderingCycle.acquire(state, target);

		// cancel current cycle on unmount
		useEffect(function() {
			cycle.mount();
			return function() {
				if (!cycle.hasEnded()) {
					cycle.cancel();
				}
			};
		}, [ cycle ]);

		// call async function
		cycle.run(function() {
			return asyncFunc(props);
		});

        state = undefined;

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
		state = [ {}, function(v) {} ];
		var target = { func: syncFunc, props };
		var cycle = AsyncRenderingCycle.start(state, target);
		cycle.noProgress = true;
		var promise = asyncFunc(props);
		state = undefined;
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
	var memoizedFunc = React.memo(syncFunc, areEqual);

	if (!memoizedFunc.defaultProps) {
		memoizedFunc.defaultProps = syncFunc.defaultProps;
	}
	return memoizedFunc;
}

function useProgress(delayEmpty, delayRendered) {
	// set delays
	var cycle = AsyncRenderingCycle.get(state);
	cycle.delay(delayEmpty, delayRendered, true);

	// return functions (bound in constructor)
	return [ cycle.show, cycle.check, cycle.delay ];
}

function useRenderEvent(name, f) {
	var cycle = AsyncRenderingCycle.get(state);
	cycle.on(name, f);
}

function usePreviousProps(asyncCycle) {
	var cycle = AsyncRenderingCycle.get(state);
	return cycle.getPrevProps(asyncCycle);
}

function useEventTime() {
	var state = useState();
	var date = state[0];
	var setDate = state[1];
	var callback = useCallback(function(evt) {
		setDate(new Date);
	});
	return [ date, callback ];
}

export {
	use,
	memo,

	useProgress,
	useRenderEvent,
	usePreviousProps,
	useEventTime,
};
