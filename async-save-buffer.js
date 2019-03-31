import React, { useState } from 'react';

function AsyncSaveBuffer() {
	this.params = undefined;
	this.original = undefined;
	this.current = undefined;
	this.changed = false;
	this.saving = false;
	this.saved = undefined;
	this.promise = null;
	this.error = null;
	this.timeout = 0;
	this.context = undefined;
	this.setContext = undefined;	
}

var prototype = AsyncSaveBuffer.prototype;

prototype.set = function(ours) {
	var base = this.original;
	this.cancelAutoCommit();
	if (this.compare(base, ours)) {
		this.current = ours = base;
		this.changed = false;
	} else {
		this.current = ours;
		this.changed = true;
		this.autoCommit();
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

prototype.reset =function() {
	var base = this.original;
	this.cancelAutoCommit();
	this.current = base;
	this.changed = false;
	this.preserve(base, base);
	this.rerender();
};

prototype.commit = function() {
	var base = this.original;
	var ours = this.current;
	return this.save(base, ours);
};

prototype.autoCommit = function() {
	var delay = this.params.autosave || this.params.autoSave;
	if (typeof(delay) === 'number') {
		var _this = this;
		this.timeout = setTimeout(function() {
			if (_this.timeout !== 0) {
				_this.timeout = 0;
				_this.commit();
			}
		}, delay);
	}
};

prototype.cancelAutoCommit = function() {
	if (this.timeout) {
		clearTimeout(this.timeout);
		this.timeout = 0;
	}
};

prototype.use = function(params) {
	var initial = !this.params;
	this.params = params;

	var theirs = params.original;
	if (initial) {
		var ours = this.restore(theirs);
		if (ours !== undefined && !this.compare(ours, theirs)) {
			this.current = ours;
			this.changed = true;
		} else {
			this.current = theirs;
		}
	} else if (this.saving) {
		if (this.saved === NO_RETVAL || this.compare(this.saved, theirs)) {
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
					this.cancelAutoCommit();
				}
			} else {
				this.current = theirs;
			}
		}		
	}
	this.original = theirs;
};

prototype.compare = function(ours, theirs) {
	var compareFunc = this.params.compare || compareDef;
	var match = compareFunc(ours, theirs);
	return match;
};

prototype.merge = function(base, ours, theirs) {
	var mergeFunc = this.params.merge || mergeDef;
	var merged = mergeFunc(base, ours, theirs);
	return merged;
};

prototype.save = function(base, ours) {
	var saveFunc = this.params.save || saveDef;
	var promise = Promise.resolve(saveFunc(base, ours));
	var _this = this;
	_this.saving = true;
	_this.promise = promise;
	_this.rerender();
	return promise.then(function(result) {
		if (result === undefined) {
			result = NO_RETVAL;
		}
		if (_this.promise === promise) {
			_this.saved = result;
			_this.promise = null;
		}
		return result;
	});
};

var NO_RETVAL = {};

prototype.preserve = function(base, ours) {
	var preserveFunc = this.params.preserve || preserveDef;
	preserveFunc(base, ours);
};

prototype.restore = function(theirs) {
	var restoreFunc = this.params.restore || restoreDef;
	return restoreDef(theirs);
};

prototype.rerender = function() {
	this.setContext({ buffer: this });
};

function get(state, params) {
	if (!state) {
		throw new Error('Unable to obtain state variable');
	}
	var context = state[0];
	var buffer = context.buffer;
	if (!buffer) {
		buffer = context.buffer = new AsyncSaveBuffer;
	}
	buffer.context = context;
	buffer.setContext = state[1];
	buffer.use(params || {});
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

function preserveDef(base, ours) {
}

function restoreDef(theirs) {	
}

prototype.constructor.get = get;

function useSaveBuffer(params) {
	var state = useState({});
	return AsyncSaveBuffer.get(state, params);
}

export {
	AsyncSaveBuffer,
	
	useSaveBuffer,
};
