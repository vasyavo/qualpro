const async = require('async');
const patchRecord = require('./../utils/patchRecord');
const trimObjectValues = require('./../utils/trimObjectValues');
const readCsv = require('./../utils/readCsv');
const PositionModel = require('./../../../types/position/model');

module.exports = (callback) => {
    async.waterfall([

        async.apply(readCsv, 'Position'),

        (data, cb) => {
            async.eachLimit(data, 10, (sourceObj, eachCb) => {
                const obj = trimObjectValues(sourceObj);
                const patch = Object.assign({}, {
                    ID: obj.ID,
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
                    model: PositionModel,
                }, eachCb);
            }, cb);
        },

    ], callback);
};
