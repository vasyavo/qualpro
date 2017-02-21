/*
 * Wednesday, 15 February, 2017
 * Feature "Documents"
 * */
const async = require('async');

require('mongodb');

exports.up = function(db, next) {
    async.waterfall([
        (waterfallCb) => {
            db.collection('variants').find({ 'name.en': 'BASBOUSAH' }, waterfallCb);
        },
        (variant, waterfallCb) => {
            db.collection('items').update({ variant: null, 'name.en': 'BASBOUSAH MIX' }, {
                $set: {
                    variant: variant._id,
                },
            }, {
                multi: true,
            }, waterfallCb);
        },
        (updateRes, waterfallCb) => {
            db.collection('variants').find({ 'name.en': 'CAKE' }, waterfallCb);
        },
        (variant, waterfallCb) => {
            db.collection('items').update({ variant: null, 'name.en': 'PANCAKE MIX' }, {
                $set: {
                    variant: variant._id,
                },
            }, {
                multi: true,
            }, waterfallCb);
        },
        (updateRes, waterfallCb) => {
            db.collection('variants').find({ 'name.en': 'DUMPLING' }, waterfallCb);
        },
        (variant, waterfallCb) => {
            db.collection('items').update({ variant: null, 'name.en': 'DUMPLING MIX' }, {
                $set: {
                    variant: variant._id,
                },
            }, {
                multi: true,
            }, waterfallCb);
        },
    ], next);
};

exports.down = function(db, next) {
    async.waterfall([
        (waterfallCb) => {
            db.collection('variants').find({ 'name.en': 'BASBOUSAH' }, waterfallCb);
        },
        (variant, waterfallCb) => {
            db.collection('items').update({ variant: variant._id, 'name.en': 'BASBOUSAH MIX' }, {
                $set: {
                    variant: null,
                },
            }, {
                multi: true,
            }, waterfallCb);
        },
        (updateRes, waterfallCb) => {
            db.collection('variants').find({ 'name.en': 'CAKE' }, waterfallCb);
        },
        (variant, waterfallCb) => {
            db.collection('items').update({ variant: variant._id, 'name.en': 'PANCAKE MIX' }, {
                $set: {
                    variant: null,
                },
            }, {
                multi: true,
            }, waterfallCb);
        },
        (updateRes, waterfallCb) => {
            db.collection('variants').find({ 'name.en': 'DUMPLING' }, waterfallCb);
        },
        (variant, waterfallCb) => {
            db.collection('items').update({ variant: variant._id, 'name.en': 'DUMPLING MIX' }, {
                $set: {
                    variant: null,
                },
            }, {
                multi: true,
            }, waterfallCb);
        },
    ], next);
};
