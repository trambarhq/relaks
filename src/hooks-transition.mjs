import React from 'react';
import { AsyncEventProxy } from './async-event-proxy.mjs';

const { useMemo, useDebugValue } = React;

function useEventProxy(deps) {
  const proxy = useMemo(() => {
    return new AsyncEventProxy;
  }, deps);
  useDebugValue(proxy, formatDebugValue);
  return proxy;
}

function formatDebugValue(proxy) {
  const keys = proxy.list();
  const fired = [];
  for (let key of keys) {
    if (proxy.isFulfilled(key)) {
      fired.push(key);
    }
  }
  return fired.join(' ');
}

export {
  useEventProxy,
};
