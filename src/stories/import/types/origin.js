const async = require('async');
const patchRecord = require('./../utils/patchRecord');
const trimObjectValues = require('./../utils/trimObjectValues');
const readCsv = require('./../utils/readCsv');
const OriginModel = require('./../../../types/origin/model');

function importOrigin(callback) {
    async.waterfall([

        async.apply(readCsv, 'Origin'),

        (data, cb) => {
            async.mapLimit(data, 10, (sourceObj, mapCb) => {
                const obj = trimObjectValues(sourceObj);
                const patch = Object.assign({}, {
                    ID: obj.ID,
                    name: {
                        en: obj['Name (EN)'],
                        ar: obj['Name (AR)']
                    }
                });
                const query = {
                    ID: patch.ID
                };

                patchRecord({
                    query,
                    patch,
                    model: OriginModel
                }, mapCb);
            }, cb)
        }

    ], callback);
}

module.exports = importOrigin;
