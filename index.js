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
        return relaks.promisedElement;
    } else if (relaks.progressElementExpected) {
        // render the new progress element
        relaks.progressElementExpected = false;
        return relaks.progressElement;
    }

    // normal rerendering--we need to call renderAsync()
    //
    // first cancel any unfinished rendering cycle
    if (relaks.meanwhile) {
        var previously = relaks.meanwhile;
        relaks.meanwhile = null;
        // use a try block, in case user-supplied onCancel handler attached
        // to the meanwhile object throws
        try {
            previously.cancel();
        } catch (err) {
            console.error(err);
        }
    }

    // create new meanwhile object
    var meanwhile = relaks.meanwhile = new Meanwhile(this);
    var prevProps = relaks.prevProps;
    var prevState = relaks.prevState;

    // call user-defined renderAsync() in a try-catch block to catch potential errors
    try {
        var promise = this.renderAsync(meanwhile, prevProps, prevState);

        // from here on, any call to Meanwhile.show() is asynchronous
        meanwhile.synchronous = false;
    } catch (err) {
        // a synchronouse error occurred, show any progress made or what was
        // there before
        console.error(err);
        relaks.meanwhile.clear();
        relaks.meanwhile = null;
        return relaks.progressElement || relaks.promisedElement;
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
                relaks.progressElement = null;
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
    }

    // we have triggered the asynchronize operation and are waiting for it to
    // complete; in the meantime we need to return something
    if (relaks.promisedElement) {
        // show what was there before
        return relaks.promisedElement;
    }
    if (relaks.progressElement) {
        // a progress element was provided synchronously by renderAsync()
        // we'll display that; clear the timeout function if progress was
        // set to show on a delay
        meanwhile.clear();
        return relaks.progressElement;
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
        // save expiring props and state so they can be passed to renderAsync()
        var relaks = this.relaks;
        relaks.prevProps = this.props;
        relaks.prevState = this.state;
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
        meanwhile: null,
        prevProps: {},
        prevState: (this.state) ? {} : undefined,
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

function Meanwhile(component) {
    this.component = component;
    this.synchronous = true;
    this.showingProgress = false;
    this.updateTimeout = 0;
    this.startTime = getTime();
    this.canceled = false;
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
 * @param  {Number} delay
 *
 * @return {Boolean}
 */
Meanwhile.prototype.show = function(element, delay) {
    var relaks = this.component.relaks;

    // make sure the rendering cycle is still current
    this.check();

    // save the element so render() can return it eventually
    relaks.progressElement = element;

    // see if we're showing progress already...
    if (this.showingProgress) {
        // if so, show the new progress immediately
        this.update();
        return true;
    } else {
        if (this.updateTimeout) {
            // we've already schedule the displaying of progress
            if (delay !== undefined) {
                // caller wants to set a new delay, remove the current one first
                clearTimeout(this.updateTimeout);
                this.updateTimeout = 0;

                if (delay > 0) {
                    // substract time already spent
                    var elapsed = getTime() - this.startTime;
                    delay -= elapsed;
                }
            } else {
                // nothing to do--just wait for the initial timeout to fire
                return false;
            }
        }

        if (delay > 0) {
            if (delay !== Infinity) {
                // show progress after a brief delay, to allow
                // it to be bypassed by fast-resolving promises
                var _this = this;
                this.updateTimeout = setTimeout(function() {
                    _this.update();
                }, delay);
            }
            return false;
        } else if (delay <= 0) {
            // caller wants it to be shown immediately
            this.update();
            return true;
        } else {
            // when no delay is given, then progress is shown only
            // if the component would be blank otherwise--this is assuming
            // that the first time this function was invoked was done so
            // synchrously (i.e. not in a promise callback)
            //
            // if the component was rendered before, then nothing happens
            // until all promises resolve--or if a call to show() is made
            // and a delay is given
            return !!relaks.promisedElement;
        }
    }
};

/**
 * Rendering the progress element now
 */
Meanwhile.prototype.update = function() {
    var relaks = this.component.relaks;

    // indicate that the component is displaying progress
    this.showingProgress = true;

    // toss the result of the previous rendering cycle
    relaks.promisedElement = null;

    if (this.synchronous) {
        // no need to force update since we're still inside
        // render() and it can simply return the progress element
        return;
    }
    // if the timeout is 0, then clearTimeout() was called on it
    // this function might still run on occasion afterward, due to
    // the way timeouts are schedule
    if (!this.updateTimeout) {
        return;
    }

    if (this.onProgress) {
        var elapsed = getTime() - this.startTime;
        this.onProgress({ type: 'progress', target: this, elapsed: elapsed });
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
