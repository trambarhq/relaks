import React from 'react';
import { AsyncSaveBuffer } from './async-save-buffer.mjs';
import { AsyncRenderingCycle } from './async-rendering-cycle.mjs';

const {
  useState,
  useRef,
  useCallback,
  useEffect,
  useDebugValue
} = React;

function useSaveBuffer(params, customClass) {
  if (AsyncRenderingCycle.isUpdating()) {
    // don't initialize when called during rerendering
    params = null;
  } else if (!params) {
    params = {};
  }
  const state = useState({});
  const buffer = AsyncSaveBuffer.acquire(state, params, customClass);
  useEffect(() => {
    // let the buffer know that the component associated with it
    // has been unmounted
    return () => {
      buffer.setContext = null;
    };
  }, []);
  useDebugValue(buffer.current);
  return buffer;
}

function useAutoSave(saveBuffer, wait, f) {
  // store the callback in a ref so the useEffect hook function will
  // always call the latest version
  const ref = useRef({});
  if (!AsyncRenderingCycle.isUpdating()) {
    ref.current.f = f;
  }
  const save = useCallback((conditional) => {
    if (conditional) {
      if (!saveBuffer.changed || ref.current.saved === saveBuffer.current) {
        return;
      }
    }
    ref.current.saved = saveBuffer.current;
    ref.current.f();
  }, []);
  useEffect(() => {
    if (saveBuffer.changed && typeof(wait) === 'number') {
      let timeout = setTimeout(() => {
        // make sure save() don't get called after timeout is cancelled
        if (timeout) {
          save(true);
        }
      }, wait);
      return () => {
        // clear the timer on new changes or unmount
        clearTimeout(timeout);
        timeout = 0;
      };
    }
  }, [ saveBuffer.current ]);
  useEffect(() => {
    // save unsaved changes on unmount
    return () => {
      save(true);
    };
  }, []);
  useDebugValue(wait);
  return save;
}

export {
  useSaveBuffer,
  useAutoSave,
};
