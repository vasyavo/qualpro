const async = require('async');
const patchRecord = require('./../utils/patchRecord');
const trimObjectValues = require('./../utils/trimObjectValues');
const readCsv = require('./../utils/readCsv');
const DomainModel = require('./../../../types/domain/model');
const RetailSegmentModel = require('./../../../types/retailSegment/model');
const OutletModel = require('./../../../types/outlet/model');
const BranchModel = require('./../../../types/branch/model');

module.exports = (callback) => {
    async.waterfall([

        async.apply(readCsv, 'Branch'),

        (data, cb) => {
            async.eachLimit(data, 10, (sourceObj, eachCb) => {
                const obj = trimObjectValues(sourceObj);
                const patch = Object.assign({}, {
                    name: {
                        en: obj['Name (EN)'],
                        ar: obj['Name (AR)'],
                    },
                    address: {
                        en: obj['Address (EN)'],
                        ar: obj['Address (AR)'],
                    },
                });
                const subRegion = obj['Sub-Region'];
                const retailSegment = obj['Retail Segment'];
                const outlet = obj.Outlet;

                if (!subRegion || !retailSegment || !outlet) {
                    return eachCb(null);
                }

                const parallelJobs = {};

                parallelJobs.subRegion = (cb) => {
                    const query = {
                        'name.en': subRegion,
                        type: 'subRegion',
                    };

                    DomainModel.findOne(query).select('_id').lean().exec(cb);
                };

                parallelJobs.retailSegment = (cb) => {
                    const query = {
                        'name.en': retailSegment,
                    };

                    RetailSegmentModel.findOne(query).select('_id').lean().exec(cb);
                };

                parallelJobs.outlet = (cb) => {
                    const query = {
                        'name.en': outlet,
                    };

                    OutletModel.findOne(query).select('_id').lean().exec(cb);
                };

                async.parallel(parallelJobs, (err, population) => {
                    if (err) {
                        return eachCb(err);
                    }

                    patch.subRegion = population.subRegion ?
                        population.subRegion._id : null;
                    patch.retailSegment = population.retailSegment ?
                        population.retailSegment._id : null;
                    patch.outlet = population.outlet ?
                        population.outlet._id : null;

                    if (!patch.subRegion || !patch.retailSegment || !patch.outlet) {
                        return eachCb(null);
                    }

                    const query = {
                        'name.en': patch.name.en,
                        subRegion: patch.subRegion,
                        retailSegment: patch.retailSegment,
                        outlet: patch.outlet,
                    };

                    patchRecord({
                        query,
                        patch,
                        model: BranchModel,
                    }, (err) => {
                        if (err) {
                            console.log(query, patch)
                            return eachCb(err);
                        }

                        eachCb();
                    });
                });
            }, cb);
        },

    ], callback);
};
