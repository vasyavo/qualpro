const async = require('async');
const mongoose = require('mongoose');
const _ = require('lodash');

const ObjectId = mongoose.Types.ObjectId;

require('mongodb');

// $lookup don't work with cover in String type

exports.up = function(db, next) {
    async.series([

        (cb) => {
            db.collection('personnels').find({
                'vacation.cover': {
                    $exists: true,
                },
            }).project({
                _id: 1,
                'vacation.cover': 1,
            }).toArray(cb);
        },

        (setPersonnel, cb) => {
            async.eachLimit(setPersonnel, 10, (personnel, eachCb) => {
                const cover = personnel.vacation.cover;

                if (_.isString(cover) && cover.length === 24) {
                    return db.collection('personnels').update({
                        _id: personnel._id,
                    }, {
                        $set: {
                            'vacation.cover': ObjectId(cover),
                        },
                    }, eachCb);
                }

                eachCb();
            }, cb);
        },

    ], next);
};

exports.down = function(db, next) {
    next();
};
