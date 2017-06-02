var AccessRole = function () {
    var CONSTANTS = require('../constants/mainConstants');
    var ACL_ROLES = require('../constants/aclRolesNames');
    var AccessRoleModel = require('./../types/accessRole/model');

    this.getForDD = function (req, res, next) {
        var query = req.query;
        var level = req.session.level;
        var accessRolesMatchConditions = {
            [ACL_ROLES.MASTER_ADMIN]: { $gt: ACL_ROLES.SUPER_ADMIN },
            [ACL_ROLES.COUNTRY_ADMIN]: { $gt: ACL_ROLES.MASTER_ADMIN, $lte: ACL_ROLES.TRADE_MARKETER, $ne: ACL_ROLES.MASTER_UPLOADER },
            [ACL_ROLES.AREA_MANAGER]: { $gt: level, $lte: ACL_ROLES.TRADE_MARKETER },
            [ACL_ROLES.AREA_IN_CHARGE]: { $gt: level, $lte: ACL_ROLES.TRADE_MARKETER },
            [ACL_ROLES.SALES_MAN]: { $gt: level, $lte: ACL_ROLES.TRADE_MARKETER },
            [ACL_ROLES.MERCHANDISER]: { $gt: level, $lte: ACL_ROLES.TRADE_MARKETER },
            [ACL_ROLES.CASH_VAN]: { $gt: level, $lte: ACL_ROLES.TRADE_MARKETER },
            [ACL_ROLES.MASTER_UPLOADER]: { $gt: ACL_ROLES.SUPER_ADMIN },
            [ACL_ROLES.COUNTRY_UPLOADER]: { $gt: ACL_ROLES.MASTER_ADMIN, $lte: ACL_ROLES.TRADE_MARKETER, $ne: ACL_ROLES.MASTER_UPLOADER },
            [ACL_ROLES.TRADE_MARKETER]: { $gt: ACL_ROLES.COUNTRY_ADMIN, $lte: ACL_ROLES.TRADE_MARKETER },
            [ACL_ROLES.VIRTUAL]: { $gt: ACL_ROLES.COUNTRY_ADMIN, $lte: ACL_ROLES.TRADE_MARKETER },
        };

        query.level = accessRolesMatchConditions[level];

        AccessRoleModel.find(query, '_id name level')
            .exec(function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
    };

    this.getAll = function (req, res, next) {
        var isMobile = req.isMobile;
        var query = req.query || {};
        var page = query.page || 1;
        var limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
        var skip = (page - 1) * limit;

        AccessRoleModel.find({})
            .limit(limit)
            .skip(skip)
            .exec(function (err, result) {
                var response = result;
                if (err) {
                    return next(err);
                }

                if (isMobile) {
                    if (result && result.length) {
                        response = {
                            data : result,
                            total: result.length
                        };
                    } else {
                        response = {
                            data : [],
                            total: 0
                        };
                    }
                }
                next({status: 200, body: response});
            });
    };
};

module.exports = AccessRole;
