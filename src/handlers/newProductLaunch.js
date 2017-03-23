const ActivityLog = require('./../stories/push-notifications/activityLog');

var NewProductLaunch = function() {
    const logger = require('../utils/logger');
    var async = require('async');
    var _ = require('lodash');
    var mongoose = require('mongoose');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var NewProductLaunchModel = require('./../types/newProductLaunch/model');
    var FileHandler = require('../handlers/file');
    var fileHandler = new FileHandler();
    var access = require('../helpers/access')();
    var FilterMapper = require('../helpers/filterMapper');
    var ObjectId = mongoose.Types.ObjectId;
    var bodyValidator = require('../helpers/bodyValidator');
    var self = this;

    var $defProjection = {
        _id : 1,
        additionalComment : 1,
        category_name : 1,
        category : 1,
        variant : 1,
        brand : 1,
        packingType : 1,
        country : 1,
        region : 1,
        subRegion : 1,
        retailSegment : 1,
        outlet : 1,
        branch : 1,
        origin : 1,
        price : 1,
        packing : 1,
        location : 1,
        displayType : 1,
        distributor : 1,
        shelfLifeStart : 1,
        shelfLifeEnd : 1,
        archived : 1,
        createdBy : 1,
        editedBy : 1,
        attachments : 1
    };

    this.create = function(req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        function queryRun(body) {
            var files = req.files;
            var session = req.session;
            var userId = session.uId;
            var newProductLaunch;

            async.waterfall([
                function(cb) {
                    var createdBy = {
                        user : userId,
                        date : new Date()
                    };
                    if (body.additionalComment) {
                        body.additionalComment = {
                            en : _.escape(body.additionalComment.en),
                            ar : _.escape(body.additionalComment.ar)
                        };
                    }
                    if (body.category_name) {
                        body.category_name = {
                            en : _.escape(body.category_name.en),
                            ar : _.escape(body.category_name.ar)
                        };
                    }
                    if (body.location) {
                        body.location = {
                            en : _.escape(body.location.en),
                            ar : _.escape(body.location.ar)
                        };
                    }
                    if (body.distributor) {
                        body.distributor = {
                            en : _.escape(body.distributor.en),
                            ar : _.escape(body.distributor.ar)
                        };
                    }
                    if (body.brand && body.brand.name) {
                        body.brand.name = _.escape(body.brand.name);
                    }
                    if (body.variant && body.variant.name) {
                        body.variant.name = _.escape(body.variant.name);
                    }
                    if (body.price) {
                        body.price = _.escape(body.price);
                    }
                    if (body.packing) {
                        body.packing = _.escape(body.packing);
                    }
                    if (body.shelfLife) {
                        body.shelfLife = _.escape(body.shelfLife);
                    }

                    newProductLaunch = {
                        additionalComment : body.additionalComment,
                        category : body.category,
                        category_name : body.category_name,
                        brand : body.brand,
                        variant : body.variant,
                        country : body.country,
                        region : body.region,
                        subRegion : body.subRegion,
                        retailSegment : body.retailSegment,
                        outlet : body.outlet,
                        branch : body.branch,
                        origin : body.origin,
                        price : body.price,
                        packing : body.packing,
                        packingType : body.packingType,
                        location : body.location,
                        displayType : body.displayType,
                        distributor : body.distributor,
                        shelfLifeStart : body.shelfLifeStart,
                        shelfLifeEnd : body.shelfLifeEnd,
                        createdBy : createdBy,
                        editedBy : createdBy,
                    };

                    NewProductLaunchModel.create(newProductLaunch, function (err, model) {
                        if (err) {
                            return cb(err);
                        }

                        res.status(201).send(model);

                        ActivityLog.emit('reporting:new-product-launch:published', {
                            actionOriginator: userId,
                            accessRoleLevel,
                            body : model.toJSON()
                        });

                        cb(null, model);
                    });
                },

                function (model, cb) {
                    if (!files) {
                        return cb(null, model, []);
                    }

                    //TODO: change bucket from constants
                    fileHandler.uploadFile(userId, files, 'newProductLaunch', function (err, filesIds) {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, model, filesIds);
                    });
                },

                function(model, filesIds, cb) {
                    model.set('attachments', filesIds);
                    model.save(cb);
                }
            ], function(err) {
                if (err) {
                    if (!res.headersSent) {
                        next(err);
                    }

                    return logger.error(err);
                }
            });

        }

        var body;

        try {
            if (req.body.data) {
                body = JSON.parse(req.body.data);
            } else {
                body = req.body;
            }
        } catch (err) {
            return next(err);
        }

        bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.NEWPRODUCTLAUNCH, 'create', function(err, saveData) {
            if (err) {
                return next(err);
            }

            queryRun(saveData);
        });
    };

    this.getAll = function(req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var isMobile = req.isMobile;
            var filter = query.filter || {};
            var page = query.page || 1;
            var limit = query.count * 1 || parseInt(CONSTANTS.LIST_COUNT);
            var skip = (page - 1) * limit;
            var aggregateHelper;
            var filterMapper = new FilterMapper();
            var filterSearch = filter.globalSearch || '';
            var queryObject;
            var pipeLine;
            var aggregation;
            var positionFilter = {};

            var searchFieldsArray = [
                'category.name.en',
                'category.name.ar',
                'variant.name.en',
                'variant.name.ar',
                'packing',
                'country.name.en',
                'country.name.ar',
                'region.name.en',
                'region.name.ar',
                'subRegion.name.en',
                'subRegion.name.ar',
                'retailSegment.name.en',
                'retailSegment.name.ar',
                'outlet.name.en',
                'outlet.name.ar',
                'branch.name.en',
                'branch.name.ar',
                'createdBy.user.position.name.en',
                'createdBy.user.position.name.ar',
                'createdBy.user.accessRole.name.en',
                'createdBy.user.accessRole.name.ar',
                'createdBy.user.firstName.en',
                'createdBy.user.firstName.ar',
                'createdBy.user.lastName.en',
                'createdBy.user.lastName.ar'
            ];

            delete filter.globalSearch;

            queryObject = filterMapper.mapFilter({
                contentType : CONTENT_TYPES.NEWPRODUCTLAUNCH,
                filter : filter,
                personnel : personnel
            });

            aggregateHelper = new AggregationHelper($defProjection, queryObject);

            if (queryObject.position && queryObject.position.$in) {
                positionFilter = {
                    'createdBy.user.position' : queryObject.position
                };

                delete queryObject.position;
            }

            pipeLine = getAllPipeline({
                aggregateHelper : aggregateHelper,
                queryObject : queryObject,
                positionFilter : positionFilter,
                searchFieldsArray : searchFieldsArray,
                filterSearch : filterSearch,
                skip : skip,
                limit : limit,
                isMobile : isMobile
            });

            aggregation = NewProductLaunchModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse : true
            };

            aggregation.exec((err, result) => {
                if (err) {
                    return next(err);
                }

                const body = result.length ? result[0] : { data: [], total: 0 };

                body.data.forEach(element => {
                    if (element.additionalComment) {
                        element.additionalComment = {
                            en: _.unescape(element.additionalComment.en),
                            ar: _.unescape(element.additionalComment.ar),
                        };
                    }
                    if (element.location) {
                        element.location = {
                            en: _.unescape(element.location.en),
                            ar: _.unescape(element.location.ar),
                        };
                    }
                    if (element.distributor) {
                        element.distributor = {
                            en: _.unescape(element.distributor.en),
                            ar: _.unescape(element.distributor.ar),
                        };
                    }

                    if (element.brand && element.brand.name) {
                        if (typeof element.brand.name === 'string') {
                            element.brand.name = _.unescape(element.brand.name);
                        } else {
                            element.brand.name = {
                                en: _.unescape(element.brand.name.en),
                                ar: _.unescape(element.brand.name.ar),
                            };
                        }
                    }

                    if (element.variant && element.variant.name) {
                        if (typeof element.variant.name === 'string') {
                            element.variant.name = _.unescape(element.variant.name);
                        } else {
                            element.variant.name = {
                                en: _.unescape(element.variant.name.en),
                                ar: _.unescape(element.variant.name.ar),
                            };
                        }
                    }

                    if (element.price) {
                        element.price = _.unescape(element.price);
                    }

                    if (element.packing) {
                        element.packing = _.unescape(element.packing);
                    }

                    if (element.shelfLife) {
                        element.shelfLife = _.unescape(element.shelfLife);
                    }
                });

                next({
                    status: 200,
                    body,
                });
            });
        }

        queryRun(req.personnel);
    };

    function getAllPipeline(options) {
        var aggregateHelper = options.aggregateHelper;
        var queryObject = options.queryObject;
        var positionFilter = options.positionFilter;
        var searchFieldsArray = options.searchFieldsArray;
        var filterSearch = options.filterSearch;
        var skip = options.skip;
        var limit = options.limit;
        var isMobile = options.isMobile;
        var forSync = options.forSync;
        var employeeFilter = queryObject.personnel ? {'createdBy.user' : _.pick(queryObject, 'personnel').personnel} : {};
        var pipeLine = [];

        delete queryObject.personnel;

        pipeLine.push({
            $match : queryObject
        });

        pipeLine.push({
            $match : employeeFilter
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'files',
            key : 'attachments',
            addProjection : ['contentType', 'originalName', 'extension', 'createdBy', 'imageSrc']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'domains',
            key : 'country',
            isArray : false,
            addProjection : ['currency']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'domains',
            key : 'region',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'domains',
            key : 'subRegion',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'retailSegments',
            key : 'retailSegment',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'outlets',
            key : 'outlet',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'branches',
            key : 'branch',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'categories',
            key : 'category',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'displayTypes',
            key : 'displayType',
            isArray : true
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'brands',
            key : 'brand._id',
            isArray : false,
            includeSiblings : {brand : {name : 1}}
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'variants',
            key : 'variant._id',
            isArray : false,
            includeSiblings : {variant : {name : 1}}
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'origins',
            key : 'origin',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'personnels',
            key : 'createdBy.user',
            isArray : false,
            addProjection : ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
            includeSiblings : {createdBy : {date : 1}}
        }));

        if (positionFilter) {
            pipeLine.push({
                $match : positionFilter
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'accessRoles',
            key : 'createdBy.user.accessRole',
            isArray : false,
            addProjection : ['_id', 'name', 'level'],
            includeSiblings : {
                createdBy : {
                    date : 1,
                    user : {
                        _id : 1,
                        position : 1,
                        firstName : 1,
                        lastName : 1,
                        imageSrc: 1,
                    }
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'positions',
            key : 'createdBy.user.position',
            isArray : false,
            includeSiblings : {
                createdBy : {
                    date : 1,
                    user : {
                        _id : 1,
                        accessRole : 1,
                        firstName : 1,
                        lastName : 1,
                        imageSrc: 1,
                    }
                }
            }
        }));

        if (isMobile) {
            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from : 'personnels',
                key : 'editedBy.user',
                isArray : false,
                addProjection : ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
                includeSiblings : {editedBy : {date : 1}}
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from : 'accessRoles',
                key : 'editedBy.user.accessRole',
                isArray : false,
                addProjection : ['_id', 'name', 'level'],
                includeSiblings : {
                    editedBy : {
                        date : 1,
                        user : {
                            _id : 1,
                            position : 1,
                            firstName : 1,
                            lastName : 1,
                            imageSrc: 1,
                        }
                    }
                }
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from : 'positions',
                key : 'editedBy.user.position',
                isArray : false,
                includeSiblings : {
                    editedBy : {
                        date : 1,
                        user : {
                            _id : 1,
                            accessRole : 1,
                            firstName : 1,
                            lastName : 1,
                            imageSrc: 1,
                        }
                    }
                }
            }));
        }

        pipeLine.push({
            $project : aggregateHelper.getProjection({
                brand : {
                    _id : '$brand._id._id',
                    name : {$ifNull : ['$brand._id.name', '$brand.name']}
                },
                variant : {
                    _id : '$variant._id._id',
                    name : {$ifNull : ['$variant._id.name', '$variant.name']}
                }
            })
        });

        pipeLine.push({
            $project : aggregateHelper.getProjection({
                brand : {
                    _id : {$ifNull : ['$brand._id', '$brand.name']},
                    name : 1
                },
                variant : {
                    _id : {$ifNull : ['$variant._id', '$variant.name']},
                    name : 1
                },
            })
        });

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile : isMobile,
            searchFieldsArray : searchFieldsArray,
            filterSearch : filterSearch,
            skip : skip,
            limit : limit
        }));

        return pipeLine;
    }

    this.getById = function(req, res, next) {
        function queryRun() {
            var id = ObjectId(req.params.id);

            self.getByIdAggr({id : id}, function(err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
        }

        queryRun();
    };

    this.getByIdAggr = function(options, callback) {
        var aggregateHelper;
        var pipeLine = [];
        var aggregation;
        var isMobile = options.isMobile;
        var id = options.id || '';

        aggregateHelper = new AggregationHelper($defProjection);

        pipeLine.push({
            $match : {_id : id}
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'files',
            key : 'attachments',
            addProjection : ['contentType', 'originalName', 'extension', 'createdBy']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'domains',
            key : 'country',
            isArray : false,
            addProjection : ['currency']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'domains',
            key : 'region',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'domains',
            key : 'subRegion',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'retailSegments',
            key : 'retailSegment',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'outlets',
            key : 'outlet',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'branches',
            key : 'branch',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'displayTypes',
            key : 'displayType',
            isArray : true
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'categories',
            key : 'category',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'brands',
            key : 'brand._id',
            isArray : false,
            includeSiblings : {brand : {name : 1}}
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'competitorVariants',
            key : 'variant._id',
            isArray : false,
            includeSiblings : {variant : {name : 1}}
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'origins',
            key : 'origin',
            isArray : false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'personnels',
            key : 'createdBy.user',
            isArray : false,
            addProjection : ['_id', 'firstName', 'lastName'].concat(isMobile ? [] : ['position', 'accessRole']),
            includeSiblings : {createdBy : {date : 1}}
        }));

        if (!isMobile) {
            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from : 'accessRoles',
                key : 'createdBy.user.accessRole',
                isArray : false,
                addProjection : ['_id', 'name', 'level'],
                includeSiblings : {
                    createdBy : {
                        date : 1,
                        user : {
                            _id : 1,
                            position : 1,
                            firstName : 1,
                            lastName : 1
                        }
                    }
                }
            }));

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from : 'positions',
                key : 'createdBy.user.position',
                isArray : false,
                includeSiblings : {
                    createdBy : {
                        date : 1,
                        user : {
                            _id : 1,
                            accessRole : 1,
                            firstName : 1,
                            lastName : 1
                        }
                    }
                }
            }));
        }

        pipeLine.push({
            $project : aggregateHelper.getProjection({
                brand : {
                    _id : '$brand._id._id',
                    name : {$ifNull : ['$brand._id.name', '$brand.name']}
                },
                variant : {
                    _id : '$variant._id._id',
                    name : {$ifNull : ['$variant._id.name', '$variant.name']}
                }
            })
        });

        pipeLine.push({
            $project : aggregateHelper.getProjection({
                brand : {
                    _id : {$ifNull : ['$brand._id', '$brand.name']},
                    name : 1
                },
                variant : {
                    _id : {$ifNull : ['$variant._id', '$variant.name']},
                    name : 1
                },
                lastDate : {
                    $ifNull : [
                        '$editedBy.date',
                        '$createdBy.date'
                    ]
                }
            })
        });

        aggregation = NewProductLaunchModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse : true
        };

        aggregation.exec((err, result) => {
            if (err) {
                return callback(err);
            }

            const body = result.length ? result[0] : {};

            if (body.additionalComment) {
                body.additionalComment = {
                    en: _.unescape(body.additionalComment.en),
                    ar: _.unescape(body.additionalComment.ar),
                };
            }

            if (body.location) {
                body.location = {
                    en: _.unescape(body.location.en),
                    ar: _.unescape(body.location.ar),
                };
            }

            if (body.distributor) {
                body.distributor = {
                    en: _.unescape(body.distributor.en),
                    ar: _.unescape(body.distributor.ar),
                };
            }

            if (body.brand && body.brand.name) {
                if (typeof body.brand.name === 'string') {
                    body.brand.name = _.unescape(body.brand.name);
                } else {
                    body.brand.name = {
                        en: _.unescape(body.brand.name.en),
                        ar: _.unescape(body.brand.name.ar),
                    };
                }
            }

            if (body.variant && body.variant.name) {
                if (typeof body.variant.name === 'string') {
                    body.variant.name = _.unescape(body.variant.name);
                } else {
                    body.variant.name = {
                        en: _.unescape(body.variant.name.en),
                        ar: _.unescape(body.variant.name.ar),
                    };
                }
            }

            if (body.price) {
                body.price = _.unescape(body.price);
            }

            if (body.packing) {
                body.packing = _.unescape(body.packing);
            }

            if (body.shelfLife) {
                body.shelfLife = _.unescape(body.shelfLife);
            }

            callback(null, body);
        });
    };
};
module.exports = NewProductLaunch;

