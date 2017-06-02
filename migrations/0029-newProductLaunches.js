const async = require('async');

require('mongodb');

exports.up = function(db, next) {
    async.series([

        (cb) => {
            async.parallel([

                (cb) => {
                    db.collection('newProductLaunches').update({
                        packingType: 'GM',
                    }, {
                        $set: {
                            packingType: 'GM Net Weight',
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
