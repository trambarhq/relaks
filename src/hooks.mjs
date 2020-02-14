import React from 'react';
import { AsyncRenderingCycle } from './async-rendering-cycle.mjs';

const {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
  useDebugValue,
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

function useProgress(delayEmpty, delayRendered) {
  // set delays
  const cycle = AsyncRenderingCycle.get(true);
  cycle.delay(delayEmpty, delayRendered, true);

  // return functions (bound in constructor)
  return [ cycle.show, cycle.check, cycle.delay ];
}

function useProgressTransition() {
  const cycle = AsyncRenderingCycle.get(true);
  return [ cycle.transition, cycle.hasRendered ];
}

function useRenderEvent(name, f) {
  if (!AsyncRenderingCycle.isUpdating()) {
    const cycle = AsyncRenderingCycle.get(true);
    cycle.on(name, f);
  }
}

function useEventTime() {
  const state = useState();
  const date = state[0];
  const setDate = state[1];
  const callback = useCallback((evt) => {
    setDate(new Date);
  }, []);
  useDebugValue(date);
  return [ date, callback ];
}

function useListener(f) {
  const ref = useRef({});
  if (!AsyncRenderingCycle.isUpdating()) {
    ref.current.f = f;
  }
  useDebugValue(f);
  return useCallback(() => {
    return ref.current.f.apply(null, arguments);
  }, []);
}

function useAsyncEffect(f, deps) {
  useEffect(() => {
    let cleanUp;
    let cleanUpDeferred = false;
    // invoke the callback and wait for promise to get fulfilled
    let promise = f();
    Promise.resolve(promise).then((ret) => {
      // save the clean-up function returned by the callback
      cleanUp = ret;
      // if clean-up was requested while we were waiting for the promise to
      // resolve, perform it now
      if (cleanUpDeferred) {
        cleanUp();
      }
    });
    return () => {
      if (cleanUp) {
        cleanUp();
      } else {
        // maybe we're still waiting for the promsie to resolve
        cleanUpDeferred = true;
      }
    };
  }, deps);
  useDebugValue(f);
}

function useErrorCatcher(rethrow) {
  const [ error, setError ] = useState();
  if (rethrow && error) {
    throw error;
  }
  const run = useCallback((f) => {
    // catch sync exception with try-block
    try {
      // invoke the given function
      let promise = f();
      if (promise && promise.catch instanceof Function) {
        // catch async exception
        promise = promise.then((result) => {
          setError(undefined);
          return result;
        }).catch((err) => {
          setError(err);
        });
      } else {
        setError(undefined);
      }
      return promise;
    } catch (err) {
      setError(err);
    }
  });
  const clear = useCallback((f) => {
    setError(undefined);
  }, []);
  useDebugValue(error);
  return [ error, run, clear ];
}

function useComputed(f, deps) {
  const pair = useState({});
  const state = pair[0];
  const setState = pair[1];
  // add state object as dependency of useMemo hook
  if (deps instanceof Array) {
    deps = deps.concat(state);
  } else {
    deps = [ state ];
  }
  const value = useMemo(() => {
    return (state.current = f(state.current));
  }, deps);
  const recalc = useCallback(() => {
    // force recalculation by changing state
    setState({ value: state.value });
  }, []);
  useDebugValue(value);
  return [ value, recalc ];
}

function useLastAcceptable(value, acceptable) {
  const ref = useRef();
  if (typeof(acceptable) === 'function') {
    acceptable = acceptable(value);
  }
  if (acceptable) {
    // set the value only if it's acceptable
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
