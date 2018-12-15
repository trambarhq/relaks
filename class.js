var AsyncRenderingInterrupted = require('./async-rendering-interrupted');
var Meanwhile = require('./meanwhile');

module.exports = function(React) {

var isPreact = (React.h instanceof Function);
var supportErrorBoundary = !isPreact && parseInt(React.version) >= 16;

var errorHandler = function(err) {
    console.error(err);
};

function RelaksComponent(props) {
    React.Component.call(this, props);
    this.createRelaksContext();
}

var prototype = Object.create(React.Component.prototype);
prototype.constructor = RelaksComponent;
prototype.constructor.prototype = prototype;

prototype.createRelaksContext = function() {
    this.relaks = {
        progressElement: null,
        progressElementExpected: false,
        promisedElement: null,
        promisedElementExpected: false,
        progressElementRendered: null,
        promisedError: null,
        promisedErrorExpected: false,
        initialRender: true,
        meanwhile: null,
        previous: null,
        current: {
            props: {},
            state: {},
        },
    };
};

/**
 * Render component, calling renderAsync() if necessary
 *
 * @return {ReactElement|null}
 */
prototype.render = function() {
    var relaks = this.relaks;

    // see if rendering is triggered by resolution of a promise,
    // or by a call to Meanwhile.show()
    if (relaks.promisedElementExpected) {
        // render the new promised element
        relaks.promisedElementExpected = false;
        relaks.progressElement = null;
        relaks.progressElementRendered = null;
        return relaks.promisedElement;
    } else if (relaks.promisedErrorExpected) {
        // throw error encounted in async code
        relaks.promisedErrorExpected = false;
        throw relaks.promisedError;
    } else if (relaks.progressElementExpected) {
        // render the new progress element
        relaks.progressElementExpected = false;
        relaks.progressElementRendered = relaks.progressElement;
        return relaks.progressElement;
    }

    // normal rerendering--we need to call renderAsync()
    //
    // first cancel any unfinished rendering cycle
    var previously = relaks.meanwhile;
    if (previously) {
        relaks.meanwhile = null;
        // use a try block, in case user-supplied onCancel handler attached
        // to the meanwhile object throws
        try {
            previously.cancel();
        } catch (err) {
            console.error(err);
        }
    }

    relaks.previous = relaks.current;
    relaks.current = {
        props: this.props,
        state: this.state || {},
    };

    // create new meanwhile object
    var meanwhile = relaks.meanwhile = new Meanwhile(this, previously);

    // call user-defined renderAsync() in a try-catch block to catch potential errors
    try {
        var promise;
        if (relaks.initialRender) {
            // see if the contents has been seeded
            promise = findSeed(this.constructor, this.props);
        }
        if (!promise) {
            if (isPreact) {
                promise = this.renderAsync(meanwhile, this.props, this.state, this.context);
            } else {
                promise = this.renderAsync(meanwhile);
            }
        }

        // from here on, any call to Meanwhile.show() is asynchronous
        meanwhile.synchronous = false;
    } catch (err) {
        // a synchronouse error occurred,
        relaks.meanwhile.clear();
        relaks.meanwhile = null;
        if (supportErrorBoundary) {
            // throw the error if there's support for error boundary
            throw err;
        } else {
            // otherwise call the error handler then show any progress made
            // or what was there before
            if (errorHandler instanceof Function) {
                errorHandler(err);
            }
            return relaks.progressElement || relaks.progressElementRendered || relaks.promisedElement;
        }
    }

    if (isPromise(promise)) {
        // set up handlers for the promise returned
        var _this = this;
        var resolve = function(element) {
            if (meanwhile !== relaks.meanwhile) {
                // a new rendering cycle has started
                meanwhile.cancel();
            } else if (!_this.relaks) {
                // component has been unmounted
                meanwhile.cancel();
            } else {
                // tell render() to show the element
                meanwhile.finish();
                relaks.promisedElement = element;
                relaks.promisedElementExpected = true;
                relaks.meanwhile = null;
                _this.forceUpdate();
            }
        };
        var reject = function(err) {
            if (err instanceof AsyncRenderingInterrupted) {
                // the rendering cycle was interrupted--do nothing
            } else {
                if (supportErrorBoundary) {
                    // throw the error in render() if we're still mounted
                    if (_this.relaks) {
                        relaks.promisedError = err;
                        relaks.promisedErrorExpected = true;
                        relaks.meanwhile = null;
                        _this.forceUpdate();
                    }
                } else {
                    // otherwise call the error handler then return what has
                    // been rendered so far or what was there before
                    if (errorHandler instanceof Function) {
                        errorHandler(err);
                    }
                    var element = relaks.progressElement || relaks.promisedElement;
                    resolve(element);
                }
            }
        };
        promise.then(resolve, reject);
    } else {
        // allow renderAsync() to act synchronously
        var element = promise;
        relaks.meanwhile = null;
        relaks.promisedElement = element;
        relaks.progressElement = null;
        relaks.progressElementRendered = null;
    }
    relaks.initialRender = false;

    // we have triggered the asynchronize operation and are waiting for it to
    // complete; in the meantime we need to return something
    if (relaks.promisedElement) {
        // show what was there before
        return relaks.promisedElement;
    }
    if (relaks.progressElement) {
        // a progress element was provided synchronously by renderAsync()
        // we'll display that if delay is set to 0
        if (meanwhile.showingProgress || meanwhile.showingProgressInitially) {
            return relaks.progressElement;
        }
    }
    if (relaks.progressElementRendered) {
        // show the previous progress
        return relaks.progressElementRendered;
    }
    // umm, we got nothing
    return null;
};

/**
 * Return false if the component's props and state haven't changed.
 *
 * @param  {Object} nextProps
 * @param  {Object} nextState
 *
 * @return {Boolean}
 */
prototype.shouldComponentUpdate = function(nextProps, nextState) {
    if (!compare(this.props, nextProps) || !compare(this.state, nextState)) {
        return true;
    }
    return false;
};

/**
 * Remove Relaks context on unmount, canceling any outstanding asynchronous
 * rendering cycle.
 */
prototype.componentWillUnmount = function() {
    var relaks = this.relaks;
    if (relaks) {
        if (relaks.meanwhile) {
            relaks.meanwhile.cancel();
        }

        this.relaks = undefined;
    }
};

function set(name, value) {
    switch (name) {
        case 'errorHandler':
            errorHandler = value;
            break;
        case 'delayWhenEmpty':
            Meanwhile.delayWhenEmpty = value;
            break;
        case 'delayWhenRendered':
            Meanwhile.delayWhenRendered = value;
            break;
        case 'seeds':
            seeds = value;
            break;
    }
}

return {
    Component: prototype.constructor,
    AsyncComponent: prototype.constructor,
    AsyncRenderingInterrupted: AsyncRenderingInterrupted,
    Meanwhile: Meanwhile,
    set: set,
};
};

