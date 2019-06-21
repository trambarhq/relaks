var handlers = {
    get: get,
    set: set,
};

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

var methods = {
    one: one,
    all: all,
    race: race,
    filter: filter,
    isFulfilled: isFulfilled,
    isPending: isPending,
};

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

function all() {
    var list = [];
    var keys = [];
    for (var key in this.promises) {
        list.push(this.promises[key]);
        keys.push(key);
    }
    return Promise.all(list).then(function(values) {
        var hash = {};
        for (var i = 0; i < values.length; i++) {
            hash[keys[i]] = values[i];
        }
        return hash;
    });
}

function one(key) {
    return this.promises[key];
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

function isFulfilled(key) {
    return (this.statuses[key] === true);
}

function isPending(key) {
    return (this.statuses[key] === false);
}

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
    this.__proto__ = new Proxy(target, handlers);
}

export {
    AsyncEventProxy,
};
