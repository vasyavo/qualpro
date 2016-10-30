var Position = function (db) {
    var CONSTANTS = require('../constants/mainConstants');
    var PositionModel = require('./../types/position/model');

    this.getForDD = function (req, res, next) {
        var isMobile = req.isMobile;
        var query = req.query || {};
        var page = query.page || 1;
        var limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
        var skip = (page - 1) * limit;
        delete query.page;
        delete query.count;


        PositionModel.find(query, '_id name')
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

module.exports = Position;
