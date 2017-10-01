var _ = require('lodash');
var Promise = require('bluebird');

module.exports = Echo;

function Echo() {
    this.clear();
}

Echo.prototype.return = function(name, data, delay) {
    var promise = this.cache[name];
    if (!promise) {
        promise = this.cache[name] = Promise.delay(delay).then(() => {
            return _.cloneDeep(data);
        });
    }
    return promise;
};

Echo.prototype.clear = function() {
    this.cache = {};
};
