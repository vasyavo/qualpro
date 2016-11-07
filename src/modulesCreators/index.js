const async = require('async');

module.exports = (callback) => {
    async.parallel([

        require('./addModulesToAccessRoles').generate,

        require('./addModules').generate

    ], callback);
};
