const {
    rehydrate,
} = require('../../../stories/badges/store');

const ACL_MODULES = require('../../../constants/aclModulesNames');
const access = require('../../../helpers/access')();
const async = require('async');

module.exports = (res, req, next) => {
    const queryRun = (callback) => {
        const userId = req.session.uId;
        const address = `badges:${userId}`;

        rehydrate(address, callback);
    };

    async.waterfall([

        (cb) => {
            access.getReadAccess(req, ACL_MODULES.ACTIVITY_LIST, cb);
        },

        (allowed, personnel, cb) => {
            queryRun(cb);
        },

    ], (err, state) => {
        if (err) {
            return next(err);
        }

        res.status(200).send({
            badgesState: state,
        });
    });
};
