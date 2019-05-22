import React, { useState, useEffect } from 'react';
import { AsyncRenderingCycle } from './async-rendering-cycle';

function AsyncSaveBuffer() {
	this.ready = false;
	this.original = undefined;
	this.current = undefined;
	this.changed = false;
	this.saving = false;
	this.removing = false;
	this.error = undefined;

	this.params = undefined;
	this.promise = null;
	this.saved = undefined;
	this.timeout = 0;
	this.setContext = undefined;
}

var prototype = AsyncSaveBuffer.prototype;

prototype.base = function(theirs) {
    if (theirs == null) {
		return;
	}
	if (!this.ready) {
		var ours;
		var preserved = this.restore(theirs);
		if (ours !== undefined) {
			ours = preserved;
		} else {
			ours = this.prefill(theirs);
		}
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
	} else if (this.saving) {
		if (this.saved === undefined || this.compare(this.saved, theirs)) {
			this.current = theirs;
			this.changed = false;
			this.saving = false;
			this.saved = undefined;
		}
	} else {
		var base = this.original;
		var ours = this.current;
		if (!this.compare(base, theirs)) {
			if (this.changed) {
				var merged = this.merge(base, ours, theirs);
				if (!this.compare(merged, theirs)) {
					this.current = merged;
					this.preserve(theirs, ours);
				} else {
					this.current = theirs;
					this.changed = false;
					this.cancelAutosave();
					this.preserve(base, null);
				}
			} else {
				this.current = theirs;
			}
		}
	}
	this.original = theirs;
}

prototype.set = function(ours) {
	var base = this.check();
	this.cancelAutosave();
	if (this.compare(base, ours)) {
		this.current = ours = base;
		this.changed = false;
	} else {
		this.current = ours;
		this.changed = true;
		this.autosave();
	}
	this.preserve(base, ours);
	this.rerender();
};

prototype.assign = function(values /* ... */) {
	var newObject = Object.assign({}, this.current);
	for (var i = 0; i < arguments.length; i++) {
		Object.assign(newObject, arguments[i]);
	}
	this.set(newObject);
};

prototype.reset = function() {
	var base = this.check();
	this.cancelAutosave();
	if (this.changed) {
		this.current = base;
		this.changed = false;
		this.preserve(base, null);
		this.rerender();
	}
};

prototype.save = function() {
	var base = this.check();
	var ours = this.current;
	var saveFunc = this.params.save || saveDef;
	var args = [ base, ours ];
	for (var i = 0; i < arguments.length; i++) {
		args.push(arguments[i]);
	}
	var promise = saveFunc.apply(this, args);
	var _this = this;
	_this.saving = true;
	_this.promise = promise;
	_this.rerender();
	return Promise.resolve(promise).then(function(result) {
		if (_this.promise === promise) {
			_this.saved = result;
			_this.promise = null;
			_this.preserve(base, null);
		}
		return result;
	}).catch(function(err) {
		var canceled = err instanceof Cancellation;
		_this.saving = false;
		_this.promise = null;
		_this.error = (canceled) ? undefined : err;
		_this.rerender();
		if (!canceled) {
			throw err;
		}
	});
};

prototype.autosave = function() {
	var delay = this.params.autosave || this.params.autoSave;
	if (typeof(delay) === 'number') {
		var _this = this;
		this.timeout = setTimeout(function() {
			if (_this.timeout !== 0) {
				_this.timeout = 0;
				_this.save();
			}
		}, delay);
	}
};

prototype.cancelAutosave = function() {
	if (this.timeout) {
		clearTimeout(this.timeout);
		this.timeout = 0;
	}
};

prototype.remove = prototype.delete = function() {
	if (_this.removing) {
		return Promise.resolve();
	}
	var base = this.check();
	var ours = this.current;
	this.preserve(base, null);
	var removeFunc = this.params.remove || this.params.delete || removeDef;
	var args = [ base, ours ];
	for (var i = 0; i < arguments.length; i++) {
		args.push(arguments[i]);
	}
	var promise = removeFunc.apply(this, args);
	_this.removing = true;
	_this.rerender();
	return Promise.resolve(promise).then(function(result) {
		_this.removing = false;
		_this.rerender();
		return result;
	}).catch(function(err) {
		var canceled = err instanceof Cancellation;
		_this.removing = false;
		_this.error = (canceled) ? undefined : err;
		_this.rerender();
		if (!canceled) {
			throw err;
		}
	});
};

prototype.compare = function(ours, theirs) {
	var compareFunc = this.params.compare || compareDef;
	return compareFunc(ours, theirs);
};

prototype.merge = function(base, ours, theirs) {
	var mergeFunc = this.params.merge || mergeDef;
	return mergeFunc(base, ours, theirs);
};

prototype.preserve = function(base, ours) {
	var preserveFunc = this.params.preserve || preserveDef;
	preserveFunc(base, ours);
};

prototype.restore = function(theirs) {
	var restoreFunc = this.params.restore || restoreDef;
	return restoreFunc(theirs);
};

prototype.prefill = function(theirs) {
	var prefillFunc = this.params.prefill || prefillDef;
	return prefillFunc(theirs);
};

prototype.rerender = function() {
	if (this.setContext) {
		this.setContext({ buffer: this });
	}
};

prototype.check = function() {
	if (!this.ready) {
		throw new Error('Original value has not been set');
	}
	return this.original;
};

prototype.use = function(params) {
	this.params = params;
	this.base(params.original);
	if (params.reset && this.ready && this.changed) {
		var base = this.original;
		this.current = base;
		this.changed = false;
		this.preserve(base, null);
	}
};

function acquire(state, params) {
	var context = state[0];
	var buffer = context.buffer;
	if (!buffer) {
		buffer = context.buffer = new AsyncSaveBuffer;
		buffer.setContext = state[1];
	}
	if (params) {
		buffer.use(params);
	}
	return buffer;
};

function compareDef(ours, theirs) {
	return (ours === theirs);
}

function mergeDef(base, ours, theirs) {
	return theirs;
}

function saveDef(base, ours) {
	throw new Error('No save function');
}

function removeDef(base, ours) {
	throw new Error('No remove function');
}

function preserveDef(base, ours) {
}

function restoreDef(base) {
}

function prefillDef(base) {
}

prototype.constructor.acquire = acquire;

function useSaveBuffer(params) {
	var cycle = AsyncRenderingCycle.get();
	if (cycle && cycle.isRerendering()) {
		// don't initialize when called during rerendering
		params = null;
	} else if (!params) {
		params = {};
	}
	var state = useState({});
	var buffer = acquire(state, params);
	useEffect(function() {
		return function() { buffer.setContext = null };
	}, []);
	return buffer;
}

function Cancellation() {
    this.message = 'Operation cancelled';
}

var prototype = Object.create(Error.prototype)
prototype.constructor = Cancellation;
prototype.constructor.prototype = prototype;

export {
	AsyncSaveBuffer,
	Cancellation,
	useSaveBuffer,
};
