const async = require('async');
const ActivityLog = require('./../stories/push-notifications/activityLog');

var ShelfShareHandler = function () {
    var _ = require('underscore');
    var mongoose = require('mongoose');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var access = require('../helpers/access')();
    var CONSTANTS = require('../constants/mainConstants');
    var FilterMapper = require('../helpers/filterMapper');
    var bodyValidator = require('../helpers/bodyValidator');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var objectId = mongoose.Types.ObjectId;

    var ShelfShareModel = require('./../types/shelfShare/model');

    var $defProjection = {
        _id                 : 1,
        category            : 1,
        brands              : 1,
        totalBrandsLength   : 1,
        totalBrandsLengthMin: 1,
        totalBrandsLengthMax: 1,
        totalBrandsLengthAvg: 1,
        total               : 1,
        brandsLength        : 1,
        createdBy           : 1,
        user                : 1,
        date                : 1,
        firstName           : 1,
        lastName            : 1,
        position            : 1,
        brand               : 1,
        length              : 1,
        lengthStr           : 1,
        timeStamp           : 1,
        employee            : 1,
        name                : 1,
        percent             : 1,
        branch              : 1,
        outlet              : 1
    };
    var self = this;

    this.getBrands = function (req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var filter = query.filter;
            var filterMapper = new FilterMapper();
            var queryObject = query.filter ? filterMapper.mapFilter({
                contentType: CONTENT_TYPES.SHELFSHARES,
                filter     : filter,
                personnel  : personnel
            }) : {};

            var search = query.search;
            var pipeLine = [];
            var aggregateHelper;
            var aggregation;
            var brandFilter;
            var positionFilter;
            var personnelFilter;
            var searchFieldsArray = [
                'category.name.en',
                'category.name.ar',
                'brand.name.en',
                'brand.name.ar',
                'branch.name.en',
                'branch.name.ar',
                'employee.name.en',
                'employee.name.ar',
                'lengthStr'
            ];

            if (query.brand || queryObject.brand) {
                brandFilter = queryObject.brand ? queryObject.brand : objectId(query.brand);
                delete queryObject.brand;
            }

            if (queryObject.position) {
                positionFilter = queryObject.position;
                delete queryObject.position;
            }

            if (queryObject.personnel) {
                personnelFilter = queryObject.personnel;
                delete queryObject.personnel;
            }

            aggregateHelper = new AggregationHelper($defProjection);

            pipeLine.push({
                $match: queryObject
            });

            if (personnelFilter) {
                pipeLine.push({
                    $match: {
                        'createdBy.user': personnelFilter
                    }
                });
            }

            pipeLine.push({
                $unwind: {
                    preserveNullAndEmptyArrays: true,
                    path                      : '$brands'
                }
            });

            if (brandFilter) {
                pipeLine.push({
                    $match: {
                        'brands.brand': brandFilter
                    }
                });
            }

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from   : 'categories',
                key    : 'category',
                isArray: false
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from           : 'brands',
                key            : 'brands.brand',
                isArray        : false,
                includeSiblings: {
                    brands: {
                        brand  : 1,
                        length : 1,
                        percent: 1
                    }
                }
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from         : 'branches',
                key          : 'branch',
                isArray      : false,
                addProjection: ['outlet', 'retailSegment']
            }));

            if (queryObject.outlet) {
                pipeLine.push({
                    $match: {
                        'branch.outlet': queryObject.outlet
                    }
                });
            }

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from         : 'outlets',
                key          : 'outlet',
                isArray      : false,
                addProjection: ['retailSegments']
            }));

            if (queryObject.retailSegment) {
                pipeLine.push({
                    $match: {
                        'branch.retailSegment' : queryObject.retailSegment,
                        'outlet.retailSegments': queryObject.retailSegment
                    }
                });
            }

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from           : 'personnels',
                key            : 'createdBy.user',
                addProjection  : ['position', 'firstName', 'lastName', 'country', 'region', 'subRegion'],
                isArray        : false,
                includeSiblings: {
                    createdBy: {
                        date: 1
                    }
                }
            }));

            if (queryObject.country) {
                pipeLine.push({
                    $match: {
                        $or: [
                            {
                                'createdBy.user.country': queryObject.country
                            },
                            {
                                'createdBy.user.country': {$exists: false}
                            }
                        ]
                    }
                });
            }

            if (queryObject.region) {
                pipeLine.push({
                    $match: {
                        $or: [
                            {
                                'createdBy.user.region': queryObject.region
                            },
                            {
                                'createdBy.user.region': {$exists: false}
                            }
                        ]
                    }
                });
            }

            if (queryObject.subRegion) {
                pipeLine.push({
                    $match: {
                        $or: [
                            {
                                'createdBy.user.subRegion': queryObject.subRegion
                            },
                            {
                                'createdBy.user.subRegion': {$exists: false}
                            }
                        ]
                    }
                });
            }

            if (positionFilter) {
                pipeLine.push({
                    $match: {
                        'createdBy.user.position': positionFilter
                    }
                });
            }

            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    length   : '$brands.length',
                    lengthStr: {$substr: ['$brands.length', 0, -1]},
                    timeStamp: '$createdBy.date',
                    employee : {
                        _id : '$createdBy.user._id',
                        name: {
                            en: {$concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en']},
                            ar: {$concat: ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar']}
                        }
                    }
                })
            });
            if (search || search === '') {
                pipeLine.push({
                    $match: aggregateHelper.getSearchMatch(searchFieldsArray, search)
                });
            }

            aggregation = ShelfShareModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec(function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        }

        access.getReadAccess(req, 39, function (err, allowed, personnel) {
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

    this.getAll = function (req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var page = query.page || 1;
            var limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
            var skip = (page - 1) * limit;
            var filterMapper = new FilterMapper();
            var filter = query.filter || {};
            var filterSearch = filter.globalSearch || '';
            var aggregateHelper;
            var key;
            var pipeLine = [];
            var aggregation;
            var employeeFilter;
            var positionFilter;
            var queryObject;
            var brandFilter;
            var searchFieldsArray = [
                'category.name.en',
                'category.name.ar',
                'brand.name.en',
                'brand.name.ar',
                'lengthStr'
            ];

            var sort = query.sort || {'editedBy.date': 1};

            delete filter.globalSearch;

            queryObject = query.filter ? filterMapper.mapFilter({
                contentType: CONTENT_TYPES.SHELFSHARES,
                filter     : filter,
                personnel  : personnel
            }) : {};

            if (queryObject.brand) {
                brandFilter = queryObject.brand;
                delete queryObject.brand;
            }

            if (queryObject.personnel) {
                employeeFilter = queryObject.personnel;
                delete queryObject.personnel;
            }

            if (queryObject.position) {
                positionFilter = queryObject.position;
                delete queryObject.position;
            }

            for (key in sort) {
                if (sort.hasOwnProperty(key)) {
                    sort[key] = parseInt(sort[key], 10);
                }
            }

            aggregateHelper = new AggregationHelper($defProjection);

            pipeLine.push({
                $match: queryObject
            });

            if (employeeFilter) {
                pipeLine.push({
                    $match: {
                        'createdBy.user': employeeFilter
                    }
                });
            }

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from         : 'personnels',
                key          : 'createdBy.user',
                addProjection: ['position', 'country', 'region', 'subRegion'],
                isArray      : false
            }));

            if (queryObject.country) {
                pipeLine.push({
                    $match: {
                        $or: [
                            {
                                'createdBy.user.country': queryObject.country
                            },
                            {
                                'createdBy.user.country': {$exists: false}
                            },
                            {
                                'createdBy.user.country': {$size: 0}
                            }
                        ]
                    }
                });
            }

            if (queryObject.region) {
                pipeLine.push({
                    $match: {
                        $or: [
                            {
                                'createdBy.user.region': queryObject.region
                            },
                            {
                                'createdBy.user.region': {$exists: false}
                            }
                        ]
                    }
                });
            }

            if (queryObject.subRegion) {
                pipeLine.push({
                    $match: {
                        $or: [
                            {
                                'createdBy.user.subRegion': queryObject.subRegion
                            },
                            {
                                'createdBy.user.subRegion': {$exists: false}
                            }
                        ]
                    }
                });
            }

            if (positionFilter) {
                pipeLine.push({
                    $match: {
                        'createdBy.user.position': positionFilter
                    }
                });
            }

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from         : 'branches',
                key          : 'branch',
                isArray      : false,
                addProjection: ['outlet', 'retailSegment', 'subRegion']
            }));

            if (queryObject.outlet) {
                pipeLine.push({
                    $match: {
                        'branch.outlet': queryObject.outlet
                    }
                });
            }

            if (queryObject.subRegion) {
                pipeLine.push({
                    $match: {
                        $or: [
                            {
                                'branches.subRegion': queryObject.subRegion
                            },
                            {
                                'branches.subRegion': {$exists: false}
                            }
                        ]
                    }
                });
            }

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from           : 'domains',
                key            : 'branch.subRegion',
                isArray        : false,
                addProjection  : ['parent'],
                includeSiblings: {
                    branch: {
                        _id : 1,
                        name: 1
                    }
                }
            }));

            if (queryObject.subRegion) {
                pipeLine.push({
                    $match: {
                        $or: [
                            {
                                'branches.subRegion.parent': queryObject.region
                            },
                            {
                                'branches.subRegion.parent': {$exists: false}
                            }
                        ]
                    }
                });
            }

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from         : 'outlets',
                key          : 'outlet',
                isArray      : false,
                addProjection: ['retailSegments']
            }));

            if (queryObject.retailSegment) {
                pipeLine.push({
                    $match: {
                        $or : [
                            {
                                'branch.retailSegment' : queryObject.retailSegment,
                            },
                            {
                                'outlet.retailSegments': queryObject.retailSegment
                            }
                        ]
                    }
                });
            }

            pipeLine.push({
                $unwind: {
                    preserveNullAndEmptyArrays: true,
                    path                      : '$brands'
                }
            });

            if (brandFilter) {
                pipeLine.push({
                    $match: {
                        'brands.brand': brandFilter
                    }
                });
            }

            pipeLine.push({
                $lookup: {
                    from        : 'categories',
                    localField  : 'category',
                    foreignField: '_id',
                    as          : 'category'
                }
            });

            pipeLine.push({
                $project: {
                    category: {$arrayElemAt: ['$category', 0]},
                    brands  : 1
                }
            });

            pipeLine.push({
                $project: {
                    category: {
                        _id : '$category._id',
                        name: '$category.name'
                    },
                    brand   : '$brands.brand',
                    length  : '$brands.length'
                }
            });

            pipeLine.push({
                $lookup: {
                    from        : 'brands',
                    localField  : 'brand',
                    foreignField: '_id',
                    as          : 'brand'
                }
            });

            pipeLine.push({
                $project: {
                    category: 1,
                    brand   : {$arrayElemAt: ['$brand', 0]},
                    length  : 1
                }
            });

            pipeLine.push({
                $project: {
                    category : 1,
                    brand    : {
                        _id       : '$brand._id',
                        name      : '$brand.name',
                        ourCompany: '$brand.ourCompany'
                    },
                    length   : 1,
                    lengthStr: {$substr: ['$length', 0, -1]}
                }
            });

            pipeLine.push({
                $match: aggregateHelper.getSearchMatch(searchFieldsArray, filterSearch)
            });

            pipeLine.push({
                $group: {
                    _id: {
                        category: '$category',
                        brand   : '$brand'
                    },
                    min: {
                        $min: '$length'
                    },
                    max: {
                        $max: '$length'
                    },
                    avg: {
                        $avg: '$length'
                    }
                }
            });

            pipeLine.push({
                $group: {
                    _id                 : '$_id.category',
                    brands              : {
                        $push: {
                            brand: '$_id.brand',
                            min  : '$min',
                            max  : '$max',
                            avg  : '$avg'
                        }
                    },
                    totalBrandsLengthMin: {
                        $sum: '$min'
                    },
                    totalBrandsLengthMax: {
                        $sum: '$max'
                    },
                    totalBrandsLengthAvg: {
                        $sum: '$avg'
                    }
                }
            });

            pipeLine.push({
                $unwind: {
                    preserveNullAndEmptyArrays: true,
                    path                      : '$brands'
                }
            });

            pipeLine.push({
                $project: {
                    category            : '$_id',
                    brand               : '$brands.brand',
                    min                 : '$brands.min',
                    minPercent          : {
                        $multiply: [{$divide: ['$brands.min', '$totalBrandsLengthMin']}, 100]
                    },
                    max                 : '$brands.max',
                    maxPercent          : {
                        $multiply: [{$divide: ['$brands.max', '$totalBrandsLengthMax']}, 100]
                    },
                    avg                 : '$brands.avg',
                    avgPercent          : {
                        $multiply: [{$divide: ['$brands.avg', '$totalBrandsLengthAvg']}, 100]
                    },
                    totalBrandsLengthMin: 1,
                    totalBrandsLengthMax: 1,
                    totalBrandsLengthAvg: 1
                }
            });

            pipeLine.push({
                $sort: {
                    'brand.ourCompany': -1,
                    'brand.name'      : 1
                }
            });

            pipeLine.push({
                $group: {
                    _id                 : '$category._id',
                    category            : {
                        $first: '$category'
                    },
                    brands              : {
                        $push: {
                            _id : '$brand._id',
                            name: '$brand.name',
                            min : {
                                length : '$min',
                                percent: '$minPercent'
                            },
                            max : {
                                length : '$max',
                                percent: '$maxPercent'
                            },
                            avg : {
                                length : '$avg',
                                percent: '$avgPercent'
                            }
                        }
                    },
                    brandsLength        : {
                        $sum: 1
                    },
                    totalBrandsLengthMin: {
                        $first: '$totalBrandsLengthMin'
                    },
                    totalBrandsLengthMax: {
                        $first: '$totalBrandsLengthMax'
                    },
                    totalBrandsLengthAvg: {
                        $first: '$totalBrandsLengthAvg'
                    }
                }
            });

            /* pipeLine = _.union(pipeLine, aggregateHelper.setTotal());

             pipeLine.push({
             $sort: sort
             });

             pipeLine.push({
             $skip: skip
             });

             pipeLine.push({
             $limit: limit
             });

             pipeLine = _.union(pipeLine, aggregateHelper.groupForUi());*/

            pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
                searchFieldsArray: searchFieldsArray,
                filterSearch     : filterSearch,
                skip             : skip,
                limit            : limit,
                sort             : sort
            }));

            aggregation = ShelfShareModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec(function (err, response) {
                var result;

                if (err) {
                    return next(err);
                }

                if (response.length) {
                    response[0].data = _.map(response[0].data, function (model) {

                        if (model.brands && model.brands.length) {
                            model.brands.forEach(function (brand) {
                                if (brand.length) {
                                    brand.length = _.unescape(brand.length);
                                }
                                if (brand.percent) {
                                    brand.percent = _.unescape(brand.percent);
                                }
                            });
                        }
                        if (model.totalBrandsLength) {
                            model.totalBrandsLength = _.unescape(model.totalBrandsLength);
                        }

                        return model;
                    });
                }

                result = response && response[0] ? response[0] : {data: [], total: 0};

                // res.status(200).send(result);

                next({status: 200, body: result});
            });
        }

        access.getReadAccess(req, ACL_MODULES.SHELF_SHARES, function (err, allowed, personnel) {
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

    this.create = (req, res, next) => {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        const queryRun = (body, callback) => {
            const createdBy = {
                user: userId,
                date: new Date(),
            };
            if (body.brands && body.brands.length) {
                body.brands.forEach((brand) => {
                    if (brand.length) {
                        brand.length = _.escape(brand.length);
                    }
                    if (brand.percent) {
                        brand.percent = _.escape(brand.percent);
                    }
                });
            }
            if (body.totalBrandsLength) {
                body.totalBrandsLength = _.escape(body.totalBrandsLength);
            }

            body.createdBy = createdBy;

            const report = new ShelfShareModel();

            report.set(body);
            report.save((err, model) => {
                callback(err, model);
            });
        };

        async.waterfall([

            (cb) => {
                access.getWriteAccess(req, ACL_MODULES.SHELF_SHARES, cb);
            },

            (allowed, personnel, cb) => {
                bodyValidator.validateBody(req.body, accessRoleLevel, CONTENT_TYPES.SHELFSHARES, 'create', cb);
            },

            queryRun,

        ], (err, model) => {
            if (err) {
                return next(err);
            }

            ActivityLog.emit('reporting:shelf-share:published', {
                actionOriginator: userId,
                accessRoleLevel,
                body: model.toJSON(),
            });

            res.status(200).send(model);
        });
    };

    this.getById = function (req, res, next) {
        function queryRun() {
            var id = objectId(req.params.id);

            self.getByIdAggr({id: id}, function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.SHELF_SHARES, function (err, allowed) {
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

    this.getByIdAggr = function (options, callback) {
        var aggregateHelper;
        var pipeLine = [];
        var aggregation;
        var isMobile = options.isMobile;
        var id = options.id || '';
        var filesObj = {
            from         : 'files',
            key          : 'attachments',
            addProjection: ['contentType', 'originalName', 'extension', 'createdBy']
        };

        aggregateHelper = new AggregationHelper($defProjection);

        pipeLine.push({
            $match: {_id: id}
        });

        pipeLine.push({
            $unwind: {
                preserveNullAndEmptyArrays: true,
                path                      : '$brands'
            }
        });

        pipeLine.push({
            $group: {
                _id              : {
                    category: '$category',
                    brand   : '$brands.brand'
                },
                min              : {
                    $min: '$brands.length'
                },
                minPercent       : {
                    $min: '$brands.percent'
                },
                max              : {
                    $max: '$brands.length'
                },
                maxPercent       : {
                    $max: '$brands.percent'
                },
                avg              : {
                    $avg: '$brands.length'
                },
                avgPercent       : {
                    $avg: '$brands.percent'
                },
                totalBrandsLength: {
                    $sum: '$brands.length'
                }
            }
        });

        pipeLine.push({
            $lookup: {
                from        : 'brands',
                localField  : '_id.brand',
                foreignField: '_id',
                as          : 'brandModel'
            }
        });

        pipeLine.push({
            $project: {
                brand            : {
                    min: {
                        length : '$min',
                        percent: '$minPercent'
                    },
                    max: {
                        length : '$max',
                        percent: '$maxPercent'
                    },
                    avg: {
                        length : '$avg',
                        percent: '$avgPercent'
                    }
                },
                _id              : 0,
                category         : '$_id.category',
                totalBrandsLength: 1,
                brandModel       : {$arrayElemAt: ['$brandModel', 0]}
            }
        });

        pipeLine.push({
            $project: {
                brand               : {
                    _id   : '$brandModel._id',
                    name  : '$brandModel.name',
                    min   : 1,
                    minStr: {
                        length : {$substr: ['$brand.min.length', 0, -1]},
                        percent: {$substr: ['$brand.min.percent', 0, -1]}
                    },
                    max   : 1,
                    maxStr: {
                        length : {$substr: ['$brand.max.length', 0, -1]},
                        percent: {$substr: ['$brand.max.percent', 0, -1]}
                    },
                    avg   : 1,
                    avgStr: {
                        length : {$substr: ['$brand.avg.length', 0, -1]},
                        percent: {$substr: ['$brand.avg.percent', 0, -1]}
                    }
                },
                totalBrandsLength   : 1,
                totalBrandsLengthStr: {$substr: ['$totalBrandsLength', 0, -1]},
                category            : 1
            }
        });

        pipeLine.push({
            $lookup: {
                from        : 'categories',
                localField  : 'category',
                foreignField: '_id',
                as          : 'category'
            }
        });

        pipeLine.push({
            $project: {
                category            : {$arrayElemAt: ['$category', 0]},
                brand               : 1,
                totalBrandsLength   : 1,
                totalBrandsLengthStr: 1
            }
        });

        pipeLine.push({
            $project: {
                category            : {
                    _id : '$category._id',
                    name: '$category.name'
                },
                brand               : 1,
                totalBrandsLength   : 1,
                totalBrandsLengthStr: 1
            }
        });

        pipeLine.push({
            $group: {
                category            : {
                    $first: '$category'
                },
                brands              : {
                    $push: '$brand'
                },
                brandsLength        : {
                    $sum: 1
                },
                totalBrandsLengthMin: {
                    $min: '$totalBrandsLength'
                },
                totalBrandsLengthMax: {
                    $max: '$totalBrandsLength'
                },
                totalBrandsLengthAvg: {
                    $avg: '$totalBrandsLength'
                },
                _id                 : '$category._id'
            }
        });

        aggregation = ShelfShareModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, model) {
            if (err) {
                return callback(err);
            }
            model = model[0];

            if (model) {
                if (model.brands && model.brands.length) {
                    model.brands.forEach(function (brand) {
                        if (brand.length) {
                            brand.length = _.unescape(brand.length);
                        }
                        if (brand.percent) {
                            brand.percent = _.unescape(brand.percent);
                        }
                    });
                }
                if (model.totalBrandsLength) {
                    model.totalBrandsLength = _.unescape(model.totalBrandsLength);
                }
            }

            callback(null, model);
        });
    };

};

module.exports = ShelfShareHandler;
