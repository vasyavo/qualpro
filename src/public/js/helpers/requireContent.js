var lodash = require('lodash');
var modules = require('../requiredModules');

module.exports = function (path) {
    return lodash.get(modules(), path);
};
