import React from 'react';
import { AsyncRenderingCycle } from './async-rendering-cycle.mjs';

const {
  useState,
  useEffect,
} = React;

function use(asyncFunc) {
  // create synchronous function wrapper
  const syncFunc = function(props, ref) {
    const state = useState({});
    const target = { func: syncFunc, props };
    const options = { showProgress: true, performCheck: true, clone: clone };
    const cycle = AsyncRenderingCycle.acquire(state, target, options);

    // cancel current cycle on unmount
    useEffect(() => {
      cycle.mount();
      return () => {
        if (!cycle.hasEnded()) {
          cycle.cancel();
        }
      };
    }, [ cycle ]);
    // fulfill promise at the end of rendering cycle
    useEffect(() => {
      cycle.fulfill();
    });

    // call async function
    cycle.run(() => {
      return asyncFunc(props, ref);
    });

    AsyncRenderingCycle.end();

    // throw error that had occurred in async code
    const error = cycle.getError();
    if (error) {
      throw error;
    }

    // return either the promised element or progress
    const element = cycle.getElement();
    return element;
  };

  // attach async function (that returns a promise to the final result)
  syncFunc.renderAsyncEx = (props) => {
    const state = [ {}, (v) => {} ];
    const target = { func: syncFunc, props };
    const options = { performCheck: true, clone: clone };
    const cycle = AsyncRenderingCycle.acquire(state, target, options);
    const promise = asyncFunc(props);
    AsyncRenderingCycle.end();
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
  const syncFunc = use(asyncFunc);
  return React.memo(syncFunc, areEqual);
}

function forwardRef(asyncFunc, areEqual) {
  const syncFunc = use(asyncFunc);
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

function get(name) {
  switch (name) {
    case 'errorHandler':
      return AsyncRenderingCycle.getErrorHandler();
    case 'delayWhenEmpty':
      return AsyncRenderingCycle.getInitialDelay();
    case 'delayWhenRendered':
      return AsyncRenderingCycle.getSubsequentDelay();
  }
}

function set(name, value) {
  switch (name) {
    case 'errorHandler':
      return AsyncRenderingCycle.setErrorHandler(value);
    case 'delayWhenEmpty':
      return AsyncRenderingCycle.setInitialDelay(value);
    case 'delayWhenRendered':
      return AsyncRenderingCycle.setSubsequentDelay(value);
  }
}

function plant(list) {
  if (!(list instanceof Array)) {
    throw new Error('Seeds must be an array of object. Are you calling harvest() with the options { seeds: true }?');
  }
  AsyncRenderingCycle.plantSeeds(list);
}

export {
  use,
  memo,
  forwardRef,

  get,
  set,
  plant,
};
