const async = require('async');

require('mongodb');

exports.up = function (db, next) {

    async.waterfall([
        (cb) => {
            db.collection('origins').count(cb);
        },
        (count, cb) => {

            db.collection('origins').update({
                name: {
                    en: 'Scotland',
                    ar: 'أسكتلندا',
                },
            }, {
                $setOnInsert: {
                    ID: ++count,
                },
            }, {
                upsert: true,
            }, cb);
        },
    ], next);
};

exports.down = function (db, next) {
    next();
};
