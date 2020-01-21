import React, { PureComponent } from 'react';
import * as Options from './options.mjs';
import { AsyncRenderingCycle } from './async-rendering-cycle.mjs';

class AsyncComponent extends PureComponent {
  constructor(props) {
    super(props);

    const state = [
    	{},
    	function (context) {
    		state[0] = context;
    		this.forceUpdate();
    	}
    ];
    this.relaks = state;
  }

  /**
   * Render component, calling renderAsync() if necessary
   *
   * @return {ReactElement|null}
   */
  render() {
    const options = { showProgress: true, clone };
  	const cycle = AsyncRenderingCycle.acquire(this.relaks, this, options);
  	if (!cycle.isRerendering()) {
  		// call async function
  		cycle.run(() => {
  			return this.renderAsync(cycle);
  		});
  	}
    AsyncRenderingCycle.release();
    cycle.mounted = true;

  	// throw error that had occurred in async code
  	const error = cycle.getError();
    if (error) {
    	if (parseInt(React.version) >= 16) {
	    	throw error;
    	} else {
    		const errorHandler = Options.get('errorHandler');
        if (errorHandler instanceof Function) {
          errorHandler(error);
        }
    	}
    }

    // return either the promised element or progress
  	const element = cycle.getElement();
    return element;
  }

  renderAsyncEx() {
    const options = { clone };
    const cycle = AsyncRenderingCycle.acquire(this.relaks, this, options);
    const promise = this.renderAsync(cycle);
    AsyncRenderingCycle.release();
    if (promise && typeof(promise.then) === 'function') {
      return promise.then((element) => {
        if (element === undefined) {
          element = cycle.progressElement;
        }
        return element;
      });
    } else {
      return promise;
    }
  }

  /**
   * Cancel any outstanding asynchronous rendering cycle on unmount.
   */
  componentWillUnmount() {
  	const cycle = AsyncRenderingCycle.get(this.relaks);
  	if (!cycle.hasEnded()) {
  		cycle.cancel();
  	}
  }
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

export {
	AsyncComponent as default,
	AsyncComponent,
};
