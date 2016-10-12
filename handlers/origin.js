var OriginHandler = function (db) {
    var async = require('async');
    var mongoose = require('mongoose');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var modelAndSchemaName = CONTENT_TYPES.ORIGIN;
    var schema = mongoose.Schemas[modelAndSchemaName];
    var Model = db.model(modelAndSchemaName, schema);
    var FilterMapper = require('../helpers/filterMapper');

    this.getForDD = function (req, res, next) {
        var query = req.query;

        Model.find(query, '_id name').exec(function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.getAll = function (req, res, next) {
        var query = req.query;
        var page = query.page || 1;
        var limit = parseInt(query.count) || parseInt(CONSTANTS.LIST_COUNT);
        var skip = (page - 1) * limit;

        var filterMapper = new FilterMapper();
        var queryObject = query.filter ? filterMapper.mapFilter({
            contentType: CONTENT_TYPES.ORIGIN,
            filter     : query.filter || {}
        }) : {};

        var parallelTasks;

        parallelTasks = {
            total: Model.count.bind(Model, queryObject),
            data : function (parallelCb) {
                if (limit && limit !== -1) {
                    Model.find(queryObject)
                        .skip(skip)
                        .limit(limit)
                        .exec(parallelCb);
                } else {
                    Model.find(queryObject)
                        .exec(parallelCb);
                }
            }
        };

        async.parallel(parallelTasks, function (err, response) {
            if (err) {
                return next(err);
            }

            if (!req.isMobile) {
                return res.status(200).send(response);
            }

            next({status: 200, body: response});
        });
    };
};

module.exports = OriginHandler;
