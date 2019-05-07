import { AsyncRenderingInterrupted } from './async-rendering-interrupted';
import * as Options from './options';

function AsyncRenderingCycle(target, prev) {
    this.progressElement = undefined;
    this.progressAvailable = false;
    this.progressForced = false;
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
            if (!this.noCheck) {
                this.reject(new Error('Missing call to show() prior to await'));
                return;
            }
        }

        if (element === undefined) {
            // use the last progress element
            if (this.progressElement !== undefined) {
                element = this.progressElement;
            } else if (this.elementRendered) {
                this.complete();
                return;
            }
        }
        this.progressElement = undefined;
        this.progressAvailable = false;
		this.promisedElement = element;
		this.promisedAvailable = true;
		this.rerender();
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

    if (this.noProgress) {
        return false;
    }

    var delay;
    if (this.showingProgress) {
    	delay = 0;
    } else if (disposition === 'always') {
        delay = 0;
	} else if (disposition === 'initial' && !this.elementRendered) {
		delay = 0;
    } else if (!this.fulfilled) {
    	delay = this.delayEmpty;
    } else {
		delay = this.delayRendered;
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
        this.update();
        return true;
    }
};

/**
 * Rendering the progress element now
 *
 * @param  {Boolean|undefined} force
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


/**
 * Check if the rendering cycle has been superceded by a new one. If so
 * throw an exception to end it. Ensure component is mounted as well.
 */
prototype.check = function() {
    if (this.noProgress) {
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

function get(state) {
	if (!state) {
		throw new Error('Unable to obtain state variable');
	}
	var context = state[0];
	var cycle = context.cycle;
	if (cycle) {
		cycle.context = context;
		cycle.setContext = state[1];
	}
	return cycle;
}

function start(state, target) {
	var context = state[0];
	var prev = context.cycle;
	var cycle = new AsyncRenderingCycle(target, prev);
	cycle.context = context;
	cycle.setContext = state[1];
	context.cycle = cycle;
	return cycle;
}

function acquire(state, target) {
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
        cycle = start(state, target);

        // see if the contents has been seeded
        if (cycle.initial) {
            var seed = Options.findSeed(target);
            if (seed) {
                cycle.substitute(seed);
            }
        }
    }
    return cycle;
}

prototype.constructor.get = get;
prototype.constructor.start = start;
prototype.constructor.acquire = acquire;

export {
    AsyncRenderingCycle,
};
