(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('preact')) :
  typeof define === 'function' && define.amd ? define(['exports', 'preact'], factory) :
  (global = global || self, factory(global.Relaks = {}, global.Preact));
}(this, (function (exports, Preact) { 'use strict';

  Preact = Preact && Preact.hasOwnProperty('default') ? Preact['default'] : Preact;

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
          this.mounted = false;
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
          if (this.context.cycle === this && this.mounted) {
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
    }], [{
      key: "acquire",
      value: function acquire(state, target, options) {
        var cycle = this.get(false, state);

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
    }, {
      key: "get",
      value: function get(required, state) {
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
    }, {
      key: "end",
      value: function end() {
        currentState = null;
      }
    }, {
      key: "isUpdating",
      value: function isUpdating() {
        var cycle = this.get(false);
        return cycle ? cycle.isUpdating() : false;
      }
    }]);

    return AsyncRenderingCycle;
  }();

  var currentState = null;

  var Component = Preact.Component;

  var AsyncComponent =
  /*#__PURE__*/
  function (_Component) {
    _inherits(AsyncComponent, _Component);

    function AsyncComponent(props) {
      var _this;

      _classCallCheck(this, AsyncComponent);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(AsyncComponent).call(this, props));
      var state = [{}, function (context) {
        state[0] = context;

        _this.forceUpdate();
      }];
      _this.relaks = state;
      return _this;
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


    _createClass(AsyncComponent, [{
      key: "render",
      value: function render(props, state, context) {
        var _this2 = this;

        var options = {
          showProgress: true,
          clone: clone
        };
        var cycle = AsyncRenderingCycle.acquire(this.relaks, this, options);
        cycle.noCheck = true;

        if (!cycle.isUpdating()) {
          // call async function
          cycle.run(function () {
            return _this2.renderAsync(cycle, props, state, context);
          });
        }

        AsyncRenderingCycle.end();
        cycle.mounted = true; // throw error that had occurred in async code

        var error = cycle.getError();

        if (error) {
          var errorHandler = get('errorHandler');

          if (errorHandler instanceof Function) {
            errorHandler(error);
          }
        } // return either the promised element or progress


        var element = cycle.getElement();
        return element;
      }
    }, {
      key: "renderAsyncEx",
      value: function renderAsyncEx() {
        var options = {
          clone: clone
        };
        var cycle = AsyncRenderingCycle.acquire(this.relaks, this, options);
        var promise = this.renderAsync(cycle, this.props, this.state, this.context);
        AsyncRenderingCycle.end();

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
       * Return false if the component's props and state haven't changed.
       *
       * @param  {Object} nextProps
       * @param  {Object} nextState
       *
       * @return {Boolean}
       */

    }, {
      key: "shouldComponentUpdate",
      value: function shouldComponentUpdate(nextProps, nextState) {
        if (!compare(this.props, nextProps) || !compare(this.state, nextState)) {
          return true;
        }

        return false;
      }
      /**
       * Cancel any outstanding asynchronous rendering cycle on unmount.
       */

    }, {
      key: "componentWillUnmount",
      value: function componentWillUnmount() {
        var cycle = AsyncRenderingCycle.get(false, this.relaks);

        if (!cycle.hasEnded()) {
          cycle.cancel();
        }
      }
    }]);

    return AsyncComponent;
  }(Component);
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

    for (var key in nextSet) {
      var prev = prevSet[key];
      var next = nextSet[key];

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

  var preact = {
    get: get,
    set: set,
    plant: plant
  };

  exports.AsyncComponent = AsyncComponent;
  exports.AsyncRenderingCycle = AsyncRenderingCycle;
  exports.default = preact;
  exports.findSeed = findSeed;
  exports.get = get;
  exports.plant = plant;
  exports.set = set;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
