import { get, set, plant } from './options';
import { use, memo } from './hooks';

export default {
	get: get,
	set: set,
	plant: plant,

	use: use,
	memo: memo,
};

export * from './options';
export * from './class';
export * from './hooks';
export * from './async-rendering-cycle';
export * from './async-save-buffer';
export * from './sticky-selection';
