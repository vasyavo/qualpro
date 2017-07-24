const async = require('async');
const AccessManager = require('./../../../../helpers/access')();
const BiYearlyModel = require('./../../../../types/biYearly/model');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const moment = require('moment');

module.exports = (req, res, next) => {
    const queryRun = (personnel, callback) => {
        const params = req.params;
        const personnelId = params.personnelId;

        BiYearlyModel.find({ personnel: personnelId }, (err, result) => {
            if (err) {
                return callback(err);
            }

            result = result.map((item) => {
                return {
                    personalSkills: item.personalSkills.result,
                    sellingSkills: item.sellingSkills.result,
                    reporting: item.reporting.result,
                    planningAndOrganizationSkills: item.planningAndOrganizationSkills.result,
                    date: `${moment(item.month, 'MM').format('MMMM')} ${item.year}`,
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
