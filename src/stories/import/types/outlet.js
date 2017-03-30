const async = require('async');
const patchRecord = require('./../utils/patchRecord');
const trimObjectValues = require('./../utils/trimObjectValues');
const readCsv = require('./../utils/readCsv');
const OutletModel = require('./../../../types/outlet/model');

module.exports = (callback) => {
    async.waterfall([

        async.apply(readCsv, 'Outlet'),

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
                    archived: false,
                };

                patchRecord({
                    query,
                    patch,
                    model: OutletModel,
                }, eachCb);
            }, cb);
        },

    ], callback);
};
