var AccessRole = function (db) {
    var CONSTANTS = require('../constants/mainConstants');
    var AccessRoleModel = require('./../types/accessRole/model');

    this.getForDD = function (req, res, next) {
        var query = req.query;
        var level = req.session.level;

        query.level = {$gt: 0};

        if (level !== 1) {
            query.level = level < 8 ? {$gt: level, $lt: 8} : {$gt: 2, $lt: 8};
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