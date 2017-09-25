const async = require('async');
const AccessManager = require('./../../../../helpers/access')();
const CategoryModel = require('./../../../../types/category/model');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');

module.exports = (req, res, next) => {
    const queryRun = (personnel, callback) => {
        const pipeline = [];

        pipeline.push({
            $group: {
                _id: null,
                categories: { $push: '$$ROOT' },
            },
        });

        pipeline.push({
            $project: {
                categories: {
                    _id: 1,
                    name: 1,
                },
                brands: null,
            },
        });

        pipeline.push({
            $lookup: {
                from: 'brands',
                localField: 'brands',
                foreignField: 'brands',
                as: 'brands',
            },
        });

        pipeline.push({
            $project: {
                categories: 1,
                brands: {
                    _id: 1,
                    name: 1,
                },
            },
        });

        CategoryModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.LOCATIONS, cb);
        },
        (allowed, personnel, cb) => {
            queryRun(personnel, cb);
        },
    ], (err, result) => {
        if (err) {
            return next(err);
        }

        const response = result && result[0] ? result[0] : {
            categories: [],
            brands: [],
        };

        res.status(200).send(response);
    });
};
