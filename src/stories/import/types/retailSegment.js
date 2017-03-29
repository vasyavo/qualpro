const async = require('async');
const patchRecord = require('./../utils/patchRecord');
const trimObjectValues = require('./../utils/trimObjectValues');
const readCsv = require('./../utils/readCsv');
const RetailSegmentModel = require('./../../../types/retailSegment/model');

function importOrigin(callback) {
    async.waterfall([

        async.apply(readCsv, 'RetailSegment'),

        (data, cb) => {
            async.eachLimit(data, 10, (sourceObj, eachCb) => {
                const obj = trimObjectValues(sourceObj);
                const patch = Object.assign({}, {
                    name: {
                        en: obj['Name (EN)'],
                        ar: obj['Name (AR)'],
                    },
                });
                const query = {
                    'name.en': patch.name.en,
                };

                patchRecord({
                    query,
                    patch,
                    model: RetailSegmentModel,
                }, eachCb);
            }, cb);
        },

    ], callback);
}

module.exports = importOrigin;
