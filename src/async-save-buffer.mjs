import React from 'react';
import { AsyncRenderingCycle } from './async-rendering-cycle';

const {
  useState,
  useRef,
  useCallback,
  useEffect,
  useDebugValue
} = React;

class AsyncSaveBuffer {
  constructor() {
    this.ready = false;
    this.original = undefined;
    this.current = undefined;
    this.changed = false;

    this.params = undefined;
    this.setContext = undefined;
  }

  base(theirs) {
    if (theirs == null) {
      return;
    }
    if (!this.ready) {
      const preserved = this.restore(theirs);
      const ours = (preserved !== undefined) ? preserved : this.prefill(theirs);
      if (ours !== undefined && !this.compare(ours, theirs)) {
        this.current = ours;
        this.changed = true;
      } else {
        if (process.env.NODE_ENV !== 'production') {
          // invoke compare() now so that syntax error would
          // throw immediately
          this.compare(theirs, theirs);
        }
        this.current = theirs;
      }
      this.ready = true;
    } else {
      const base = this.original;
      const ours = this.current;
      if (!this.compare(base, theirs)) {
        if (this.changed) {
          const merged = this.merge(base, ours, theirs);
          if (!this.compare(merged, theirs)) {
            this.current = merged;
            this.preserve(theirs, ours);
          } else {
            this.current = theirs;
            this.changed = false;
            this.preserve(base, null);
          }
        } else {
          this.current = theirs;
        }
      }
    }
    this.original = theirs;
  }

  update(ours) {
    const base = this.check();
    ours = this.transform(ours);
    if (this.changed && this.compare(this.current, ours)) {
      return;
    }
    if (this.compare(base, ours)) {
      this.current = ours = base;
      this.changed = false;
    } else {
      this.current = ours;
      this.changed = true;
    }
    this.preserve(base, ours);
    this.rerender();
  }

  set(ours) {
    return this.update(ours);
  }

  assign(...sources) {
    const newObject = Object.assign({}, this.current);
    for (let source of sources) {
      Object.assign(newObject, source);
    }
    this.update(newObject);
  }

  reset() {
    const base = this.check();
    if (this.changed) {
      this.current = base;
      this.changed = false;
      this.preserve(base, null);
      this.rerender();
    }
  }

  compare(ours, theirs) {
    const compareFunc = this.params.compare || compareDef;
    return compareFunc(ours, theirs);
  }

  merge(base, ours, theirs) {
    const mergeFunc = this.params.merge || mergeDef;
    return mergeFunc(base, ours, theirs);
  }

  preserve(base, ours) {
    const preserveFunc = this.params.preserve || preserveDef;
    preserveFunc(base, ours);
  }

  restore(theirs) {
    const restoreFunc = this.params.restore || restoreDef;
    return restoreFunc(theirs);
  }

  prefill(theirs) {
    const prefillFunc = this.params.prefill || prefillDef;
    return prefillFunc(theirs);
  }

  transform(ours) {
    const transformFunc = this.params.transform || transformDef;
    return transformFunc(ours);
  }

  rerender() {
    if (this.setContext) {
      this.setContext({ buffer: this });
    }
  }

  check() {
    if (!this.ready) {
      throw new Error('Original value has not been set');
    }
    return this.original;
  }

  use(params) {
    this.params = params;
    this.base(params.original);
    if (params.reset && this.ready && this.changed) {
      const base = this.original;
      this.current = base;
      this.changed = false;
      this.preserve(base, null);
    }
  }

  static acquire(state, params, bufferClass) {
    if (!bufferClass) {
      bufferClass = this;
    }
    const context = state[0];
    let buffer = context.buffer;
    if (!buffer) {
      buffer = context.buffer = new bufferClass;
      buffer.setContext = state[1];
    }
    if (params) {
      buffer.use(params);
    }
    return buffer;
  }
}

function compareDef(ours, theirs) {
  return (ours === theirs);
}

function mergeDef(base, ours, theirs) {
  return theirs;
}

function preserveDef(base, ours) {
}

function restoreDef(base) {
}

function prefillDef(base) {
}

function transformDef(ours) {
  return ours;
}

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
  AsyncSaveBuffer,
  useSaveBuffer,
  useAutoSave,
};