var seeds = [];

function findSeed(type, props) {
    var index = -1;
    var best = -1;
    for (var i = 0; i < seeds.length; i++) {
        var seed = seeds[i];
        if (seed.type === type) {
            // the props aren't going to match up exactly due to object
            // recreations; just find the one that is closest
            var count = 0;
            if (props && seed.props) {
                for (var key in props) {
                    if (seed.props[key] === props[key]) {
                        count++;
                    }
                }
            }
            if (count > best) {
                // choose this one
                index = i;
                best = count;
            }
        }
    }
    if (index != -1) {
        var match = seeds[index];
        seeds.splice(index, 1);
        return match.result;
    }
}

/**
 * Return true if the given object is a promise
 *
 * @param  {Object} object
 *
 * @return Boolean
 */
function isPromise(object) {
    if (object && typeof(object.then) === 'function') {
        return true;
    }
    return false;
}

/**
 * Compare two objects shallowly
 *
 * @param  {Object} prevSet
 * @param  {Object} nextSet
 *
 * @return {Boolean}
 */
function compare(prevSet, nextSet) {
    if (prevSet === nextSet) {
        return true;
    }
    if (!prevSet || !nextSet) {
        return false;
    }
    for (var key in nextSet) {
        var prev = prevSet[key];
        var next = nextSet[key];
        if (next !== prev) {
            return false;
        }
    }
    return true;
}
