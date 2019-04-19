import { Component } from 'preact';
import * as Options from './options';
import { AsyncRenderingCycle } from './async-rendering-cycle';

function AsyncComponent(props) {
    Component.call(this, props);

    var _this = this;
    var state = [
    	{},
    	function (context) {
    		state[0] = context;
    		_this.forceUpdate();
    	}
    ];
    this.relaks = state;
}

var prototype = Object.create(Component.prototype);
prototype.constructor = AsyncComponent;
prototype.constructor.prototype = prototype;

/**
 * Render component, calling renderAsync() if necessary
 *
 * @param  {Object} props
 * @param  {Object} state
 * @param  {Object} context
 *
 * @return {VNode|null}
 */
prototype.render = function(props, state, context) {
	var cycle = AsyncRenderingCycle.acquire(this.relaks, this);
	if (!cycle.isRerendering()) {
		// call async function
		var _this = this;
		cycle.run(function() {
			return _this.renderAsync(cycle, props, state, context);
		});
	}
    cycle.mounted = true;

	// throw error that had occurred in async code
	var error = cycle.getError();
    if (error) {
        var errorHandler = Options.get('errorHandler');
        if (errorHandler instanceof Function) {
            errorHandler(error);
        }
    }

    // return either the promised element or progress
	var element = cycle.getElement();
    return element;
};

prototype.renderAsyncEx = function() {
    var cycle = AsyncRenderingCycle.acquire(this.relaks, this);
    cycle.noProgress = true;
    var promise = this.renderAsync(cycle, this.props, this.state, this.context);
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

/**
 * Return false if the component's props and state haven't changed.
 *
 * @param  {Object} nextProps
 * @param  {Object} nextState
 *
 * @return {Boolean}
 */
prototype.shouldComponentUpdate = function(nextProps, nextState) {
    if (!compare(this.props, nextProps) || !compare(this.state, nextState)) {
        return true;
    }
    return false;
};

/**
 * Cancel any outstanding asynchronous rendering cycle on unmount.
 */
prototype.componentWillUnmount = function() {
	var cycle = AsyncRenderingCycle.get(this.relaks);
	if (!cycle.hasEnded()) {
		cycle.cancel();
	}
};

/**
 * Compare two objects shallowly
 *
 * @param  {Object} prevSet
 * @param  {Object} nextSet
 *
 * @return {Boolean}
 */
function compare(prevSet, nextSet) {
    if (prevSet === nextSet) {
        return true;
    }
    if (!prevSet || !nextSet) {
        return false;
    }
    for (var key in nextSet) {
        var prev = prevSet[key];
        var next = nextSet[key];
        if (next !== prev) {
            return false;
        }
    }
    return true;
}

export {
	AsyncComponent as default,
	AsyncComponent,
};
