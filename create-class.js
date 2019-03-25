var React = require('react');
var Relaks = require('./index');

function createClass(specs) {
    if (specs.render) {
        throw new Error('Class definition should not contain render()');
    }
    if (!specs.renderAsync) {
        throw new Error('Class definition should contain renderAsync()');
    }

    var own = Relaks.Component.prototype;
    specs = clone(specs);
    specs.render = own.render;
    specs.renderAsyncEx = own.renderAsyncEx;
    specs.componentWillMount = chain(specs.componentWillMount, own.createRelaksContext);
    specs.componentWillUnmount = chain(specs.componentWillUnmount, own.componentWillUnmount);
    specs.shouldComponentUpdate = specs.shouldComponentUpdate || own.shouldComponentUpdate;
    return React.createClass(specs);
};

/**
 * Clone an object shallowly
 *
 * @param  {Object} object
 *
 * @return {Object}
 */
function clone(object) {
    var newObject = {};
    for (var name in object) {
        newObject[name] = object[name];
    }
    return newObject;
}

/**
 * Chain two zero-argument functions
 *
 * @param  {Function} f
 * @param  {Function} g
 *
 * @return {Function}
 */
function chain(f, g) {
    if (!f) {
        return g;
    }
    return function() {
        f.call(this);
        g.call(this);
    };
}

module.exports = createClass;
