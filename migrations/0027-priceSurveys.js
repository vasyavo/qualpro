/*
 * Thursday, 20 April, 2017
 * Feature "priceSurveys"
 * */
const async = require('async');
const mime = require('mime');
const logger = require('./../src/utils/logger');

require('mongodb');
const ObjectId = require('mongodb').ObjectID;

exports.up = function(db, next) {
    async.waterfall([

        (cb) => {
            db.collection('priceSurveys')
                .find({})
                .project({
                    _id: 1,
                    items: 1
                })
                .toArray(cb);
        },

        (priceSurveys, cb) => {
            async.eachLimit(priceSurveys, 10, (priceSurvey, eachCb) => {
                const priceSurveyItems = priceSurvey.items.map((item) => {
                    const itemId = new ObjectId();
                    return Object.assign({}, item, {
                        _id: itemId
                    });
                });
                return db.collection('priceSurveys')
                    .updateOne({
                        _id: priceSurvey._id,
                    }, {
                        $set: {
                            items : priceSurveyItems
                        },
                    }, eachCb);
            }, cb);
        },

    ], next);
};

exports.down = function(db, next) {
    next();
};
