const _ = require('lodash');
const invalidCharsRegExp = /[~<>\^*₴]/;

const trimObjectValues = (obj, {includeValidation = false}) => {
    for (let key in obj) {
        const value = obj[key];

        if (includeValidation && invalidCharsRegExp.test(value)) {
            throw new Error(`Field ${key} can not contain '~ < > ^ * ₴' signs`)
        }

        if (_.isString(value)) {
            obj[key] = value.trim();
        }
    }

    return obj;
};

module.exports = trimObjectValues;
