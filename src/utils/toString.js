const _ = require('lodash');

module.exports = (object, prop) => {
    if (!_.has(object, prop)) {
        return null;
    }

    const value = _.get(object, prop);
    const result = _.isObject(value) || _.isString(value) ?
        value.toString() : null;

    return result;
};
