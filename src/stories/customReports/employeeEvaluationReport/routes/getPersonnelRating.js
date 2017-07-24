const async = require('async');
const moment = require('moment');
const AccessManager = require('./../../../../helpers/access')();
const MonthlyModel = require('./../../../../types/monthly/model');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');

module.exports = (req, res, next) => {
    const queryRun = (personnel, callback) => {
        const params = req.params;
        const personnelId = params.personnelId;

        MonthlyModel.find({ personnel: personnelId }, (err, result) => {
            if (err) {
                return callback(err);
            }

            result = result.map((item) => {
                return {
                    rating: item.rating,
                    data: `${moment(item.month, 'MM').format('MMMM')} ${item.year}`,
                };
            });

            callback(null, result);
        });
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.PERSONNEL, cb);
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
