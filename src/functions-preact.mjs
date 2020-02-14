import { AsyncRenderingCycle } from './async-rendering-cycle.mjs';

function get(name) {
  switch (name) {
    case 'errorHandler':
      return AsyncRenderingCycle.getErrorHandler();
    case 'delayWhenEmpty':
      return AsyncRenderingCycle.getInitialDelay();
    case 'delayWhenRendered':
      return AsyncRenderingCycle.getSubsequentDelay();
  }
}

function set(name, value) {
  switch (name) {
    case 'errorHandler':
      return AsyncRenderingCycle.setErrorHandler(value);
    case 'delayWhenEmpty':
      return AsyncRenderingCycle.setInitialDelay(value);
    case 'delayWhenRendered':
      return AsyncRenderingCycle.setSubsequentDelay(value);
  }
}

function plant(list) {
  AsyncRenderingCycle.plantSeeds(list);
}

export {
  get,
  set,
  plant,
};
