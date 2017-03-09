const async = require('async');

require('mongodb');

exports.up = function(db, next) {
    async.series([

        (cb) => {
            async.parallel([

                (cb) => {
                    db.collection('activityLists').update({
                        actionType: 'New comment was added',
                    }, {
                        $set: {
                            actionType: 'Commented',
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
    async.series([

        (cb) => {
            async.parallel([

                (cb) => {
                    db.collection('activityLists').update({
                        actionType: 'Commented',
                    }, {
                        $set: {
                            actionType: 'New comment was added',
                        },
                    }, {
                        multi: true,
                    }, cb);
                },

            ], cb);
        },

    ], next);
};
