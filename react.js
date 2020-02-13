(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react'], factory) :
  (global = global || self, factory(global.Relaks = {}, global.React));
}(this, (function (exports, React) { 'use strict';

  React = React && React.hasOwnProperty('default') ? React['default'] : React;

  var delayWhenEmpty = 50;
  var delayWhenRendered = Infinity;
  var seeds = [];

  var errorHandler = function errorHandler(err) {
    console.error(err);
  };

  function get(name) {
    switch (name) {
      case 'errorHandler':
        return errorHandler;

      case 'delayWhenEmpty':
        return delayWhenEmpty;

      case 'delayWhenRendered':
        return delayWhenRendered;

      case 'seeds':
        plant(value);
        break;
    }
  }

  function set(name, value) {
    switch (name) {
      case 'errorHandler':
        errorHandler = value;
        break;

      case 'delayWhenEmpty':
        delayWhenEmpty = value;
        break;

      case 'delayWhenRendered':
        delayWhenRendered = value;
        break;

      case 'seeds':
        plant(value);
        break;
    }
  }

  function plant(list) {
    if (!(list instanceof Array)) {
      throw new Error('Seeds must be an array of object. Are you calling harvest() with the options { seeds: true }?');
    }

    seeds = list;
  }

  function findSeed(target) {
    var type = target.func || target.constructor;
    var props = target.props;
    var index = -1;
    var best = -1;

    for (var i = 0; i < seeds.length; i++) {
      var seed = seeds[i];

      if (seed.type === type) {
        // the props aren't going to match up exactly due to object
        // recreations; just find the one that is closest
        var count = 0;

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
      var match = seeds[index];
      seeds.splice(index, 1);
      return match.result;
    }
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;

    try {
      Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  function _construct(Parent, args, Class) {
    if (isNativeReflectConstruct()) {
      _construct = Reflect.construct;
    } else {
      _construct = function _construct(Parent, args, Class) {
        var a = [null];
        a.push.apply(a, args);
        var Constructor = Function.bind.apply(Parent, a);
        var instance = new Constructor();
        if (Class) _setPrototypeOf(instance, Class.prototype);
        return instance;
      };
    }

    return _construct.apply(null, arguments);
  }

  function _isNativeFunction(fn) {
    return Function.toString.call(fn).indexOf("[native code]") !== -1;
  }

  function _wrapNativeSuper(Class) {
    var _cache = typeof Map === "function" ? new Map() : undefined;

    _wrapNativeSuper = function _wrapNativeSuper(Class) {
      if (Class === null || !_isNativeFunction(Class)) return Class;

      if (typeof Class !== "function") {
        throw new TypeError("Super expression must either be null or a function");
      }

      if (typeof _cache !== "undefined") {
        if (_cache.has(Class)) return _cache.get(Class);

        _cache.set(Class, Wrapper);
      }

      function Wrapper() {
        return _construct(Class, arguments, _getPrototypeOf(this).constructor);
      }

      Wrapper.prototype = Object.create(Class.prototype, {
        constructor: {
          value: Wrapper,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
      return _setPrototypeOf(Wrapper, Class);
    };

    return _wrapNativeSuper(Class);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function _iterableToArrayLimit(arr, i) {
    if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
      return;
    }

    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance");
  }

  var AsyncRenderingInterrupted =
  /*#__PURE__*/
  function (_Error) {
    _inherits(AsyncRenderingInterrupted, _Error);

    function AsyncRenderingInterrupted() {
      var _this;

      _classCallCheck(this, AsyncRenderingInterrupted);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(AsyncRenderingInterrupted).call(this));
      _this.message = 'Async rendering interrupted';
      return _this;
    }

    return AsyncRenderingInterrupted;
  }(_wrapNativeSuper(Error));

  var AsyncRenderingCycle =
  /*#__PURE__*/
  function () {
    function AsyncRenderingCycle(target, prev, options) {
      _classCallCheck(this, AsyncRenderingCycle);

      this.options = options;
      this.progressElement = undefined;
      this.progressAvailable = false;
      this.progressForced = false;
      this.progressPromise = undefined;
      this.transitionPromise = undefined;
      this.lastPromise = undefined;
      this.promisedElement = undefined;
      this.promisedAvailable = false;
      this.elementRendered = prev ? prev.elementRendered : null;
      this.deferredError = undefined;
      this.showingProgress = false;
      this.delayEmpty = get('delayWhenEmpty');
      this.delayRendered = get('delayWhenRendered');
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
      this.startTime = new Date();
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

    _createClass(AsyncRenderingCycle, [{
      key: "hasEnded",
      value: function hasEnded() {
        return this.completed || this.canceled;
      }
    }, {
      key: "isUpdating",
      value: function isUpdating() {
        if (this.hasEnded()) {
          return false;
        }

        return this.promisedAvailable || this.progressAvailable || this.deferredError;
      }
    }, {
      key: "run",
      value: function run(f) {
        if (this.deferredError) {
          // don't bother running the function when we're going to throw anyway
          return;
        }

        this.synchronous = true;

        try {
          var promise = f();

          if (promise && typeof promise.then === 'function') {
            promise.then(this.resolve, this.reject);
          } else {
            this.resolve(promise);
          }
        } catch (err) {
          this.reject(err);
        }

        this.synchronous = false;
      }
    }, {
      key: "resolve",
      value: function resolve(element) {
        var _this2 = this;

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

              this.lastPromise.then(function () {
                _this2.complete();
              });
            } else {
              this.complete();
            }
          } else {
            this.finalize(element);
          }
        }
      }
    }, {
      key: "reject",
      value: function reject(err) {
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
    }, {
      key: "mount",
      value: function mount() {
        this.mounted = true;

        if (this.initial) {
          if (this.isUpdating()) {
            this.rerender();
          }
        }
      }
    }, {
      key: "fulfill",
      value: function fulfill() {
        if (this.progressPromise && !this.progressPromise.fulfilled) {
          if (!this.progressElement) {
            this.progressPromise.resolve(true);
          }
        }
      }
    }, {
      key: "getElement",
      value: function getElement() {
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
    }, {
      key: "getError",
      value: function getError() {
        if (this.deferredError) {
          var error = this.deferredError;
          this.deferredError = undefined;
          this.cancel();
          return error;
        }
      }
    }, {
      key: "getPrevProps",
      value: function getPrevProps(asyncCycle) {
        return asyncCycle ? this.prevPropsAsync : this.prevProps;
      }
    }, {
      key: "substitute",
      value: function substitute(element) {
        var _this3 = this;

        this.promisedElement = element;
        this.promisedAvailable = true; // schedule immediate rerendering so refs, callbacks are correct

        setTimeout(function () {
          _this3.setContext({
            cycle: _this
          });
        }, 0);
      }
    }, {
      key: "on",
      value: function on(name, f) {
        this.handlers[name] = f;
      }
    }, {
      key: "show",
      value: function show(element, disposition) {
        var _this4 = this;

        // make sure the rendering cycle is still current
        this.check(); // save the element so it can be rendered eventually

        this.progressElement = element;

        if (this.progressPromise && !this.progressPromise.fulfilled) {
          this.progressPromise.resolve(false);
        }

        var resolve;
        var promise = new Promise(function (r) {
          resolve = r;
        });
        promise.fulfilled = false;

        promise.resolve = function (value) {
          promise.fulfilled = true;
          resolve(value);
        };

        this.progressPromise = this.lastPromise = promise;

        if (!this.options.showProgress) {
          return false;
        }

        var delay,
            forced = false;

        if (this.showingProgress) {
          delay = 0;
        } else if (!this.fulfilled) {
          delay = this.delayEmpty;
        } else {
          delay = this.delayRendered;
        }

        if (disposition === 'always' || disposition === 'initial' && !this.elementRendered) {
          delay = 0;
          forced = true;
        }

        if (delay > 0) {
          if (delay !== Infinity) {
            // show progress after a brief delay, to allow
            // it to be bypassed by fast-resolving promises
            if (!this.updateTimeout) {
              this.updateTimeout = setTimeout(function () {
                // if the timeout is 0, then clearTimeout() was called on it
                // this function might still run on occasion afterward, due to
                // the way timeouts are scheduled
                if (_this4.updateTimeout !== 0) {
                  _this4.update();
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

    }, {
      key: "update",
      value: function update(forced) {
        this.progressAvailable = true;
        this.progressForced = forced; // force rerendering only if the component is mounted or during the
        // initial rendering cycle (React seems to be able to handle that)

        if (this.initial || this.mounted) {
          this.rerender();
        }
      }
    }, {
      key: "finalize",
      value: function finalize(element) {
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

    }, {
      key: "check",
      value: function check() {
        if (!this.options.showProgress) {
          return;
        }

        if (this.synchronous) {
          this.checked = true;

          if (this.isUpdating()) {
            throw new AsyncRenderingInterrupted();
          }
        }

        if (this.canceled) {
          throw new AsyncRenderingInterrupted();
        }
      }
      /**
       * Set progressive rendering delay, for when the component is empty and when
       * it has been fully rendered previously
       *
       * @param  {Number} empty
       * @param  {Number} rendered
       */

    }, {
      key: "delay",
      value: function delay(empty, rendered) {
        if (typeof empty === 'number') {
          this.delayEmpty = empty;
        }

        if (typeof rendered === 'number') {
          this.delayRendered = rendered;
        }
      }
      /**
       * Wait for pending show() or transition() to complete
       *
       * @return {Promise}
       */

    }, {
      key: "hasRendered",
      value: function hasRendered() {
        var promise = this.lastPromise;

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

    }, {
      key: "transition",
      value: function transition(props) {
        var _this5 = this;

        var promise = this.hasRendered().then(function (shown) {
          if (shown) {
            var clone = _this5.options.clone;
            var element = clone(_this5.elementRendered, props);

            _this5.show(element);

            return _this5.progressPromise.then(function (shown) {
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

    }, {
      key: "cancel",
      value: function cancel() {
        this.clear();

        if (!this.canceled) {
          this.canceled = true;
          this.notify('cancel');
        }
      }
      /**
       * Mark the cycle as completed and trigger complete handler
       */

    }, {
      key: "complete",
      value: function complete() {
        this.clear();

        if (!this.completed) {
          this.completed = true;
          this.notify('complete');
        }
      }
      /**
       * Indicate that progress is being shown and trigger progress handler
       */

    }, {
      key: "progress",
      value: function progress() {
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

    }, {
      key: "clear",
      value: function clear() {
        if (this.updateTimeout) {
          clearTimeout(this.updateTimeout);
          this.updateTimeout = 0;
        }
      }
      /**
       * Force rendering by recreating the context object
       */

    }, {
      key: "rerender",
      value: function rerender() {
        if (this.synchronous) {
          // no need to force renderering since we're still inside
          // the synchronous function call and we can simply return
          // the progress element
          return;
        }

        if (!this.hasEnded()) {
          if (this.context.cycle === this) {
            this.setContext({
              cycle: this
            });
          }
        }
      }
    }, {
      key: "notify",
      value: function notify(name) {
        var f = this.handlers[name];

        if (f) {
          var elapsed = new Date() - this.startTime;
          var evt = {
            type: name,
            elapsed: elapsed,
            target: this.target
          };
          f(evt);
        }
      }
    }]);

    return AsyncRenderingCycle;
  }();

  var currentState = null;

  function acquireCycle(state, target, options) {
    var cycle = getCurrentCycle$1(false, state);

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
      var context = state[0];
      var prev = context.cycle;
      cycle = new AsyncRenderingCycle(target, prev, options);
      cycle.context = context;
      cycle.setContext = state[1];
      context.cycle = cycle; // see if the contents has been seeded

      if (cycle.initial) {
        var seed = findSeed(target);

        if (seed) {
          cycle.substitute(seed);
        }
      }
    }

    currentState = state;
    return cycle;
  }

  function getCurrentCycle$1(required, state) {
    if (!state) {
      state = currentState;
    }

    if (state) {
      var context = state[0];
      var cycle = context.cycle;

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

  function endCurrentCycle() {
    currentState = null;
  }

  function isUpdating() {
    var cycle = getCurrentCycle$1(false);
    return cycle ? cycle.isUpdating() : false;
  }

  var useState = React.useState,
      useRef = React.useRef,
      useMemo = React.useMemo,
      useEffect = React.useEffect,
      useCallback = React.useCallback,
      useDebugValue = React.useDebugValue,
      ReactElement = React.ReactElement;

  function use(asyncFunc) {
    // create synchronous function wrapper
    var syncFunc = function syncFunc(props, ref) {
      var state = useState({});
      var target = {
        func: syncFunc,
        props: props
      };
      var options = {
        showProgress: true,
        performCheck: true,
        clone: clone
      };
      var cycle = acquireCycle(state, target, options); // cancel current cycle on unmount

      useEffect(function () {
        cycle.mount();
        return function () {
          if (!cycle.hasEnded()) {
            cycle.cancel();
          }
        };
      }, [cycle]); // fulfill promise at the end of rendering cycle

      useEffect(function () {
        cycle.fulfill();
      }); // call async function

      cycle.run(function () {
        return asyncFunc(props, ref);
      });
      endCurrentCycle(); // throw error that had occurred in async code

      var error = cycle.getError();

      if (error) {
        throw error;
      } // return either the promised element or progress


      var element = cycle.getElement();
      return element;
    }; // attach async function (that returns a promise to the final result)


    syncFunc.renderAsyncEx = function (props) {
      var state = [{}, function (v) {}];
      var target = {
        func: syncFunc,
        props: props
      };
      var options = {
        performCheck: true,
        clone: clone
      };
      var cycle = acquireCycle(state, target, options);
      var promise = asyncFunc(props);
      endCurrentCycle();

      if (promise && typeof promise.then === 'function') {
        return promise.then(function (element) {
          if (element === undefined) {
            element = cycle.progressElement;
          }

          return element;
        });
      } else {
        return promise;
      }
    }; // add prop types if available


    if (asyncFunc.propTypes) {
      syncFunc.propTypes = asyncFunc.propTypes;
    } // add default props if available


    if (asyncFunc.defaultProps) {
      syncFunc.defaultProps = asyncFunc.defaultProps;
    } // set display name


    syncFunc.displayName = asyncFunc.displayName || asyncFunc.name;
    return syncFunc;
  }

  function memo(asyncFunc, areEqual) {
    var syncFunc = use(asyncFunc);
    return React.memo(syncFunc, areEqual);
  }

  function forwardRef(asyncFunc, areEqual) {
    var syncFunc = use(asyncFunc);
    return React.memo(React.forwardRef(syncFunc), areEqual);
  }

  function clone(element, props) {
    if (React.isValidElement(props)) {
      return props;
    } else if (React.isValidElement(element)) {
      return React.cloneElement(element, props);
    } else {
      return null;
    }
  }

  function useProgress(delayEmpty, delayRendered) {
    // set delays
    var cycle = getCurrentCycle$1(true);
    cycle.delay(delayEmpty, delayRendered, true); // return functions (bound in constructor)

    return [cycle.show, cycle.check, cycle.delay];
  }

  function useProgressTransition() {
    var cycle = getCurrentCycle$1(true);
    return [cycle.transition, cycle.hasRendered];
  }

  function useRenderEvent(name, f) {
    if (!isUpdating()) {
      var cycle = getCurrentCycle$1(true);
      cycle.on(name, f);
    }
  }

  function useEventTime() {
    var state = useState();
    var date = state[0];
    var setDate = state[1];
    var callback = useCallback(function (evt) {
      setDate(new Date());
    }, []);
    useDebugValue(date);
    return [date, callback];
  }

  function useListener(f) {
    var _arguments = arguments;
    var ref = useRef({});

    if (!isUpdating()) {
      ref.current.f = f;
    }

    useDebugValue(f);
    return useCallback(function () {
      return ref.current.f.apply(null, _arguments);
    }, []);
  }

  function useAsyncEffect(f, deps) {
    useEffect(function () {
      var cleanUp;
      var cleanUpDeferred = false; // invoke the callback and wait for promise to get fulfilled

      var promise = f();
      Promise.resolve(promise).then(function (ret) {
        // save the clean-up function returned by the callback
        cleanUp = ret; // if clean-up was requested while we were waiting for the promise to
        // resolve, perform it now

        if (cleanUpDeferred) {
          cleanUp();
        }
      });
      return function () {
        if (cleanUp) {
          cleanUp();
        } else {
          // maybe we're still waiting for the promsie to resolve
          cleanUpDeferred = true;
        }
      };
    }, deps);
    useDebugValue(f);
  }

  function useErrorCatcher(rethrow) {
    var _useState = useState(),
        _useState2 = _slicedToArray(_useState, 2),
        error = _useState2[0],
        setError = _useState2[1];

    if (rethrow && error) {
      throw error;
    }

    var run = useCallback(function (f) {
      // catch sync exception with try-block
      try {
        // invoke the given function
        var promise = f();

        if (promise && promise["catch"] instanceof Function) {
          // catch async exception
          promise = promise.then(function (result) {
            setError(undefined);
            return result;
          })["catch"](function (err) {
            setError(err);
          });
        } else {
          setError(undefined);
        }

        return promise;
      } catch (err) {
        setError(err);
      }
    });
    var clear = useCallback(function (f) {
      setError(undefined);
    }, []);
    useDebugValue(error);
    return [error, run, clear];
  }

  function useComputed(f, deps) {
    var pair = useState({});
    var state = pair[0];
    var setState = pair[1]; // add state object as dependency of useMemo hook

    if (deps instanceof Array) {
      deps = deps.concat(state);
    } else {
      deps = [state];
    }

    var value = useMemo(function () {
      return state.current = f(state.current);
    }, deps);
    var recalc = useCallback(function () {
      // force recalculation by changing state
      setState({
        value: state.value
      });
    }, []);
    useDebugValue(value);
    return [value, recalc];
  }

  function useLastAcceptable(value, acceptable) {
    var ref = useRef();

    if (typeof acceptable === 'function') {
      acceptable = acceptable(value);
    }

    if (acceptable) {
      // set the value only if it's acceptable
      ref.current = value;
    }

    useDebugValue(ref.current);
    return ref.current;
  }

  var PureComponent = React.PureComponent;

  var AsyncComponent =
  /*#__PURE__*/
  function (_PureComponent) {
    _inherits(AsyncComponent, _PureComponent);

    function AsyncComponent(props) {
      var _this;

      _classCallCheck(this, AsyncComponent);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(AsyncComponent).call(this, props));
      var state = [{}, function (context) {
        state[0] = context;
        this.forceUpdate();
      }];
      _this.relaks = state;
      return _this;
    }
    /**
     * Render component, calling renderAsync() if necessary
     *
     * @return {ReactElement|null}
     */


    _createClass(AsyncComponent, [{
      key: "render",
      value: function render() {
        var _this2 = this;

        var options = {
          showProgress: true,
          clone: clone$1
        };
        var cycle = acquireCycle(this.relaks, this, options);

        if (!cycle.isUpdating()) {
          // call async function
          cycle.run(function () {
            return _this2.renderAsync(cycle);
          });
        }

        endCurrentCycle();
        cycle.mounted = true; // throw error that had occurred in async code

        var error = cycle.getError();

        if (error) {
          if (parseInt(React.version) >= 16) {
            throw error;
          } else {
            var errorHandler = get('errorHandler');

            if (errorHandler instanceof Function) {
              errorHandler(error);
            }
          }
        } // return either the promised element or progress


        var element = cycle.getElement();
        return element;
      }
    }, {
      key: "renderAsyncEx",
      value: function renderAsyncEx() {
        var options = {
          clone: clone$1
        };
        var cycle = acquireCycle(this.relaks, this, options);
        var promise = this.renderAsync(cycle);
        endCurrentCycle();

        if (promise && typeof promise.then === 'function') {
          return promise.then(function (element) {
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
       * Cancel any outstanding asynchronous rendering cycle on unmount.
       */

    }, {
      key: "componentWillUnmount",
      value: function componentWillUnmount() {
        var cycle = getCurrentCycle(false, this.relaks);

        if (!cycle.hasEnded()) {
          cycle.cancel();
        }
      }
    }]);

    return AsyncComponent;
  }(PureComponent);

  function clone$1(element, props) {
    if (React.isValidElement(props)) {
      return props;
    } else if (React.isValidElement(element)) {
      return React.cloneElement(element, props);
    } else {
      return null;
    }
  }

  var useState$1 = React.useState,
      useRef$1 = React.useRef,
      useCallback$1 = React.useCallback,
      useEffect$1 = React.useEffect,
      useDebugValue$1 = React.useDebugValue;

  var AsyncSaveBuffer =
  /*#__PURE__*/
  function () {
    function AsyncSaveBuffer() {
      _classCallCheck(this, AsyncSaveBuffer);

      this.ready = false;
      this.original = undefined;
      this.current = undefined;
      this.changed = false;
      this.params = undefined;
      this.setContext = undefined;
    }

    _createClass(AsyncSaveBuffer, [{
      key: "base",
      value: function base(theirs) {
        if (theirs == null) {
          return;
        }

        if (!this.ready) {
          var preserved = this.restore(theirs);
          var ours = preserved !== undefined ? preserved : this.prefill(theirs);

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
          var _ours = this.current;

          if (!this.compare(base, theirs)) {
            if (this.changed) {
              var merged = this.merge(base, _ours, theirs);

              if (!this.compare(merged, theirs)) {
                this.current = merged;
                this.preserve(theirs, _ours);
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
    }, {
      key: "update",
      value: function update(ours) {
        var base = this.check();
        ours = this.transform(ours);

        if (this.changed && this.compare(this.current, ours)) {
          return;
        }

        if (this.compare(base, ours)) {
          this.current = ours = base;
          this.changed = false;
        } else {
          this.current = ours;
          this.changed = true;
        }

        this.preserve(base, ours);
        this.rerender();
      }
    }, {
      key: "set",
      value: function set(ours) {
        return this.update(ours);
      }
    }, {
      key: "assign",
      value: function assign() {
        var newObject = Object.assign({}, this.current);

        for (var _len = arguments.length, sources = new Array(_len), _key = 0; _key < _len; _key++) {
          sources[_key] = arguments[_key];
        }

        for (var _i = 0, _sources = sources; _i < _sources.length; _i++) {
          var source = _sources[_i];
          Object.assign(newObject, source);
        }

        this.update(newObject);
      }
    }, {
      key: "reset",
      value: function reset() {
        var base = this.check();

        if (this.changed) {
          this.current = base;
          this.changed = false;
          this.preserve(base, null);
          this.rerender();
        }
      }
    }, {
      key: "compare",
      value: function compare(ours, theirs) {
        var compareFunc = this.params.compare || compareDef;
        return compareFunc(ours, theirs);
      }
    }, {
      key: "merge",
      value: function merge(base, ours, theirs) {
        var mergeFunc = this.params.merge || mergeDef;
        return mergeFunc(base, ours, theirs);
      }
    }, {
      key: "preserve",
      value: function preserve(base, ours) {
        var preserveFunc = this.params.preserve || preserveDef;
        preserveFunc(base, ours);
      }
    }, {
      key: "restore",
      value: function restore(theirs) {
        var restoreFunc = this.params.restore || restoreDef;
        return restoreFunc(theirs);
      }
    }, {
      key: "prefill",
      value: function prefill(theirs) {
        var prefillFunc = this.params.prefill || prefillDef;
        return prefillFunc(theirs);
      }
    }, {
      key: "transform",
      value: function transform(ours) {
        var transformFunc = this.params.transform || transformDef;
        return transformFunc(ours);
      }
    }, {
      key: "rerender",
      value: function rerender() {
        if (this.setContext) {
          this.setContext({
            buffer: this
          });
        }
      }
    }, {
      key: "check",
      value: function check() {
        if (!this.ready) {
          throw new Error('Original value has not been set');
        }

        return this.original;
      }
    }, {
      key: "use",
      value: function use(params) {
        this.params = params;
        this.base(params.original);

        if (params.reset && this.ready && this.changed) {
          var base = this.original;
          this.current = base;
          this.changed = false;
          this.preserve(base, null);
        }
      }
    }]);

    return AsyncSaveBuffer;
  }();

  function acquire(state, params, bufferClass) {
    if (!bufferClass) {
      bufferClass = AsyncSaveBuffer;
    }

    var context = state[0];
    var buffer = context.buffer;

    if (!buffer) {
      buffer = context.buffer = new bufferClass();
      buffer.setContext = state[1];
    }

    if (params) {
      buffer.use(params);
    }

    return buffer;
  }

  function compareDef(ours, theirs) {
    return ours === theirs;
  }

  function mergeDef(base, ours, theirs) {
    return theirs;
  }

  function preserveDef(base, ours) {}

  function restoreDef(base) {}

  function prefillDef(base) {}

  function transformDef(ours) {
    return ours;
  }

  function useSaveBuffer(params, customClass) {
    if (isUpdating()) {
      // don't initialize when called during rerendering
      params = null;
    } else if (!params) {
      params = {};
    }

    var state = useState$1({});
    var buffer = acquire(state, params, customClass);
    useEffect$1(function () {
      // let the buffer know that the component associated with it
      // has been unmounted
      return function () {
        buffer.setContext = null;
      };
    }, []);
    useDebugValue$1(buffer.current);
    return buffer;
  }

  function useAutoSave(saveBuffer, wait, f) {
    // store the callback in a ref so the useEffect hook function will
    // always call the latest version
    var ref = useRef$1({});

    if (!isUpdating()) {
      ref.current.f = f;
    }

    var save = useCallback$1(function (conditional) {
      if (conditional) {
        if (!saveBuffer.changed || ref.current.saved === saveBuffer.current) {
          return;
        }
      }

      ref.current.saved = saveBuffer.current;
      ref.current.f();
    }, []);
    useEffect$1(function () {
      if (saveBuffer.changed && typeof wait === 'number') {
        var timeout = setTimeout(function () {
          // make sure save() don't get called after timeout is cancelled
          if (timeout) {
            save(true);
          }
        }, wait);
        return function () {
          // clear the timer on new changes or unmount
          clearTimeout(timeout);
          timeout = 0;
        };
      }
    }, [saveBuffer.current]);
    useEffect$1(function () {
      // save unsaved changes on unmount
      return function () {
        save(true);
      };
    }, []);
    useDebugValue$1(wait);
    return save;
  }

  var useMemo$1 = React.useMemo,
      useDebugValue$2 = React.useDebugValue;

  function get$1(target, key) {
    var f = target.methods[key] || target.handlers[key];

    if (!f) {
      var resolve;
      var promise = new Promise(function (r) {
        resolve = r;
      });
      promise.resolve = resolve;
      target.promises[key] = promise;
      target.statuses[key] = false;
      target.handlers[key] = f = handle.bind(target, key);
    }

    return f;
  }

  function set$1(target, key, value) {
    throw new Error('Cannot modify properties of proxy object');
  }

  function handle(key, evt) {
    if (this.statuses[key] !== true) {
      var f = this.filters[key];

      if (!f || f(evt)) {
        var promise = this.promises[key];

        if (evt && typeof evt.persist === 'function') {
          evt.persist();
        }

        this.statuses[key] = true;
        promise.resolve(evt);
      }
    }
  }

  function one(key) {
    return this.promises[key];
  }

  function all() {
    var keys = [];

    for (var key in this.promises) {
      keys.push(key);
    }

    return some.call(this, keys);
  }

  function some(keys) {
    var list = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = keys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var key = _step.value;
        list.push(this.promises[key]);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return Promise.all(list).then(function (values) {
      var hash = {};

      for (var i = 0; i < keys.length; i++) {
        hash[keys[i]] = values[i];
      }

      return hash;
    });
  }

  function match(re) {
    var keys = [];

    for (var key in this.promises) {
      if (re.test(key)) {
        keys.push(key);
      }
    }

    return some.call(this, keys);
  }

  function race() {
    var list = [];

    for (var key in this.promises) {
      list.push(this.promises[key]);
    }

    return Promise.race(list);
  }

  function filter(key, f) {
    this.filters[key] = f;
  }

  function list() {
    var list = [];

    for (var key in this.promises) {
      list.push(key);
    }

    return list;
  }

  function isFulfilled(key) {
    return this.statuses[key] === true;
  }

  function isPending(key) {
    return this.statuses[key] === false;
  }

  var traps = {
    get: get$1,
    set: set$1
  };
  var methods = {
    one: one,
    all: all,
    some: some,
    match: match,
    race: race,
    filter: filter,
    list: list,
    isFulfilled: isFulfilled,
    isPending: isPending
  };

  function AsyncEventProxy() {
    var target = {
      methods: {},
      handlers: {},
      promises: {},
      statuses: {},
      filters: {}
    };

    for (var name in methods) {
      target.methods[name] = methods[name].bind(target);
    }

    this.__proto__ = new Proxy(target, traps);
  }

  function useEventProxy(deps) {
    var proxy = useMemo$1(function () {
      return new AsyncEventProxy();
    }, deps);
    useDebugValue$2(proxy, formatDebugValue);
    return proxy;
  }

  function formatDebugValue(proxy) {
    var keys = proxy.list();
    var fired = [];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = keys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var key = _step2.value;

        if (proxy.isFulfilled(key)) {
          fired.push(key);
        }
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
          _iterator2["return"]();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    return fired.join(' ');
  }

  var useEffect$2 = React.useEffect;

  function useStickySelection(inputRefs) {
    if (!(inputRefs instanceof Array)) {
      inputRefs = [inputRefs];
    }

    var inputs = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = inputRefs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var inputRef = _step.value;
        var node = inputRef.current;

        if (node) {
          inputs.push({
            node: node,
            value: node.value,
            start: node.selectionStart,
            end: node.selectionEnd
          });
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    useEffect$2(function () {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = inputs[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var input = _step2.value;
          var node = input.node;
          var previous = input.value;
          var current = node.value;

          if (previous !== current) {
            var start = findNewPosition(input.start, previous, current);
            var end = findNewPosition(input.end, previous, current);

            if (typeof start === 'number' && typeof end === 'number') {
              node.selectionStart = start;
              node.selectionEnd = end;
            }
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
            _iterator2["return"]();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }, [inputs]);
  }

  function findNewPosition(index, previous, current) {
    if (typeof index === 'number') {
      if (typeof previous === 'string' && typeof current === 'string') {
        var before = previous.substr(0, index);
        var index1 = current.indexOf(before);

        if (index1 !== -1) {
          return index1 + before.length;
        }

        var after = previous.substr(index);
        var index2 = current.lastIndexOf(after);

        if (index2 !== -1) {
          return index2;
        }
      }
    }
  }

  var react = {
    get: get,
    set: set,
    plant: plant,
    use: use,
    memo: memo,
    forwardRef: forwardRef
  };

  exports.AsyncComponent = AsyncComponent;
  exports.AsyncEventProxy = AsyncEventProxy;
  exports.AsyncRenderingCycle = AsyncRenderingCycle;
  exports.AsyncRenderingInterrupted = AsyncRenderingInterrupted;
  exports.AsyncSaveBuffer = AsyncSaveBuffer;
  exports.acquireCycle = acquireCycle;
  exports.default = react;
  exports.endCurrentCycle = endCurrentCycle;
  exports.findSeed = findSeed;
  exports.forwardRef = forwardRef;
  exports.get = get;
  exports.getCurrentCycle = getCurrentCycle$1;
  exports.isUpdating = isUpdating;
  exports.memo = memo;
  exports.plant = plant;
  exports.set = set;
  exports.use = use;
  exports.useAsyncEffect = useAsyncEffect;
  exports.useAutoSave = useAutoSave;
  exports.useComputed = useComputed;
  exports.useErrorCatcher = useErrorCatcher;
  exports.useEventProxy = useEventProxy;
  exports.useEventTime = useEventTime;
  exports.useLastAcceptable = useLastAcceptable;
  exports.useListener = useListener;
  exports.useProgress = useProgress;
  exports.useProgressTransition = useProgressTransition;
  exports.useRenderEvent = useRenderEvent;
  exports.useSaveBuffer = useSaveBuffer;
  exports.useStickySelection = useStickySelection;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
