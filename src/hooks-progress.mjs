import { AsyncRenderingCycle } from './async-rendering-cycle.mjs';

function useProgress(delayEmpty, delayRendered) {
  // set delays
  const cycle = AsyncRenderingCycle.get(true);
  cycle.delay(delayEmpty, delayRendered, true);

  // return functions (bound in constructor)
  return [ cycle.show, cycle.check, cycle.delay ];
}

function useProgressTransition() {
  const cycle = AsyncRenderingCycle.get(true);
  return [ cycle.transition, cycle.hasRendered ];
}

function useRenderEvent(name, f) {
  if (!AsyncRenderingCycle.isUpdating()) {
    const cycle = AsyncRenderingCycle.get(true);
    cycle.on(name, f);
  }
}

export {
  useProgress,
  useProgressTransition,
  useRenderEvent,
};
