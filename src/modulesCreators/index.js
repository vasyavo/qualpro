const async = require('async');

module.exports = (callback) => {
    async.waterfall([

        require('./addModules').generate,


        require('./addModulesToAccessRoles').generate

    ], callback);
};
