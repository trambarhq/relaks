import React, { useState, useEffect } from 'react';
import { AsyncRenderingCycle } from './async-rendering-cycle';

function AsyncSaveBuffer() {
	this.ready = false;
	this.original = undefined;
	this.current = undefined;
	this.changed = false;
	this.removing = false;

	this.params = undefined;
	this.setContext = undefined;

	this.set = this.set.bind(this);
	this.assign = this.assign.bind(this);
	this.reset = this.reset.bind(this);
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
	if (this.compare(base, ours)) {
		this.current = ours = base;
		this.changed = false;
	} else {
		this.current = ours;
		this.changed = true;
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
	if (this.changed) {
		this.current = base;
		this.changed = false;
		this.preserve(base, null);
		this.rerender();
	}
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

function useAutoSave(saveBuffer, wait, f) {
	var [ context ] = useState({});
	context.f = f;
	useEffect(function() {
		if (saveBuffer.changed) {
			var timeout = setTimeout(function() {
				if (timeout && saveBuffer.changed) {
					context.f();
				}
			}, wait);
			return function() {
				clearTimeout(timeout);
				timeout = 0;
			};
		}
	}, [ saveBuffer.current ]);
	useEffect(function() {
		return function() {
			if (saveBuffer.changed) {
				context.f();
			}
		};
	}, []);
}

export {
	AsyncSaveBuffer,
	useSaveBuffer,
	useAutoSave,
};
