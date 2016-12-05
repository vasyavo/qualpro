var AccessRole = function (db) {
    var CONSTANTS = require('../constants/mainConstants');
    var ACL_ROLES = require('../constants/aclRolesNames');
    var AccessRoleModel = require('./../types/accessRole/model');

    this.getForDD = function (req, res, next) {
        var query = req.query;
        var level = req.session.level;

        query.level = {$gt: ACL_ROLES.SUPER_ADMIN};

        if (level !== 1) {
            query.level = level < ACL_ROLES.MASTER_UPLOADER
                ? {$gt: level, $lt: ACL_ROLES.MASTER_UPLOADER}
                : {$gt: ACL_ROLES.COUNTRY_ADMIN, $lt: ACL_ROLES.MASTER_UPLOADER};
        }

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
