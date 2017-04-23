const mongoose = require('mongoose');
const async = require('async');
const _ = require('lodash');
const AccessManager = require('./../../../../helpers/access')();
const locationFiler = require('./../../utils/locationFilter');
const generalFiler = require('./../../utils/generalFilter');
const ItemModel = require('./../../../../types/item/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');

const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const queryRun = (personnel, callback) => {
        const query = req.query;
        const queryFilter = query.filter || {};
        const filters = [CONTENT_TYPES.COUNTRY, CONTENT_TYPES.PRODUCT, CONTENT_TYPES.VARIANT, CONTENT_TYPES.ITEM];
        const pipeline = [];

        filters.forEach((filterName) => {
            if (queryFilter[filterName] && queryFilter[filterName][0]) {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        ItemModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.ITEMS_AND_PRICES, cb);
        },
        (allowed, personnel, cb) => {
            queryRun(personnel, cb);
        },
    ], (err, result) => {
        if (err) {
            return next(err);
        }

        res.status(200).send(result);
    });
};
