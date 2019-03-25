var React = require('react');
var AsyncRenderingCycle = require('./async-rendering-cycle');
var AsyncSaveBuffer = require('./async-save-buffer');
var Seeds = require('./seeds');
var useState = React.useState;
var useEffect = React.useEffect;

// variable used for communicating between wrapper functions and hook functions 
var state;

function Relaks(asyncFunc, areEqual) {
	// create synchronous function wrapper
	var syncFunc = function(props) {
		state = useState({});
		var cycle = AsyncRenderingCycle.get(state);
		if (cycle) {
			if (cycle.hasEnded()) {
				cycle = undefined;
			} else if (!cycle.isRerendering()) {
				// cancel the current cycle
				cycle.cancel();
				cycle = undefined;
			}
		}
		if (!cycle) {
			// start a new cycle
			cycle = AsyncRenderingCycle.start(state, syncFunc, props);

	        if (cycle.isInitial()) {
	            // see if the contents has been seeded
	            var seed = Seeds.findSeed(syncFunc, props);
	            if (seed) {
	            	cycle.substitute(seed);
	            }
	        }
		}

		// cancel current cycle on unmount
		useEffect(function() {
			return function() { 
				if (!cycle.hasEnded()) {
					cycle.cancel();
				}
			};
		}, [ cycle ]);

		// call async function
		cycle.startSync();
		asyncFunc(props).then(cycle.resolve, cycle.reject);
		cycle.endSync();

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
	syncFunc.renderAsync = function(props) {
		state = [ {}, function(v) {} ];
		var cycle = AsyncRenderingCycle.start(state, syncFunc, props);
		cycle.noProgress = true;
		var promise = asyncFunc(props);
		state = undefined;
		return promise.then(function(element) {
			if (element === undefined) {
				element = cycle.progressElement;
			}
			return element;
		});
	};

	// add prop types if available
	if (asyncFunc.propTypes) {
		syncFunc.propTypes = asyncFunc.propTypes;
	}
	// memoize function unless behavior is countermanded
	if (areEqual !== false) {
		syncFunc = React.memo(syncFunc, areEqual);
	}
	// add default props if available
	if (asyncFunc.defaultProps) {
		syncFunc.defaultProps = asyncFunc.defaultProps;
	}
	// set display name
	syncFunc.displayName = asyncFunc.displayName || asyncFunc.name;
	return syncFunc;
}

function useProgress(delayEmpty, delayRendered) {
	// apply default delays
	if (typeof(delayEmpty) !== 'number') {
		delayEmpty = 50;
	}
	if (typeof(delayRendered) !== 'number') {
		delayRendered = Infinity;
	}

	// set delays
	var cycle = AsyncRenderingCycle.get(state);
	cycle.delay(delayEmpty, delayRendered);

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

function useSaveBuffer(params) {
	var state = useState();
	return AsyncSaveBuffer.get(state, params);
}

module.exports = exports = Relaks;

exports.plant = Seeds.plant;
exports.useProgress = useProgress;
exports.useRenderEvent = useRenderEvent;
exports.usePreviousProps = usePreviousProps;
exports.useSaveBuffer = useSaveBuffer;