import * as Options from './options';

function AsyncRenderingCycle(target, prev, options) {
    this.options = options;
    this.progressElement = undefined;
    this.progressAvailable = false;
    this.progressForced = false;
    this.progressPromise = undefined;
    this.transitionPromise = undefined;
    this.lastPromise = undefined;
    this.promisedElement = undefined;
    this.promisedAvailable = false;
    this.elementRendered = (prev) ? prev.elementRendered : null;
    this.deferredError = undefined;
    this.showingProgress = false;
    this.delayEmpty = Options.get('delayWhenEmpty');
    this.delayRendered = Options.get('delayWhenRendered');
    this.canceled = false;
    this.completed = false;
    this.checked = false;
    this.mounted = false;
    this.initial = true;
    this.fulfilled = false;
    this.synchronous = false;
    this.prevProps = {};
    this.prevPropsAsync = {};
    this.updateTimeout = 0;
    this.startTime = new Date;
    this.handlers = {};
    this.target = target;
    this.context = undefined;
    this.setContext = undefined;

    this.show = this.show.bind(this);
    this.check = this.check.bind(this);
    this.delay = this.delay.bind(this);
    this.resolve = this.resolve.bind(this);
    this.reject = this.reject.bind(this);
    this.hasRendered = this.hasRendered.bind(this);
    this.transition = this.transition.bind(this);

    if (prev) {
        this.prevProps = prev.target.props;
        if (prev.canceled) {
            this.prevPropsAsync = prev.prevPropsAsync;
        } else {
            this.prevPropsAsync = prev.target.props;
        }
        this.elementRendered = prev.elementRendered;
        this.initial = false;
        this.fulfilled = prev.fulfilled;
    }
}

var prototype = AsyncRenderingCycle.prototype;

prototype.hasEnded = function() {
	return this.completed || this.canceled;
};

prototype.isRerendering = function() {
    if (this.hasEnded()) {
        return false;
    }
    return this.promisedAvailable || this.progressAvailable || this.deferredError;
}

prototype.run = function(f) {
    if (this.deferredError) {
        // don't bother running the function when we're going to throw anyway
        return;
    }
    this.synchronous = true;
    try {
        var promise = f();
        if (promise && typeof(promise.then) === 'function') {
            promise.then(this.resolve, this.reject);
        } else {
            this.resolve(promise);
        }
    } catch (err) {
        this.reject(err);
    }
    this.synchronous = false;
};

prototype.resolve = function(element) {
    this.clear();
    this.fulfilled = true;
	if (!this.hasEnded()) {
        if (!this.checked) {
            if (this.options.performCheck) {
                this.reject(new Error('Missing call to show() prior to await'));
                return;
            }
        }

        if (element === undefined) {
            // wait for the action to complete
            if (this.lastPromise && !this.lastPromise.fulfilled) {
                if (this.progressElement) {
                    // draw the last progress element
                    this.update();
                }
                var _this = this;
                this.lastPromise.then(function() {
                    _this.complete();
                });
            } else {
                this.complete();
            }
        } else {
            this.finalize(element);
        }
	}
};

prototype.reject = function(err) {
	this.clear();
    if (!(err instanceof AsyncRenderingInterrupted)) {
    	if (!this.hasEnded()) {
			this.deferredError = err;
            if (this.mounted) {
                this.rerender();
            }
		} else {
            if (process.env.NODE_ENV !== 'production') {
                console.error(err);
            }
        }
	}
};

prototype.mount = function() {
    this.mounted = true;
    if (this.initial) {
        if (this.isRerendering()) {
            this.rerender();
        }
    }
};

prototype.fulfill = function() {
    if (this.progressPromise && !this.progressPromise.fulfilled) {
        if (!this.progressElement) {
            this.progressPromise.resolve(true);
        }
    }
};

