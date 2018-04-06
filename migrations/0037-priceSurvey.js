/*
 * Monday, 12 February, 2018
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
                    return Object.assign({}, item, {
                        metric: {
                            en: 'Without metric',
                            ar: 'نوع وحده القياس'
                        }
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
