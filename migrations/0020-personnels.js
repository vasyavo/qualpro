const async = require('async');

require('mongodb');

exports.up = function(db, next) {
    async.series([

        (cb) => {
            db.collection('personnels').update({
                xlsParent: {
                    $ne: null,
                },
            }, {
                $set: {
                    xlsParent: null,
                },
            }, {
                multi: true,
            }, cb);
        },

    ], next);
};

exports.down = function(db, next) {
    next();
};
