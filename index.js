var React = require('react');

exports.Component = RelaksComponent;
exports.createClass = createClass;
exports.AsyncRenderingInterrupted = AsyncRenderingInterrupted;
exports.Meanwhile = Meanwhile;

function RelaksComponent() {
}

RelaksComponent.prototype = Object.create(React.Component.prototype);
RelaksComponent.prototype.constructor = RelaksComponent;

/**
 * Render component, calling renderAsync() if necessary
 *
 * @return {ReactElement|null}
 */
RelaksComponent.prototype.render = function() {
    var relaks = this.relaks;
    if (!relaks) {
        console.warn('Relaks context is missing. Make sure you are calling componentWillMount() and componentWillUnmount() of the superclass');
        return null;
    }

    // see if rendering is triggered by resolution of a promise,
    // or by a call to Meanwhile.show()
    if (relaks.promisedElementExpected) {
        // render the new promised element
        relaks.promisedElementExpected = false;
        relaks.progressElement = null;
        relaks.progressElementRendered = null;
        return relaks.promisedElement;
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
        var promise = this.renderAsync(meanwhile);

        // from here on, any call to Meanwhile.show() is asynchronous
        meanwhile.synchronous = false;
    } catch (err) {
        // a synchronouse error occurred, show any progress made or what was
        // there before
        console.error(err);
        relaks.meanwhile.clear();
        relaks.meanwhile = null;
        return relaks.progressElement || relaks.progressElementRendered || relaks.promisedElement;
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
                // dump the error into the console and return what has been
                // rendered so far or what was there before
                console.error(err);
                var element = relaks.progressElement || relaks.promisedElement;
                resolve(element);
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

    // we have triggered the asynchronize operation and are waiting for it to
    // complete; in the meantime we need to return something
    if (relaks.promisedElement) {
        // show what was there before
        return relaks.promisedElement;
    }
    if (relaks.progressElement) {
        // a progress element was provided synchronously by renderAsync()
        // we'll display that if delay is set to 0
        if (meanwhile.showingProgress) {
            return relaks.progressElement;
        } else if (!meanwhile.blankInitially) {
            // we don't want the component to be empty initially
            // show the progress unless we've progress from an earlier,
            // interrupted cycle
            if (!relaks.progressElementRendered) {
                return relaks.progressElement;
            }
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
RelaksComponent.prototype.shouldComponentUpdate = function(nextProps, nextState) {
    if (!compare(this.props, nextProps) || !compare(this.state, nextState)) {
        return true;
    }
    return false;
};

/**
 * Create Relaks context on mount.
 */
RelaksComponent.prototype.componentWillMount = function() {
    this.relaks = {
        progressElement: null,
        progressElementExpected: false,
        promisedElement: null,
        promisedElementExpected: false,
        progressElementRendered: null,
        meanwhile: null,
        previous: null,
        current: {
            props: {},
            state: {},
        },
    };
};

/**
 * Remove Relaks context on unmount, canceling any outstanding asynchronous
 * rendering cycle.
 */
RelaksComponent.prototype.componentWillUnmount = function() {
    var relaks = this.relaks;
    if (relaks) {
        if (relaks.meanwhile) {
            relaks.meanwhile.cancel();
        }
        this.relaks = undefined;
    }
};

function Meanwhile(component, previously) {
    var relaks = component.relaks;
    this.component = component;
    this.synchronous = true;
    this.showingProgress = false;
    this.delayWhenEmpty = 50;
    this.delayWhenRendered = Infinity;
    this.blankInitially = true;
    this.canceled = false;
    this.prior = (previously) ? previously.prior : relaks.previous;
    this.previous = relaks.previous;
    this.current = relaks.current;
    this.updateTimeout = 0;
    this.startTime = getTime();
    this.onCancel = null;
    this.onComplete = null;
    this.onProgress = null;
}

/**
 * Check if the rendering cycle isn't been superceded by a new one. If so
 * throw an exception to end it. Ensure component is mounted as well.
 */
Meanwhile.prototype.check = function() {
    var relaks = this.component.relaks;
    if (!relaks || this !== relaks.meanwhile) {
        // throw exception to break promise chain
        // promise library should catch and pass it to reject()
        // defined down below
        throw new AsyncRenderingInterrupted;
    }
}

/**
 * Show progress element, possibly after a delay
 *
 * @param  {ReactElement} element
 * @param  {Boolean|undefined} force
 *
 * @return {Boolean}
 */
Meanwhile.prototype.show = function(element, force) {
    var relaks = this.component.relaks;

    // make sure the rendering cycle is still current
    this.check();

    // save the element so render() can return it eventually
    relaks.progressElement = element;

    if (this.showingProgress) {
        // see if we're showing progress already, show the new progress immediately
        this.update();
        return true;
    } else {
        if (force) {
            this.update(true);
            return true;
        }
        if (this.updateTimeout) {
            // we've already schedule the displaying of progress
            // just wait for the initial timeout to fire
            return false;
        }

        var delay;
        if (!relaks.promisedElement) {
            delay = this.delayWhenEmpty;
        } else {
            delay = this.delayWhenRendered;
        }
        if (delay > 0) {
            if (delay !== Infinity) {
                // show progress after a brief delay, to allow
                // it to be bypassed by fast-resolving promises
                var _this = this;
                this.updateTimeout = setTimeout(function() {
                    // if the timeout is 0, then clearTimeout() was called on it
                    // this function might still run on occasion afterward, due to
                    // the way timeouts are scheduled
                    if (_this.updateTimeout !== 0) {
                        _this.update();
                    }
                }, delay);
            }
            return false;
        } else {
            // caller wants it to be shown immediately
            this.update();
            return true;
        }
    }
};

/**
 * Rendering the progress element now
 *
 * @param  {Boolean|undefined} force
 */
Meanwhile.prototype.update = function(force) {
    var relaks = this.component.relaks;

    // indicate that the component is displaying progress
    // unless we're forcing the progress display
    if (!force) {
        this.showingProgress = true;
    }

    // toss the result of the previous rendering cycle
    if (relaks.promisedElement) {
        relaks.promisedElement = null;
    }

    if (this.synchronous) {
        // no need to force update since we're still inside
        // render() and it can simply return the progress element
        return;
    }

    if (this.onProgress) {
        var elapsed = getTime() - this.startTime;
        this.onProgress({ type: 'progress', target: this, elapsed: elapsed });
    }

    if (relaks.progressElement === relaks.progressElementRendered) {
        // it's already rendered
        return;
    }

    // tell render() that it isn't triggered in the normal fashion
    relaks.progressElementExpected = true;
    this.component.forceUpdate();
};

/**
 * Cancel the rendering of progress and fire any onCancel handler
 */
Meanwhile.prototype.cancel = function() {
    this.clear();
    if (!this.canceled) {
        this.canceled = true;
        if (this.onCancel) {
            this.onCancel({ type: 'cancel', target: this });
        }
    }
};

/**
 * Clear timeout function and fire any onComplete handler
 */
Meanwhile.prototype.finish = function() {
    this.clear();
    if (this.onComplete) {
        var elapsed = getTime() - this.startTime;
        this.onComplete({ type: 'complete', target: this, elapsed: elapsed });
    }
};

/**
 * Cancel the any scheduled rendering of progress
 */
Meanwhile.prototype.clear = function() {
    var relaks = this.component.relaks;
    if (this.updateTimeout) {
        clearTimeout(this.updateTimeout);
        this.updateTimeout = 0;
    }
};

/**
 * Set progressive rendering delay, for when the component is empty and when
 * it has been fully rendered previously
 *
 * @param  {Number} empty
 * @param  {Number} rendered
 */
Meanwhile.prototype.delay = function(empty, rendered) {
    this.delayWhenEmpty = empty;
    this.delayWhenRendered = rendered;
};

/**
 * Determine progress element should be shown immediately when nothing has been
 * rendered yet
 *
 * @param  {Boolean} blank
 */
Meanwhile.prototype.blank = function(blank) {
    this.blankInitially = blank;
};

function AsyncRenderingInterrupted() {
    this.message = 'Async rendering interrupted';
}

AsyncRenderingInterrupted.prototype = Object.create(Error.prototype)

function createClass(specs) {
    if (specs.render) {
        throw new Error('Class definition should not contain render()');
    }
    if (!specs.renderAsync) {
        throw new Error('Class definition should contain renderAsync()');
    }

    var own = RelaksComponent.prototype;
    specs = clone(specs);
    specs.render = own.render;
    specs.componentWillMount = chain(specs.componentWillMount, own.componentWillMount);
    specs.componentWillUnmount = chain(specs.componentWillUnmount, own.componentWillUnmount);
    specs.shouldComponentUpdate = specs.shouldComponentUpdate || own.shouldComponentUpdate;
    return React.createClass(specs);
};

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
 * Clone an object shallowly
 *
 * @param  {Object} object
 *
 * @return {Object}
 */
function clone(object) {
    var newObject = {};
    for (var name in object) {
        newObject[name] = object[name];
    }
    return newObject;
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

/**
 * Chain two zero-argument functions
 *
 * @param  {Function} f
 * @param  {Function} g
 *
 * @return {Function}
 */
function chain(f, g) {
    if (!f) {
        return g;
    }
    return function() {
        f.call(this);
        g.call(this);
    };
}

var scriptStartTime = new Date;

/**
 * Return the number of milliseconds passed since start of this script
 *
 * @return {Number}
 */
function getTime() {
    return (new Date) - scriptStartTime;
}
