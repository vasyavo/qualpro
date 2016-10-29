var Personnel = function(db, redis, event) {
    var mongoose = require('mongoose');
    var CONSTANTS = require('../constants/mainConstants');
    var ACL_CONSTANTS = require('../constants/aclRolesNames');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var access = require('../helpers/access')(db);
    var FilterMapper = require('../helpers/filterMapper');
    var async = require('async');
    var activityListSchema = mongoose.Schemas[CONTENT_TYPES.ACTIVITYLIST];
    var activityListModel = db.model(CONTENT_TYPES.ACTIVITYLIST, activityListSchema);
    var personnelSchema = mongoose.Schemas[CONTENT_TYPES.PERSONNEL];
    var PersonnelModel = db.model(CONTENT_TYPES.PERSONNEL, personnelSchema);
    var ObjectId = mongoose.Types.ObjectId;
    var AggregationHelper = require('../helpers/aggregationCreater');
    var GetImageHelper = require('../helpers/getImages');
    var getImagesHelper = new GetImageHelper(db);
    var _ = require('lodash');
    var logWriter = require('../helpers/logWriter.js');
    var MAIN_CONSTANTS = require('../constants/mainConstants.js');
    var MODULE_NAMES = require('../public/js/constants/moduleNamesForActivity.js');
    var actionKeyTemplate = _.template(MAIN_CONSTANTS.REDIS_ACTIONS_TEMPLATE_STRING);
    var $defProjection = {
        _id : 1,
        module : 1,
        actionType : 1,
        itemType : 1,
        itemDetails : 1,
        createdBy : 1,
        country : 1,
        region : 1,
        subRegion : 1,
        branch : 1,
        retailSegment : 1,
        outlet : 1,
        itemId : 1,
        itemName : 1,
        accessRoleLevel : 1,
        assignedTo : 1,
        creationDate : 1,
        personnels : 1,
        checkPersonnel : 1
    };

// 11 - virtual role level
    var levelsByLevel = {
        1 : _.values(ACL_CONSTANTS),
        2 : _(ACL_CONSTANTS).pick([
            'AREA_MANAGER',
            'AREA_IN_CHARGE',
            'SALES_MAN',
            'MERCHANDISER',
            'CASH_VAN',
            'VIRTUAL'
        ]).values().value(),
        3 : _(ACL_CONSTANTS).pick([
            'AREA_IN_CHARGE',
            'SALES_MAN',
            'MERCHANDISER',
            'MERCHANDISER',
            'CASH_VAN',
            'VIRTUAL'
        ]).values().value(),
        4 : _(ACL_CONSTANTS).pick([
            'SALES_MAN',
            'MERCHANDISER',
            'MERCHANDISER',
            'CASH_VAN',
            'VIRTUAL'
        ]).values().value(),
        5 : [ACL_CONSTANTS.VIRTUAL],
        6 : [ACL_CONSTANTS.VIRTUAL],
        7 : [ACL_CONSTANTS.VIRTUAL],
        8 : _(ACL_CONSTANTS).omit(['SUPER_ADMIN', 'COUNTRY_UPLOADER']).values().value(),
        9 : _(ACL_CONSTANTS).omit(['SUPER_ADMIN', 'COUNTRY_UPLOADER']).values().value()
    };

    function getAllPipelineActivity(options) {
        var aggregateHelper = options.aggregateHelper;
        var searchFieldsArray = options.searchFieldsArray;
        var queryObject = options.queryObject || {};
        var positionFilter = options.positionFilter;
        var filterSearch = options.filterSearch;
        var skip = options.skip;
        var limit = options.limit;
        var sort = options.sort;
        var currentUser = options.currentUser;
        var isMobile = options.isMobile;
        var forSync = options.forSync;
        var pipeLine = [];
        var regionsMathArray = {};

        var personnelQuery = [];
        var planogramQuery;
        var countryQuery;
        var questionaryQuery;
        var usersArray = [currentUser._id];
        var checkPersonnelCondition = {
            $cond : {
                if : {$eq : ['$itemType', CONTENT_TYPES.CONTRACTSSECONDARY]},
                then : 1,
                else : {
                    $cond : {
                        if : {$eq : ['$itemType', CONTENT_TYPES.CONTRACTSYEARLY]},
                        then : 1,
                        else : 0
                    }
                }
            }
        };
        var contractsQuery = {
            $or : [
                {
                    $and : [
                        {
                            checkPersonnel : 1
                        },
                        {
                            personnels : {
                                $in : usersArray
                            }
                        }
                    ]
                },
                {
                    checkPersonnel : 0
                }

            ]
        };
        var itemsPricesQuery;
        var competitorItemQuery;
        var competitorPromoQuery;
        var priceSurveyQuery;
        var selfSharesQuery;
        var newProductLaunchQuery;
        var notificationQuery;

        var afterIteMTypeQuery = options.afterIteMTypeQuery || {};

        if (currentUser.cover && currentUser.cover.length) {
            usersArray = usersArray.concat(currentUser.cover);
        }

        pipeLine.push({
            $match : queryObject
        });

        pipeLine.push({
            $match : {
                creationDate : {$gte : (new Date()).addDays(-3)}
            }
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'personnels',
            key : 'createdBy.user',
            isArray : false,
            addProjection : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
            includeSiblings : {createdBy : {date : 1}}
        }));

        pipeLine.push({
            $lookup : {
                from : 'modules',
                localField : 'module',
                foreignField : '_id',
                as : 'module'
            }
        });

        pipeLine.push({
            $project : aggregateHelper.getProjection({
                module : {$arrayElemAt : ['$module', 0]},
                checkPersonnel : checkPersonnelCondition
            })
        });

        pipeLine.push({
            $match : contractsQuery
        });

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

        pipeLine.push({
            $project : aggregateHelper.getProjection({
                createdBy : {
                    user : 1,
                    date : 1,
                    diffDate : {
                        $let : {
                            vars : {
                                dateNow : new Date(),
                                createDate : '$createdBy.date'
                            },
                            in : {$subtract : ['$$dateNow', '$$createDate']}
                        }
                    }
                }
            })
        });

        pipeLine.push({
            $project : aggregateHelper.getProjection({
                module : {
                    name : 1,
                    _id : 1
                },
                creationDate : '$createdBy.date'

            })
        });

        if (!_.includes(_(ACL_CONSTANTS).pick([
                'MASTER_ADMIN',
                'MASTER_UPLOADER'
            ]).values().value(), currentUser.accessRoleLevel)) {

            planogramQuery = [
                {
                    country : {
                        $in : currentUser.country
                    }
                }, {
                    itemType : {$eq : CONTENT_TYPES.PLANOGRAM}
                }];

            itemsPricesQuery = [
                {
                    country : {
                        $in : currentUser.country
                    }
                }, {
                    itemType : {$in : [CONTENT_TYPES.ITEM]}
                }];

            competitorItemQuery = [
                {
                    country : {
                        $in : currentUser.country
                    }
                }, {
                    itemType : {$in : [CONTENT_TYPES.COMPETITORITEM]}
                }];

            competitorPromoQuery = [
                {
                    country : {
                        $in : currentUser.country
                    }
                }, {
                    itemType : {$in : [CONTENT_TYPES.COMPETITORPROMOTION]}
                }];

            newProductLaunchQuery = [
                {
                    country : {
                        $in : currentUser.country
                    }
                }, {
                    itemType : {$in : [CONTENT_TYPES.NEWPRODUCTLAUNCH]}
                }];

            priceSurveyQuery = [
                {
                    country : {
                        $in : currentUser.country
                    }
                }, {
                    itemType : {$in : [CONTENT_TYPES.PRICESURVEY]}
                }];

            selfSharesQuery = [
                {
                    country : {
                        $in : currentUser.country
                    }
                }, {
                    itemType : {$in : [CONTENT_TYPES.SHELFSHARES]}
                }];

            questionaryQuery = [
                {
                    country : {
                        $in : currentUser.country
                    }
                }, {
                    itemType : {$eq : CONTENT_TYPES.QUESTIONNARIES}
                }];

            countryQuery = [
                {
                    country : {
                        $in : currentUser.country
                    }
                }, {
                    itemType : {$in : ['domain', 'retailSegment', 'outlet']}
                }, {
                    itemDetails : {$in : ['country', 'region', 'subRegion', '']}
                }];

            notificationQuery = [
                {
                    personnels : {
                        $in : [currentUser._id]
                    }
                }, {
                    itemType : {$eq : CONTENT_TYPES.NOTIFICATIONS}
                }];

            personnelQuery.push({
                country : {
                    $in : currentUser.country
                },
                itemType : {$eq : CONTENT_TYPES.PERSONNEL}
            });

            if (!isMobile) {
                personnelQuery.push({
                    accessRoleLevel : {
                        $in : _.union(levelsByLevel[currentUser.accessRoleLevel], [currentUser.accessRoleLevel])
                    }
                });
            }

            if (currentUser.accessRoleLevel === 5) {
                regionsMathArray = {branch : {$in : currentUser.branch || afterIteMTypeQuery.branch}};
            }
            if (currentUser.accessRoleLevel === 6) {
                regionsMathArray = {branch : {$in : currentUser.branch || afterIteMTypeQuery.branch}};
            }
            if (currentUser.accessRoleLevel === 7) {
                regionsMathArray = {branch : {$in : currentUser.branch || afterIteMTypeQuery.branch}};
            }

            if (currentUser.accessRoleLevel === 4) {
                regionsMathArray = {subRegion : {$in : currentUser.subRegion || afterIteMTypeQuery.subRegion}};
            }
            if (currentUser.accessRoleLevel === 3) {
                regionsMathArray = {region : {$in : currentUser.region || afterIteMTypeQuery.region}};
            }
            if (currentUser.accessRoleLevel === 2) {
                regionsMathArray = {country : {$in : currentUser.country || afterIteMTypeQuery.country}};
            }
            if (currentUser.accessRoleLevel === 8) {
                regionsMathArray = {country : {$in : currentUser.country || afterIteMTypeQuery.country}};
            }

            pipeLine.push({
                $match : {
                    $or : [
                        {
                            $and : [
                                regionsMathArray,
                                {
                                    accessRoleLevel : {
                                        $in : levelsByLevel[currentUser.accessRoleLevel]
                                    }
                                }, {
                                    itemType : {
                                        $in : [
                                            CONTENT_TYPES.OBJECTIVES,
                                            CONTENT_TYPES.INSTORETASKS
                                        ]
                                    }
                                }
                            ]
                        },
                        {
                            $and : [
                                regionsMathArray, {
                                    itemType : {
                                        $in : [
                                            CONTENT_TYPES.BRANDINGANDDISPLAY,
                                            CONTENT_TYPES.PROMOTIONS
                                        ]
                                    }
                                }
                            ]
                        },
                        {
                            $and : countryQuery
                        },
                        {
                            $and : questionaryQuery
                        },
                        {
                            $and : notificationQuery
                        },
                        {
                            $and : itemsPricesQuery
                        },
                        {
                            $and : competitorItemQuery
                        },
                        {
                            $and : competitorPromoQuery
                        },
                        {
                            $and : newProductLaunchQuery
                        },
                        {
                            $and : priceSurveyQuery
                        },
                        {
                            $and : selfSharesQuery
                        },
                        {
                            $and : personnelQuery
                        },
                        {
                            $and : planogramQuery
                        },
                        {
                            assignedTo : {$in : usersArray}
                        },
                        contractsQuery
                    ]
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'personnels',
            key : 'assignedTo'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'domains',
            key : 'country'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'domains',
            key : 'region'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'domains',
            key : 'subRegion'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'branches',
            key : 'branch',
            addMainProjection : ['retailSegment', 'outlet']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'retailSegments',
            key : 'retailSegment'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'outlets',
            key : 'outlet'
        }));

        pipeLine.push({
            $group : {
                _id : '$_id',
                createdBy : {$first : '$createdBy'},
                region : {$first : '$region'},
                subRegion : {$first : '$subRegion'},
                retailSegment : {$first : '$retailSegment'},
                outlet : {$first : '$outlet'},
                branch : {$first : '$branch'},
                country : {$first : '$country'},
                module : {$first : '$module'},
                creationDate : {$first : '$creationDate'},
                accessRoleLevel : {$first : '$accessRoleLevel'},
                actionType : {$first : '$actionType'},
                assignedTo : {$first : '$assignedTo'},
                itemDetails : {$first : '$itemDetails'},
                itemId : {$first : '$itemId'},
                itemName : {$first : '$itemName'},
                itemType : {$first : '$itemType'}
            }
        });

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile : isMobile,
            searchFieldsArray : searchFieldsArray,
            filterSearch : filterSearch,
            skip : skip,
            limit : limit,
            sort : sort
        }));

        return pipeLine;
    }

    function getCoveredUsers(userObject, waterFallCb) {
        PersonnelModel
            .find({'vacation.cover' : userObject._id}, {_id : 1})
            .lean()
            .exec(function(err, result) {
                if (err) {
                    return waterFallCb(err);
                }

                userObject.cover = _.map(result, function(el) {
                    return el._id;
                });

                return waterFallCb(null, userObject);
            });
    }

    function getUserLocationsAndLevel(userId, waterFallCb) {

        var aggregation = PersonnelModel.aggregate([
            {
                $match : {_id : ObjectId(userId)}
            },
            {
                $project : {
                    country : 1,
                    region : 1,
                    subRegion : 1,
                    branch : 1,
                    accessRole : 1,
                    beforeAccess : 1
                }
            }, {
                $lookup : {
                    from : 'accessRoles',
                    localField : 'accessRole',
                    foreignField : '_id',
                    as : 'accessRole'
                }
            }, {
                $project : {
                    country : 1,
                    region : 1,
                    subRegion : 1,
                    branch : 1,
                    beforeAccess : 1,
                    accessRoleLevel : {'$arrayElemAt' : ['$accessRole.level', 0]}
                }
            }
        ]);

        aggregation.exec(function(err, result) {
            var error;
            if (err) {
                return waterFallCb(err);
            }

            if (!result[0]) {
                error = new Error();
                error.message = 'user not found';
                return waterFallCb(error);
            }
            waterFallCb(null, result[0]);

        });

    }

    function getUserInfo(userId, cb) {
        var waterFallTasks = [];

        waterFallTasks.push(
            async.apply(getUserLocationsAndLevel, userId)
        );

        waterFallTasks.push(getCoveredUsers);

        async.waterfall(waterFallTasks, function(err, result) {
            if (err) {
                return cb(err);
            }

            cb(null, result);
        });
    }

    this.getBadge = function(req, res, next) {
        function queryRun(activity) {
            var userId = req.session.uId;

            var actionKey = actionKeyTemplate({
                userId : userId,
                moduleId : 'alalali'
            });

            redis.cacheStore.readFromStorage(actionKey, function(err, number) {
                if (err) {
                    return next(err);
                }

                if (!number) {
                    number = 0;
                }
                res.status(200).send({badge : number});
            });
        }

        access.getReadAccess(req, ACL_MODULES.ACTIVITY_LIST, function(err, allowed, personnel) {
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

    this.deleteBadge = function(req, res, next) {
        function queryRun(activity) {
            var userId = req.session.uId;
            var actionKey = actionKeyTemplate({
                userId : userId,
                moduleId : 'alalali'
            });

            redis.cacheStore.removeFromStorage(actionKey);

            res.status(200).send({message : 'OK Delete'});
        }

        access.getReadAccess(req, ACL_MODULES.ACTIVITY_LIST, function(err, allowed, personnel) {
            var error;
            if (err) {
                return next(err);
            }
            if (!allowed) {
                error = new Error();
                error.status = 403;

                return next(error);
            }

            queryRun(personnel);
        });
    };

    this.getAllForSync = function(req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var isMobile = req.isMobile;
            var filterMapper = new FilterMapper();
            var filter = query.filter || {};
            var lastLogOut = new Date(query.lastLogOut);
            var key;
            var aggregation;
            var pipeLine;
            var sort = {
                'createdBy.date' : -1
            };

            var queryObject = filterMapper.mapFilter({
                contentType : CONTENT_TYPES.ACTIVITYLIST,
                filter : filter,
                personnel : personnel
            });

            var afterIteMTypeQuery = {
                region : queryObject.region,
                subRegion : queryObject.subRegion,
                retailSegment : queryObject.retailSegment,
                outlet : queryObject.outlet,
                branch : queryObject.branch
            };

            delete queryObject.region;
            delete queryObject.subRegion;
            delete queryObject.retailSegment;
            delete queryObject.outlet;
            delete queryObject.branch;

            var aggregateHelper = new AggregationHelper($defProjection, queryObject);

            delete queryObject.archived;

            // aggregateHelper.setSyncQuery(queryObject, lastLogOut);
            queryObject = {
                'createdBy.date' : {$gte : lastLogOut}
            };

            for (key in sort) {
                sort[key] = parseInt(sort[key]);
            }

            getUserInfo(req.session.uId, function(err, currentUser) {

                pipeLine = getAllPipelineActivity({
                    queryObject : queryObject,
                    aggregateHelper : aggregateHelper,
                    sort : sort,
                    isMobile : isMobile,
                    currentUser : currentUser,
                    afterIteMTypeQuery : afterIteMTypeQuery,
                    forSync : true
                });

                aggregation = activityListModel.aggregate(pipeLine);

                aggregation.exec(function(err, response) {
                    var idsPersonnel = [];
                    var options = {
                        data : {}
                    };
                    if (err) {
                        return next(err);
                    }
                    response = response.length ? response[0] : {
                        data : [],
                        total : 0
                    };

                    if (!response.data.length) {
                        return next({
                            status : 200,
                            body : response
                        });
                    }

                    _.map(response.data, function(model) {
                        idsPersonnel.push(model.createdBy.user._id);
                    });

                    idsPersonnel = _.uniqBy(idsPersonnel, 'id');
                    options.data[CONTENT_TYPES.PERSONNEL] = idsPersonnel;

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
                        setOptions.fields = fieldNames;

                        getImagesHelper.setIntoResult(setOptions, function(response) {
                            _.map(response.data, function(element) {
                                element.module = MODULE_NAMES[element.module._id];
                            });

                            next({
                                status : 200,
                                body : response
                            });
                        })
                    });
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.PERSONNEL, function(err, allowed, personnel) {
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

    this.getAll = function(req, res, next) {
        function queryRun(activity) {
            var isMobile = req.isMobile;
            var query = req.query;
            var page = query.page || 1;
            var limit = parseInt(query.count) || parseInt(CONSTANTS.LIST_COUNT);
            var skip = (page - 1) * limit;
            var supervisorFilter = query.supervisorFilter;
            var positionFilter = {};

            var filterMapper = new FilterMapper();
            var filter = query.filter || {};
            var filterSearch = filter.globalSearch || '';

            var queryObject;
            var queryObjectAfterLookup = {};
            var key;
            var aggregation;
            var pipeLine;
            var sort = {
                'createdBy.date' : -1
            };

            var aggregateHelper;
            var searchFieldsArray = [
                'createdBy.user.firstName.en',
                'createdBy.user.firstName.ar',
                'createdBy.user.lastName.en',
                'createdBy.user.lastName.ar',
                'module.name.ar',
                'module.name.en',
                'type'
            ];

            if (filter.module) {
                if (filter.module.values) {
                    filter.module.values[0] = parseInt(filter.module.values[0], 10);
                }
            }

            delete filter.globalSearch;

            queryObject = filterMapper.mapFilter({
                contentType : CONTENT_TYPES.ACTIVITYLIST,
                filter : filter,
                personnel : activity
            });

            delete  queryObject.archived;

            if (queryObject.position && queryObject.position.$in) {
                positionFilter = {'createdBy.user.position' : queryObject.position};

                delete queryObject.position;
            }

            for (key in sort) {
                sort[key] = parseInt(sort[key]);
            }

            getUserInfo(req.session.uId, function(err, currentUser) {

                aggregateHelper = new AggregationHelper($defProjection, queryObject);

                pipeLine = getAllPipelineActivity({
                    queryObject : queryObject,
                    aggregateHelper : aggregateHelper,
                    searchFieldsArray : searchFieldsArray,
                    filterSearch : filterSearch,
                    limit : limit,
                    skip : skip,
                    sort : sort,
                    currentUser : currentUser,
                    positionFilter : positionFilter,
                    isMobile : isMobile
                });

                aggregation = activityListModel.aggregate(pipeLine);

                aggregation.exec(function(err, response) {
                    var idsPersonnel = [];
                    var options = {
                        data : {}
                    };
                    if (err) {
                        return next(err);
                    }
                    response = response.length ? response[0] : {
                        data : [],
                        total : 0
                    };

                    if (!response.data.length) {
                        return next({
                            status : 200,
                            body : response
                        });
                    }

                    _.map(response.data, function(model) {
                        idsPersonnel.push(model.createdBy.user._id);
                    });

                    idsPersonnel = _.uniqBy(idsPersonnel, 'id');
                    options.data[CONTENT_TYPES.PERSONNEL] = idsPersonnel;

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
                        setOptions.fields = fieldNames;

                        getImagesHelper.setIntoResult(setOptions, function(response) {
                            _.map(response.data, function(element) {
                                element.module = MODULE_NAMES[element.module._id];
                            });

                            next({
                                status : 200,
                                body : response
                            });
                        })
                    });
                });
            });

        }

        access.getReadAccess(req, ACL_MODULES.ACTIVITY_LIST, function(err, allowed, personnel) {
            var error;
            if (err) {
                return next(err);
            }
            if (!allowed) {
                error = new Error();
                error.status = 403;

                return next(error);
            }

            queryRun(personnel);
        });

    };
};

module.exports = Personnel;
