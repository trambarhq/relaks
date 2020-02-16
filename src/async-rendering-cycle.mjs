import { AsyncRenderingInterrupted } from './async-rendering-interrupted.mjs';

let delayWhenEmpty = 50;
let delayWhenRendered = Infinity;
let currentState = null;
let currentSeeds = [];
let errorHandler = (err) => { console.error(err) };

class AsyncRenderingCycle {
  constructor(target, prev, options) {
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
    this.delayEmpty = delayWhenEmpty;
    this.delayRendered = delayWhenRendered;
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
      this.mounted = prev.mounted;
    }
  }

  hasEnded() {
    return this.completed || this.canceled;
  };

  isUpdating() {
    if (this.hasEnded()) {
      return false;
    }
    return this.promisedAvailable || this.progressAvailable || this.deferredError;
  }

  run(f) {
    if (this.deferredError) {
      // don't bother running the function when we're going to throw anyway
      return;
    }
    this.synchronous = true;
    try {
      const promise = f();
      if (promise && typeof(promise.then) === 'function') {
        promise.then(this.resolve, this.reject);
      } else {
        this.resolve(promise);
      }
    } catch (err) {
        this.reject(err);
    }
    this.synchronous = false;
  }

  resolve(element) {
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
            this.progressAvailable = true;
            this.progressForced = false;
            this.rerender();
          }
          this.lastPromise.then(() => {
            this.complete();
          });
        } else {
          this.complete();
        }
      } else {
        this.finalize(element);
      }
    }
  }

  reject(err) {
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
  }

  mount() {
    this.mounted = true;
    if (this.initial) {
      if (this.isUpdating()) {
        this.rerender();
      }
    }
  }

  fulfill() {
    if (this.progressPromise && !this.progressPromise.fulfilled) {
      if (!this.progressElement) {
        this.progressPromise.resolve(true);
      }
    }
  }

  getElement() {
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
  }

  getError() {
    if (this.deferredError) {
      const error = this.deferredError;
      this.deferredError = undefined;
      this.mounted = false;
      this.cancel();
      return error;
    }
  }

  getPrevProps(asyncCycle) {
    return asyncCycle ? this.prevPropsAsync : this.prevProps;
  }

  substitute(element) {
    this.promisedElement = element;
    this.promisedAvailable = true;

    // schedule immediate rerendering so refs, callbacks are correct
    setTimeout(() => {
      this.setContext({ cycle: this });
    }, 0);
  }

  on(name, f) {
    this.handlers[name] = f;
  }

  show(element, disposition) {
    // make sure the rendering cycle is still current
    this.check();

    // save the element so it can be rendered eventually
    this.progressElement = element;

    if (this.progressPromise && !this.progressPromise.fulfilled) {
      this.progressPromise.resolve(false);
    }
    let resolve;
    const promise = new Promise((r) => { resolve = r });
    promise.fulfilled = false;
    promise.resolve = (value) => {
      promise.fulfilled = true;
      resolve(value);
    };
    this.progressPromise = this.lastPromise = promise;

    if (!this.options.showProgress) {
        return false;
    }

    let delay, forced = false;
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
          this.updateTimeout = setTimeout(() => {
            // if the timeout is 0, then clearTimeout() was called on it
            // this function might still run on occasion afterward, due to
            // the way timeouts are scheduled
            if (this.updateTimeout !== 0) {
              this.update();
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
  }

  /**
   * Rendering the progress element now
   *
   * @param  {Boolean|undefined} forced
   */
  update(forced) {
    this.progressAvailable = true;
    this.progressForced = forced;

    // force rerendering only if the component is mounted or during the
    // initial rendering cycle (React seems to be able to handle that)
    if (this.initial || this.mounted) {
      this.rerender();
    }
  }

  /**
   * Finalize the rendering cycle, called when the final contents have been
   * rendered
   *
   * @param  {ReactElement|VNode} element
   */
  finalize(element) {
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
  }

  /**
   * Check if the rendering cycle has been superceded by a new one. If so
   * throw an exception to end it. Ensure component is mounted as well.
   */
  check() {
    if (!this.options.showProgress) {
      return;
    }
    if (this.synchronous) {
      this.checked = true;
      if (this.isUpdating()) {
        throw new AsyncRenderingInterrupted;
      }
    }
    if (this.canceled) {
      throw new AsyncRenderingInterrupted;
    }
  }

  /**
   * Set progressive rendering delay, for when the component is empty and when
   * it has been fully rendered previously
   *
   * @param  {Number} empty
   * @param  {Number} rendered
   */
  delay(empty, rendered) {
    if (typeof(empty) === 'number') {
        this.delayEmpty = empty;
    }
    if (typeof(rendered) === 'number') {
        this.delayRendered = rendered;
    }
  }

  /**
   * Wait for pending show() or transition() to complete
   *
   * @return {Promise}
   */
  hasRendered() {
    const promise = this.lastPromise;
    if (!promise) {
        throw new Error('No pending operation');
    }
    return promise;
  }

  /**
   * Alter the progress element immediately after it's been rendered
   *
   * @param  {Object} props
   */
  transition(props) {
    const promise = this.hasRendered().then((shown) => {
      if (shown) {
        const clone = this.options.clone;
        const element = clone(this.elementRendered, props);
        this.show(element);
        return this.progressPromise.then((shown) => {
          promise.fulfilled = true;
          return shown;
        });
      } else {
        return false;
      }
    });
    promise.fulfilled = false;
    this.transitionPromise = this.lastPromise = promise;
  }

  /**
   * Cancel the rendering of progress and trigger cancel handler
   */
  cancel() {
    this.clear();
    if (!this.canceled) {
      this.canceled = true;
      this.notify('cancel');
    }
  }

  /**
   * Mark the cycle as completed and trigger complete handler
   */
  complete() {
    this.clear();
    if (!this.completed) {
      this.completed = true;
      this.notify('complete');
    }
  }

  /**
   * Indicate that progress is being shown and trigger progress handler
   */
  progress() {
    if (!this.showingProgress) {
      if (!this.progressForced) {
        this.showingProgress = true;
      }
    }
    this.notify('progress');
  }

  /**
   * Cancel the any scheduled rendering of progress
   */
  clear() {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = 0;
    }
  }

  /**
   * Force rendering by recreating the context object
   */
  rerender() {
    if (this.synchronous) {
      // no need to force renderering since we're still inside
      // the synchronous function call and we can simply return
      // the progress element
      return;
    }

    if (!this.hasEnded()) {
      if (this.context.cycle === this && this.mounted) {
        this.setContext({ cycle: this });
      }
    }
  }

  /**
   * Trigger diagnostic callback
   *
   * @param  {String} name
   */
  notify(name) {
    const f = this.handlers[name];
    if (f) {
      const elapsed = (new Date) - this.startTime;
      const evt = {
        type: name,
        elapsed: elapsed,
        target: this.target,
      };
      f(evt);
    }
  };

  /**
   * Get the current rendering cycle, creating a new one if necessary.
   * Made the provided state the current state.
   *
   * @param  {Array} state
   * @param  {Object} target
   * @param  {Objext|undefined} options
   *
   * @return {AsyncRenderingCycle}
   */
  static acquire(state, target, options) {
    let cycle = this.get(false, state);
    if (cycle) {
      if (cycle.hasEnded()) {
        cycle = undefined;
      } else if (!cycle.isUpdating()) {
        // cancel the current cycle
        cycle.cancel();
        cycle = undefined;
      }
    }
    if (!cycle) {
      // start a new cycle
      const context = state[0];
      const prev = context.cycle;
      cycle = new AsyncRenderingCycle(target, prev, options);
      cycle.context = context;
      cycle.setContext = state[1];
      context.cycle = cycle;

      // see if the contents has been seeded
      if (cycle.initial) {
        const seed = findSeed(target);
        if (seed) {
          cycle.substitute(seed);
        }
      }
    }
    currentState = state;
    return cycle;
  }

  /**
   * Get the current cycle, stored in the current state or the one provided
   *
   * @param  {Boolean} required
   * @param  {Array|undefined} state
   *
   * @return {AsyncRenderingCycle}
   */
  static get(required, state) {
    if (!state) {
      state = currentState;
    }
    if (state) {
      const context = state[0];
      const cycle = context.cycle;
      if (cycle) {
        cycle.context = context;
        cycle.setContext = state[1];
        return cycle;
      }
    }
    if (required) {
      throw new Error('Unable to obtain state variable');
    }
    return null;
  }

  /**
   * Called when we're done working with the current component
   */
  static end() {
    currentState = null;
  }

  /**
   * Indicate whether a component is being updated
   * (i.e. rendered content is being delivered to React)
   *
   * @return {Boolean}
   */
  static isUpdating() {
    const cycle = this.get(false);
    return cycle ? cycle.isUpdating() : false;
  }

  /**
   * Set delay before progressive contents appears when the component is
   * completely empty
   *
   * @param {Number} ms
   */
  static setInitialDelay(ms) {
    delayWhenEmpty = ms;
  }

  /**
   * Get delay before progressive contents appears when the component is
   * completely empty
   *
   * @return {Number}
   */
  static getInitialDelay() {
    return delayWhenEmpty;
  }

  /**
   * Set delay before progressive contents appears after some contents have
   * rendered
   *
   * @param {Number} ms
   */
  static setSubsequentDelay(ms) {
    delayWhenRendered = ms;
  }

  /**
   * Get delay before progressive contents appears after some contents have
   * rendered
   *
   * @return {Number}
   */
  static getSubsequentDelay() {
    return delayWhenRendered;
  }

  static getErrorHandler() {
    return errorHandler;
  }

  static setErrorHandler(f) {
    errorHandler = f;
  }

  static callErrorHandler(err) {
    if (errorHandler instanceof Function) {
      errorHandler(err);
    }
  }

  static plantSeeds(list) {
    if (!(list instanceof Array)) {
      throw new Error('Seeds must be an array of object. Are you calling harvest() with the options { seeds: true }?');
    }
    currentSeeds = list;
  }
}

function findSeed(target) {
  const type = target.func || target.constructor;
  const props = target.props;
  let index = -1;
  let best = -1;
  for (let i = 0; i < currentSeeds.length; i++) {
    const seed = currentSeeds[i];
    if (seed.type === type) {
      // the props aren't going to match up exactly due to object
      // recreations; just find the one that is closest
      let count = 0;
      if (props && seed.props) {
        for (var key in props) {
          if (seed.props[key] === props[key]) {
            count++;
          }
        }
      }
      if (count > best) {
        // choose this one
        index = i;
        best = count;
      }
    }
  }
  if (index != -1) {
    const match = currentSeeds[index];
    currentSeeds.splice(index, 1);
    return match.result;
  }
}

export {
  AsyncRenderingCycle,
};
