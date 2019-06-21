import React, { useMemo, useDebugValue } from 'react';

function get(target, key) {
    var f = target.methods[key] || target.handlers[key];
    if (!f) {
        var r, promise = new Promise(function(resolve) { r = resolve });
        promise.resolve = r;
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
        var f = this.filters[key];
        if (!f || f(evt)) {
            var promise = this.promises[key];
            if (evt && typeof(evt.persist) === 'function') {
                evt = evt.persist();
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
    var keys = [];
    for (var key in this.promises) {
        keys.push(key);
    }
    return some.call(this, keys);
}

function some(keys) {
    var list = [];
    for (var i = 0; i < keys.length; i++) {
        list.push(this.promises[keys[i]]);
    }
    return Promise.all(list).then(function(values) {
        var hash = {};
        for (var i = 0; i < keys.length; i++) {
            hash[keys[i]] = values[i];
        }
        return hash;
    });
}

function match(re) {
    var keys = [];
    for (var key in this.promises) {
        if (re.test(key)) {
            keys.push(key);
        }
    }
    return some.call(this, keys);
}

function race() {
    var list = [];
    for (var key in this.promises) {
        list.push(this.promises[key])
    }
    return Promise.race(list);
}

function filter(key, f) {
    this.filters[key] = f;
}

function list() {
    var list = [];
    for (var key in this.promises) {
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

var traps = {
    get: get,
    set: set,
};

var methods = {
    one: one,
    all: all,
    some: some,
    match: match,
    race: race,
    filter: filter,
    list: list,
    isFulfilled: isFulfilled,
    isPending: isPending,
};

function AsyncEventProxy() {
    var target = {
        methods: {},
        handlers: {},
        promises: {},
        statuses: {},
        filters: {},
    };
    for (var name in methods) {
        target.methods[name] = methods[name].bind(target);
    }
    this.__proto__ = new Proxy(target, traps);
}

function useEventProxy(deps) {
    var proxy = useMemo(function() {
        return new AsyncEventProxy;
    }, deps);
    useDebugValue(proxy, formatDebugValue);
    return proxy;
}

function formatDebugValue(proxy) {
    var keys = proxy.list();
    var fired = [];
    for (var i = 0; i < keys.length; i++) {
        if (proxy.isFulfilled(keys[i])) {
            fired.push(keys[i]);
        }
    }
    return fired.join(' ');
}

export {
    AsyncEventProxy,
    useEventProxy,
};
