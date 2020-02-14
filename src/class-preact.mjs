import Preact from 'preact';
import { AsyncRenderingCycle } from './async-rendering-cycle.mjs';
import { get } from './options.mjs';

const { Component } = Preact;

class AsyncComponent extends Component {
  constructor(props) {
    super(props);

    var state = [
      {},
      (context) => {
        state[0] = context;
        this.forceUpdate();
      }
    ];
    this.relaks = state;
  }

  /**
   * Render component, calling renderAsync() if necessary
   *
   * @param  {Object} props
   * @param  {Object} state
   * @param  {Object} context
   *
   * @return {VNode|null}
   */
  render(props, state, context) {
    const options = { showProgress: true, clone };
    const cycle = AsyncRenderingCycle.acquire(this.relaks, this, options);
    cycle.noCheck = true;
    if (!cycle.isUpdating()) {
      // call async function
      cycle.run(() => {
        return this.renderAsync(cycle, props, state, context);
      });
    }
    AsyncRenderingCycle.end();
    cycle.mounted = true;

    // throw error that had occurred in async code
    const error = cycle.getError();
    if (error) {
      const errorHandler = get('errorHandler');
      if (errorHandler instanceof Function) {
          errorHandler(error);
      }
    }

    // return either the promised element or progress
    const element = cycle.getElement();
    return element;
  }

  renderAsyncEx() {
    const options = { clone };
    const cycle = AsyncRenderingCycle.acquire(this.relaks, this, options);
    const promise = this.renderAsync(cycle, this.props, this.state, this.context);
    AsyncRenderingCycle.end();
    if (promise && typeof(promise.then) === 'function') {
      return promise.then((element) => {
        if (element === undefined) {
          element = cycle.progressElement;
        }
        return element;
      });
    } else {
      return promise;
    }
  }

  /**
   * Return false if the component's props and state haven't changed.
   *
   * @param  {Object} nextProps
   * @param  {Object} nextState
   *
   * @return {Boolean}
   */
  shouldComponentUpdate(nextProps, nextState) {
    if (!compare(this.props, nextProps) || !compare(this.state, nextState)) {
      return true;
    }
    return false;
  }

  /**
   * Cancel any outstanding asynchronous rendering cycle on unmount.
   */
  componentWillUnmount() {
    const cycle = AsyncRenderingCycle.get(false, this.relaks);
    if (!cycle.hasEnded()) {
      cycle.cancel();
    }
  }
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
  for (let key in nextSet) {
    let prev = prevSet[key];
    let next = nextSet[key];
    if (next !== prev) {
      return false;
    }
  }
  return true;
}

function clone(element, props) {
  if (Preact.isValidElement(props)) {
    return props;
  } else if (Peact.isValidElement(element)) {
    return Preact.cloneElement(element, props);
  } else {
    return null;
  }
}

export {
  AsyncComponent,
};
