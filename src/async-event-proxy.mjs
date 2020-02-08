import React from 'react';

const {
  useMemo,
  useDebugValue
} = React;

function get(target, key) {
  let f = target.methods[key] || target.handlers[key];
  if (!f) {
    let resolve;
    const promise = new Promise((r) => { resolve = r });
    promise.resolve = resolve;
    target.promises[key] = promise;
    target.statuses[key] = false;
    target.handlers[key] = f = handle.bind(target, key);
  }
  return f;
}

function set(target, key, value) {
  throw new Error('Cannot modify properties of proxy object');
}

function handle(key, evt) {
  if (this.statuses[key] !== true) {
    const f = this.filters[key];
    if (!f || f(evt)) {
      const promise = this.promises[key];
      if (evt && typeof(evt.persist) === 'function') {
        evt.persist();
      }
      this.statuses[key] = true;
      promise.resolve(evt);
    }
  }
}

function one(key) {
  return this.promises[key];
}

function all() {
  const keys = [];
  for (let key in this.promises) {
    keys.push(key);
  }
  return some.call(this, keys);
}

function some(keys) {
  const list = [];
  for (let key of keys) {
    list.push(this.promises[key]);
  }
  return Promise.all(list).then((values) => {
    const hash = {};
    for (let i = 0; i < keys.length; i++) {
      hash[keys[i]] = values[i];
    }
    return hash;
  });
}

function match(re) {
  const keys = [];
  for (let key in this.promises) {
    if (re.test(key)) {
      keys.push(key);
    }
  }
  return some.call(this, keys);
}

function race() {
  const list = [];
  for (let key in this.promises) {
    list.push(this.promises[key])
  }
  return Promise.race(list);
}

function filter(key, f) {
  this.filters[key] = f;
}

function list() {
  const list = [];
  for (let key in this.promises) {
    list.push(key)
  }
  return list;
}

function isFulfilled(key) {
  return (this.statuses[key] === true);
}

function isPending(key) {
  return (this.statuses[key] === false);
}

const traps = {
  get,
  set,
};

const methods = {
  one,
  all,
  some,
  match,
  race,
  filter,
  list,
  isFulfilled,
  isPending,
};

function AsyncEventProxy() {
  const target = {
    methods: {},
    handlers: {},
    promises: {},
    statuses: {},
    filters: {},
  };
  for (let name in methods) {
    target.methods[name] = methods[name].bind(target);
  }
  this.__proto__ = new Proxy(target, traps);
}

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
  AsyncEventProxy,
  useEventProxy,
};
