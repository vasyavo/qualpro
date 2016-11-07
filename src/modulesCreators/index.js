const async = require('async');

module.exports = (callback) => {
    async.waterfall([

        require('./addModules').generate,

        require('./addModulesToAccessRoles').generate,

        // todo access role name is empty and level is undefined
        // require('./addLevelToAccessRoles').generate

    ], callback);
};