prototype.getElement = function() {
	if (this.promisedAvailable) {
		this.elementRendered = this.promisedElement;
		this.promisedElement = undefined;
		this.promisedAvailable = false;
		this.complete();
	} else if (this.progressAvailable) {
        this.elementRendered = this.progressElement;
        this.progressElement = undefined;
        this.progressAvailable = false;
        this.progress();
    }
    return this.elementRendered;
};

prototype.getError = function() {
	if (this.deferredError) {
		var error = this.deferredError;
		this.deferredError = undefined;
		this.cancel();
		return error;
	}
};

prototype.getPrevProps = function(asyncCycle) {
	return asyncCycle ? this.prevPropsAsync : this.prevProps;
};

prototype.substitute = function(element) {
	this.promisedElement = element;
    this.promisedAvailable = true;

    // schedule immediate rerendering so refs, callbacks are correct
    var _this = this;
    setTimeout(function() {
        _this.setContext({ cycle: _this });
    }, 0);
};

prototype.on = function(name, f) {
	this.handlers[name] = f;
};

prototype.show = function(element, disposition) {
    // make sure the rendering cycle is still current
    this.check();

    // save the element so it can be rendered eventually
    this.progressElement = element;

    if (this.progressPromise && !this.progressPromise.fulfilled) {
        this.progressPromise.resolve(false);
    }
    var r, _this = this;
    var promise = new Promise(function(resolve) { r = resolve });
    promise.fulfilled = false;
    promise.resolve = function(value) {
        promise.fulfilled = true;
        r(value);
    };
    this.progressPromise = this.lastPromise = promise;

    if (!this.options.showProgress) {
        return false;
    }

    var delay, forced = false;
    if (this.showingProgress) {
    	delay = 0;
    } else if (!this.fulfilled) {
    	delay = this.delayEmpty;
    } else {
		delay = this.delayRendered;
    }
    if (disposition === 'always' || (disposition === 'initial' && !this.elementRendered)) {
       delay = 0;
       forced = true;
    }

    if (delay > 0) {
        if (delay !== Infinity) {
            // show progress after a brief delay, to allow
            // it to be bypassed by fast-resolving promises
            if (!this.updateTimeout) {
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
        }
        return false;
    } else {
        // caller wants it to be shown immediately
        this.update(forced);
        return true;
    }
};

/**
 * Rendering the progress element now
 *
 * @param  {Boolean|undefined} forced
 */
prototype.update = function(forced) {
    this.progressAvailable = true;
    this.progressForced = forced;

    // force rerendering only if the component is mounted or during the
    // initial rendering cycle (React seems to be able to handle that)
    if (this.initial || this.mounted) {
        this.rerender();
    }
};

prototype.finalize = function(element) {
    if (this.progressPromise) {
        this.progressPromise.resolve(false);
    }
    this.progressElement = undefined;
    this.progressAvailable = false;
    this.promisedElement = element;
    this.promisedAvailable = true;
    if (this.initial || this.mounted) {
        this.rerender();
    }
};

/**
 * Check if the rendering cycle has been superceded by a new one. If so
 * throw an exception to end it. Ensure component is mounted as well.
 */
prototype.check = function() {
    if (!this.options.showProgress) {
        return;
    }
    if (this.synchronous) {
        this.checked = true;
        if (this.isRerendering()) {
            throw new AsyncRenderingInterrupted;
        }
    }
    if (this.canceled) {
        throw new AsyncRenderingInterrupted;
    }
};

/**
 * Set progressive rendering delay, for when the component is empty and when
 * it has been fully rendered previously
 *
 * @param  {Number} empty
 * @param  {Number} rendered
 */
prototype.delay = function(empty, rendered) {
    if (typeof(empty) === 'number') {
        this.delayEmpty = empty;
    }
    if (typeof(rendered) === 'number') {
        this.delayRendered = rendered;
    }
};

/**
 * Wait for pending show() or transition() to complete
 *
 * @return {Promise}
 */
prototype.hasRendered = function() {
    var promise = this.lastPromise;
    if (!promise) {
        throw new Error('No pending operation');
    }
    return promise;
};

/**
 * Alter the progress element immediately after it's been rendered
 *
 * @param  {Object} props
 */
prototype.transition = function(props) {
    var _this = this;
    var promise = this.hasRendered().then(function(shown) {
        if (shown) {
            var clone = _this.options.clone;
            var element = clone(_this.elementRendered, props);
            _this.show(element);
            return _this.progressPromise.then(function(shown) {
                promise.fulfilled = true;
                return shown;
            });
        } else {
            return false;
        }
    });
    promise.fulfilled = false;
    this.transitionPromise = this.lastPromise = promise;
};

/**
 * Cancel the rendering of progress and trigger cancel handler
 */
prototype.cancel = function() {
    this.clear();
    if (!this.canceled) {
        this.canceled = true;
		this.notify('cancel');
    }
};

/**
 * Mark the cycle as completed and trigger complete handler
 */
prototype.complete = function() {
    this.clear();
    if (!this.completed) {
    	this.completed = true;
		this.notify('complete');
    }
};

/**
 * Indicate that progress is being shown and trigger progress handler
 */
prototype.progress = function() {
	if (!this.showingProgress) {
		if (!this.progressForced) {
			this.showingProgress = true;
		}
	}
	this.notify('progress');
};

/**
 * Cancel the any scheduled rendering of progress
 */
prototype.clear = function() {
    if (this.updateTimeout) {
        clearTimeout(this.updateTimeout);
        this.updateTimeout = 0;
    }
};

/**
 * Force rendering by recreating the context object
 */
prototype.rerender = function() {
    if (this.synchronous) {
        // no need to force renderering since we're still inside
        // the synchronous function call and we can simply return
        // the progress element
        return;
    }

    if (!this.hasEnded()) {
		if (this.context.cycle === this) {
            this.setContext({ cycle: this });
		}
	}
};

prototype.notify = function(name) {
	var f = this.handlers[name];
	if (f) {
		var elapsed = (new Date) - this.startTime;
		var evt = {
			type: name,
			elapsed: elapsed,
			target: this.target,
		};
		f(evt);
	}
};

var currentState;

function get(state) {
    if (!state) {
        state = currentState;
    }
    if (!state) {
        return null;
    }
	var context = state[0];
	var cycle = context.cycle;
	if (cycle) {
		cycle.context = context;
		cycle.setContext = state[1];
	}
	return cycle;
}

function need(state) {
    var cycle = get(state);
    if (!cycle) {
        throw new Error('Unable to obtain state variable');
    }
    return cycle;
}

function acquire(state, target, options) {
    var cycle = get(state);
    if (cycle) {
        if (cycle.hasEnded()) {
            cycle = undefined;
        } else if (!cycle.isRerendering()) {
            // cancel the current cycle
            cycle.cancel();
            cycle = undefined;
        }
    }
    if (!cycle) {
        // start a new cycle
        var context = state[0];
    	var prev = context.cycle;
    	var cycle = new AsyncRenderingCycle(target, prev, options);
    	cycle.context = context;
    	cycle.setContext = state[1];
    	context.cycle = cycle;

        // see if the contents has been seeded
        if (cycle.initial) {
            var seed = Options.findSeed(target);
            if (seed) {
                cycle.substitute(seed);
            }
        }
    }
    currentState = state;
    return cycle;
}

function skip() {
    var cycle = get();
    return (cycle && cycle.isRerendering());
}

function release() {
    currentState = null;
}

prototype.constructor.get = get;
prototype.constructor.need = need;
prototype.constructor.acquire = acquire;
prototype.constructor.release = release;
prototype.constructor.skip = skip;

function AsyncRenderingInterrupted() {
    this.message = 'Async rendering interrupted';
}

var prototype = Object.create(Error.prototype)
prototype.constructor = AsyncRenderingInterrupted;
prototype.constructor.prototype = prototype;

export {
    AsyncRenderingCycle,
    AsyncRenderingInterrupted,
};
