'use strict';

var ItemHistory = function (db, event) {
    var async = require('async');
    var mongoose = require('mongoose');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONSTANTS = require('../constants/mainConstants');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var modelAndSchemaName = CONTENT_TYPES.ITEMHISTORY;
    var schema = mongoose.Schemas[modelAndSchemaName];
    var access = require('../helpers/access')(db);
    var Model = db.model(modelAndSchemaName, schema);
    var ItemModel = db.model(CONTENT_TYPES.ITEM, mongoose.Schemas[CONTENT_TYPES.ITEM]);
    var _ = require('underscore');
    var FilterMapper = require('../helpers/filterMapper');
    var AggregationHelper = require('../helpers/aggregationCreater');

    var $defProjection = {
        _id      : 1,
        item     : 1,
        ppt      : 1,
        createdBy: 1
    };

    var $itemDefProjection = {
        _id          : 1,
        name         : 1,
        barCode      : 1,
        packing      : 1,
        ppt          : 1,
        origin       : 1,
        category     : 1,
        variant      : 1,
        location     : 1,
        archived     : 1,
        createdBy    : 1,
        editedBy     : 1,
        topArchived  : 1,
        product      : 1,
        outlet       : 1,
        country      : 1,
        retailSegment: 1
    };

    var modelFindById = function (id, callback) {
        var query = Model.findOne({_id: id});

        query.exec(callback);
    };

    this.getAll = function (req, res, next) {
        function queryRun(personnel) {
            var query = req.query || {};
            var page = query.page || 1;
            var limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
            var skip = (page - 1) * limit;

            var filterMapper = new FilterMapper();
            var filter = query.filter || {};
            var filterSearch = filter.globalSearch || '';
            var queryObject;
            var beforeFilter;
            var locationFilter;
            var timeFilter;
            var key;

            var waterfallTasks = [];

            var sort = query.sort || {
                'createdBy.date': 1
            };

            var searchFieldsArray = [
                'name.en',
                'name.ar',
                'barCode',
                'packing',
                'origin.name',
                'variant.name.en',
                'variant.name.ar',
                'category.name.en',
                'category.name.ar'
            ];

            for (key in sort) {
                if (sort.hasOwnProperty(key)) {
                    sort[key] = parseInt(sort[key], 10);
                }
            }


            delete filter.globalSearch;
            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.ITEMHISTORY,
                filter     : filter,
                personnel  : personnel
            });
            delete queryObject.region;
            delete queryObject.subRegion;

            beforeFilter = _.pick(queryObject, 'country', 'category', 'variant', 'packing');
            locationFilter = _.pick(queryObject, 'country', 'retailSegment', 'outlet');
            timeFilter = _.pick(queryObject, '$and');

            waterfallTasks.push(function (callback) {
                var aggregationHelper = new AggregationHelper($itemDefProjection, queryObject);
                var pipeLine = [];

                pipeLine.push({
                    $match: beforeFilter
                });

                pipeLine.push({
                    $match: {
                        $or: [
                            {location: {$size: 0}},
                            {location: {$elemMatch: locationFilter}}
                        ]
                    }
                });

                if (filterSearch) {
                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from: 'origins',
                        key : 'origin'
                    }));

                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from   : 'categories',
                        key    : 'category',
                        isArray: false
                    }));

                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from   : 'variants',
                        key    : 'variant',
                        isArray: false
                    }));

                    pipeLine.push({
                        $match: aggregationHelper.getSearchMatch(searchFieldsArray, filterSearch)
                    });
                }

                pipeLine.push({
                    $project: {
                        _id : 0,
                        item: '$_id'
                    }
                });

                ItemModel.aggregate(pipeLine, callback);
            });

            waterfallTasks.push(function (itemIds, callback) {
                var aggregationHelper = new AggregationHelper($defProjection, queryObject);
                var pipeLine = [];

                if (!itemIds.length) {
                    return callback(null, [{data: [], total: 0}]);
                }

                pipeLine.push({
                    $match: {
                        $or: itemIds
                    }
                });

                pipeLine.push({
                    $match: timeFilter
                });

                pipeLine.push({
                    $project: aggregationHelper.getProjection({
                        ppt: {
                            $divide: ['$ppt', 100]
                        }
                    })
                });

                /* Uncomment code below if need lookup for items */
                // pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                //     from         : 'items',
                //     key          : 'item',
                //     addProjection: ['name', 'packing', 'ppt', 'category', 'variant', 'country', 'location'],
                //     isArray      : false
                // }));

                pipeLine.push({
                    $sort: sort
                });

                if (limit && limit !== -1) {
                    pipeLine.push({
                        $skip: skip
                    });

                    pipeLine.push({
                        $limit: limit
                    });
                }

                pipeLine = _.union(pipeLine, aggregationHelper.setTotal());

                pipeLine = _.union(pipeLine, aggregationHelper.groupForUi());

                Model.aggregate(pipeLine, callback);
            });

            async.waterfall(waterfallTasks, function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result[0]);
            });
        }

        access.getReadAccess(req, ACL_MODULES.ITEMS_AND_PRICES, function (err, allowed, personnel) {
            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            queryRun(personnel);
        });

    };

    this.getById = function (req, res, next) {
        function queryRun() {
            var id = req.params.id;

            modelFindById(id, function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.ITEMS_AND_PRICES, function (err, allowed) {
            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            queryRun();
        });
    };
};

module.exports = ItemHistory;
