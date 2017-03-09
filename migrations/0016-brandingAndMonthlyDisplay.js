const async = require('async');

require('mongodb');

exports.up = function(db, next) {
    async.series([

        (cb) => {
            db.renameCollection('brandingAndDisplayNew', 'brandingAndMonthlyDisplay', cb);
        },

    ], next);
};

exports.down = function(db, next) {
    async.series([

        (cb) => {
            db.renameCollection('brandingAndMonthlyDisplay', 'brandingAndDisplayNew', cb);
        },

    ], next);
};

