const _ = require('lodash');

module.exports = (...args) => {
    return args.map(array => {
        return array.filter(id => id)
            .map(id => {
                return !_.isString(id) && id.toString();
            });
    });
};
