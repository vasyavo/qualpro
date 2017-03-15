const async = require('async');
const mongoose = require('mongoose');
const _ = require('lodash');
const logger = require('./../src/utils/logger');

const ObjectId = mongoose.Types.ObjectId;

require('mongodb');

// $lookup don't work with cover in String type

exports.up = function(db, next) {
    async.waterfall([

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
                const vacation = personnel.vacation;

                if (vacation && _.isString(vacation.cover) && vacation.cover.length === 24) {
                    logger.info('Affected personnel:', {
                        _id: personnel._id,
                        'vacation.cover': vacation.cover,
                    });

                    return db.collection('personnels').update({
                        _id: personnel._id,
                    }, {
                        $set: {
                            'vacation.cover': ObjectId(vacation.cover),
                        },
                    }, {}, eachCb);
                }

                eachCb();
            }, cb);
        },

    ], next);
};

exports.down = function(db, next) {
    next();
};
