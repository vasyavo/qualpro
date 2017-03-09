const async = require('async');

require('mongodb');

exports.up = function(db, next) {
    async.series([

        (cb) => {
            async.parallel([

                (cb) => {
                    db.collection('personnels').update({
                        avgRating: {
                            $exists: false,
                        },
                    }, {
                        $set: {
                            avgRating: {},
                        },
                    }, {
                        multi: true,
                    }, cb);
                },

            ], cb);
        },

    ], next);
};

exports.down = function(db, next) {
    next();
};
