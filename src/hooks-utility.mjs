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
  // can't use arrow function here since we want to use arguments
  return useCallback(function() {
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

function useStickySelection(inputRefs) {
  if (!(inputRefs instanceof Array)) {
    inputRefs = [ inputRefs ];
  }
  const inputs = [];
  for (let inputRef of inputRefs) {
    const node = inputRef.current;
    if (node) {
      inputs.push({
        node,
        value: node.value,
        start: node.selectionStart,
        end: node.selectionEnd,
      });
    }
  }
  useEffect(() => {
    for (let input of inputs) {
      const node = input.node;
      const previous = input.value;
      const current = node.value;
      if (previous !== current) {
        const start = findNewPosition(input.start, previous, current);
        const end = findNewPosition(input.end, previous, current);
        if (typeof(start) === 'number' && typeof(end) === 'number') {
          node.selectionStart = start;
          node.selectionEnd = end;
        }
      }
    }
  }, [ inputs ]);
}

function findNewPosition(index, previous, current) {
  if (typeof(index) === 'number') {
    if (typeof(previous) === 'string' && typeof(current) === 'string') {
      const before = previous.substr(0, index);
      const index1 = current.indexOf(before);
      if (index1 !== -1) {
        return index1 + before.length;
      }
      const after = previous.substr(index);
      const index2 = current.lastIndexOf(after);
      if (index2 !== -1) {
        return index2;
      }
    }
  }
}

export {
  useEventTime,
  useListener,
  useAsyncEffect,
  useErrorCatcher,
  useComputed,
  useLastAcceptable,
  useStickySelection,
};
