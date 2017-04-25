const _ = require('lodash');

const trimObjectValues = (obj) => {
    for (let key in obj) {
        const value = obj[key];

        if (_.isString(value)) {
            obj[key] = value.trim();
        }
    }

    return obj;
};

module.exports = trimObjectValues;
