import _ from 'lodash';
import Promise from 'bluebird';

class Echo {
    constructor() {
        this.cache = {};
    }

    return(name, data, delay) {
        var promise = this.cache[name];
        if (!promise) {
            promise = this.cache[name] = Promise.delay(delay).then(() => {
                return _.cloneDeep(data);
            });
        }
        return promise;
    }

    clear() {
        this.cache = {};
    }
}

export {
    Echo as default,
    Echo
};
