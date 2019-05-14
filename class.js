import React, { PureComponent } from 'react';
import * as Options from './options';
import { AsyncRenderingCycle } from './async-rendering-cycle';

function AsyncComponent(props) {
    PureComponent.call(this, props);

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

var prototype = Object.create(PureComponent.prototype);
prototype.constructor = AsyncComponent;
prototype.constructor.prototype = prototype;

/**
 * Render component, calling renderAsync() if necessary
 *
 * @return {ReactElement|null}
 */
prototype.render = function() {
    var options = { showProgress: true };
	var cycle = AsyncRenderingCycle.acquire(this.relaks, this, options);
	if (!cycle.isRerendering()) {
		// call async function
		var _this = this;
		cycle.run(function() {
			return _this.renderAsync(cycle);
		});
	}
    AsyncRenderingCycle.release();
    cycle.mounted = true;

	// throw error that had occurred in async code
	var error = cycle.getError();
    if (error) {
    	if (parseInt(React.version) >= 16) {
	    	throw error;
    	} else {
    		var errorHandler = Options.get('errorHandler');
            if (errorHandler instanceof Function) {
                errorHandler(error);
            }
    	}
    }

    // return either the promised element or progress
	var element = cycle.getElement();
    return element;
};

prototype.renderAsyncEx = function() {
    var cycle = AsyncRenderingCycle.acquire(this.relaks, this, {});
    var promise = this.renderAsync(cycle);
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

/**
 * Cancel any outstanding asynchronous rendering cycle on unmount.
 */
prototype.componentWillUnmount = function() {
	var cycle = AsyncRenderingCycle.get(this.relaks);
	if (!cycle.hasEnded()) {
		cycle.cancel();
	}
};

export {
	AsyncComponent as default,
	AsyncComponent,
};
