const async = require('async');
const mongoose = require('mongoose');
const ACL_MODULES = require('./../../../constants/aclModulesNames');
const AccessManager = require('./../../../helpers/access')();
const getByIdAggr = require('./../reusable-components/getByIdAggr');

const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const queryRun = (callback) => {
        const id = req.params.id;

        getByIdAggr({
            id: ObjectId(id),
            isMobile: req.isMobile,
        }, callback);
    };

    async.waterfall([

        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.OBJECTIVE, cb);
        },

        (allowed, personnel, cb) => {
            queryRun(cb);
        },

    ], (err, result) => {
        if (err) {
            return next(err);
        }

        res.status(200).send(result);
    });
};
