var NewProductLaunch = function(db, redis, event) {
    var async = require('async');
    var _ = require('lodash');
    var mongoose = require('mongoose');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var CONSTANTS = require('../constants/mainConstants');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var GetImagesHelper = require('../helpers/getImages');
    var getImagesHelper = new GetImagesHelper(db);
    var NewProductLaunchModel = require('./../types/newProductLaunch/model');
    var FileHandler = require('../handlers/file');
    var fileHandler = new FileHandler(db);
    var access = require('../helpers/access')(db);
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
        function queryRun(body) {
            var files = req.files;
            var isMobile = req.isMobile;
            var session = req.session;
            var userId = session.uId;
            var model;
            var newProductLaunch;

            async.waterfall([

                function(cb) {
                    if (!files) {
                        return cb(null, []);
                    }

                    //TODO: change bucket from constants
                    fileHandler.uploadFile(userId, files, 'newProductLaunch', function(err, filesIds) {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, filesIds);
                    });
                },

                function(filesIds, cb) {
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
                        location : body.location,
                        attachments : filesIds,
                        displayType : body.displayType,
                        distributor : body.distributor,
                        shelfLifeStart : body.shelfLifeStart,
                        shelfLifeEnd : body.shelfLifeEnd,
                        createdBy : createdBy,
                        editedBy : createdBy,
                    };

                    model = new NewProductLaunchModel(newProductLaunch);
                    model.save(function(err, model) {
                        if (err) {
                            return cb(err);
                        }

                        event.emit('activityChange', {
                            module : ACL_MODULES.NEW_PRODUCT_LAUNCH,
                            actionType : ACTIVITY_TYPES.CREATED,
                            createdBy : model.get('createdBy'),
                            itemId : model._id,
                            itemType : CONTENT_TYPES.NEWPRODUCTLAUNCH
                        });

                        cb(null, model);
                    });
                },

                function(newProductLaunchModel, cb) {
                    var id = newProductLaunchModel.get('_id');

                    self.getByIdAggr({
                        id : id,
                        isMobile : isMobile
                    }, cb);
                }

            ], function(err, result) {
                if (err) {
                    return next(err);
                }

                res.status(201).send(result);
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

            aggregation.exec(function(err, response) {
                var options = {
                    data : {}
                };
                var personnelIds = [];
                var fileIds = [];

                if (err) {
                    return next(err);
                }

                response = response && response[0] ? response[0] : {
                    data : [],
                    total : 0
                };

                if (!response.data.length) {
                    return next({
                        status : 200,
                        body : response
                    });
                }

                response.data = _.map(response.data, function(element) {
                    if (element.additionalComment) {
                        element.additionalComment = {
                            en : _.unescape(element.additionalComment.en),
                            ar : _.unescape(element.additionalComment.ar)
                        };
                    }
                    if (element.location) {
                        element.location = {
                            en : _.unescape(element.location.en),
                            ar : _.unescape(element.location.ar)
                        };
                    }
                    if (element.distributor) {
                        element.distributor = {
                            en : _.unescape(element.distributor.en),
                            ar : _.unescape(element.distributor.ar)
                        };
                    }
                    if (element.brand && element.brand.name) {
                        if (typeof element.brand.name === 'string') {
                            element.brand.name = _.unescape(element.brand.name);
                        } else {
                            element.brand.name = {
                                en : _.unescape(element.brand.name.en),
                                ar : _.unescape(element.brand.name.ar)
                            };
                        }
                    }
                    if (element.variant && element.variant.name) {
                        if (typeof element.variant.name === 'string') {
                            element.variant.name = _.unescape(element.variant.name);
                        } else {
                            element.variant.name = {
                                en : _.unescape(element.variant.name.en),
                                ar : _.unescape(element.variant.name.ar)
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

                    personnelIds.push(element.createdBy.user._id);
                    fileIds = _.union(fileIds, _.map(element.attachments, '_id'));

                    return element;
                });

                personnelIds = _.uniqBy(personnelIds, 'id');

                options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;
                options.data[CONTENT_TYPES.FILES] = fileIds;

                getImagesHelper.getImages(options, function(err, result) {
                    var fieldNames = {};
                    var setOptions;
                    if (err) {
                        return next(err);
                    }

                    setOptions = {
                        response : response,
                        imgsObject : result
                    };
                    fieldNames[CONTENT_TYPES.PERSONNEL] = ['createdBy.user'];
                    fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
                    setOptions.fields = fieldNames;

                    getImagesHelper.setIntoResult(setOptions, function(response) {
                        next({
                            status : 200,
                            body : response
                        });
                    })
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
            addProjection : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
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

        if (isMobile) {
            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from : 'personnels',
                key : 'editedBy.user',
                isArray : false,
                addProjection : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
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
                            lastName : 1
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
                /*lastDate: {
                 $ifNull: [
                 '$editedBy.date',
                 '$createdBy.date'
                 ]
                 }*/
            })
        });

        /* if (!forSync) {
         pipeLine.push({
         $sort: {
         lastDate: -1
         }
         });

         pipeLine.push({
         $match: aggregateHelper.getSearchMatch(searchFieldsArray, filterSearch)
         });

         pipeLine = _.union(pipeLine, aggregateHelper.setTotal());
         }

         if (limit && limit !== -1) {
         pipeLine.push({
         $skip: skip
         });

         pipeLine.push({
         $limit: limit
         });
         }

         if (!forSync) {
         pipeLine = _.union(pipeLine, aggregateHelper.groupForUi());
         }*/

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

        aggregation.exec(function(err, response) {
            var options = {
                data : {}
            };
            var personnelIds = [];
            var fileIds;

            if (err) {
                return callback(err);
            }

            if (!response.length) {
                return callback(null, {});
            }

            response = response[0];

            if (response.additionalComment) {
                response.additionalComment = {
                    en : _.unescape(response.additionalComment.en),
                    ar : _.unescape(response.additionalComment.ar)
                };
            }
            if (response.location) {
                response.location = {
                    en : _.unescape(response.location.en),
                    ar : _.unescape(response.location.ar)
                };
            }
            if (response.distributor) {
                response.distributor = {
                    en : _.unescape(response.distributor.en),
                    ar : _.unescape(response.distributor.ar)
                };
            }
            if (response.brand && response.brand.name) {
                if (typeof response.brand.name === 'string') {
                    response.brand.name = _.unescape(response.brand.name);
                } else {
                    response.brand.name = {
                        en : _.unescape(response.brand.name.en),
                        ar : _.unescape(response.brand.name.ar)
                    };
                }
            }
            if (response.variant && response.variant.name) {
                if (typeof response.variant.name === 'string') {
                    response.variant.name = _.unescape(response.variant.name);
                } else {
                    response.variant.name = {
                        en : _.unescape(response.variant.name.en),
                        ar : _.unescape(response.variant.name.ar)
                    };
                }
            }
            if (response.price) {
                response.price = _.unescape(response.price);
            }
            if (response.packing) {
                response.packing = _.unescape(response.packing);
            }
            if (response.shelfLife) {
                response.shelfLife = _.unescape(response.shelfLife);
            }

            personnelIds.push(response.createdBy.user._id);
            fileIds = _.map(response.attachments, '_id');

            options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;
            options.data[CONTENT_TYPES.FILES] = fileIds;

            getImagesHelper.getImages(options, function(err, result) {
                var fieldNames = {};
                var setOptions;
                if (err) {
                    return callback(err);
                }

                setOptions = {
                    response : response,
                    imgsObject : result
                };
                fieldNames[CONTENT_TYPES.PERSONNEL] = ['createdBy.user'];
                fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
                setOptions.fields = fieldNames;

                getImagesHelper.setIntoResult(setOptions, function(response) {
                    callback(null, response);
                })
            });
        });
    };
};
module.exports = NewProductLaunch;

