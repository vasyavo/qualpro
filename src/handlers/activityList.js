const redis = require('./../helpers/redisClient');

var Personnel = function() {
    var mongoose = require('mongoose');
    var CONSTANTS = require('../constants/mainConstants');
    var OTHER_CONSTANTS = require('../public/js/constants/otherConstants');
    var ACL_CONSTANTS = require('../constants/aclRolesNames');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var access = require('../helpers/access')();
    var FilterMapper = require('../helpers/filterMapper');
    var async = require('async');
    const ActivityListModel = require('./../types/activityList/model');
    const PersonnelModel = require('./../types/personnel/model');
    var ObjectId = mongoose.Types.ObjectId;
    var AggregationHelper = require('../helpers/aggregationCreater');
    var GetImageHelper = require('../helpers/getImages');
    var getImagesHelper = new GetImageHelper();
    var _ = require('lodash');
    var logWriter = require('../helpers/logWriter.js');
    var MAIN_CONSTANTS = require('../constants/mainConstants.js');
    var MODULE_NAMES = require('../public/js/constants/moduleNamesForActivity.js');
    const redisActionPrefix = MAIN_CONSTANTS.REDIS_ACTIONS_TEMPLATE_STRING;
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
        9 : _(ACL_CONSTANTS).omit(['SUPER_ADMIN', 'COUNTRY_UPLOADER']).values().value(),
        10 : [ACL_CONSTANTS.VIRTUAL]
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
            $and: [{
                $or : [
                    {
                        $and : [
                            {
                                checkPersonnel : 1
                            }, {
                                personnels : {
                                    $in : usersArray
                                }
                            }
                        ]
                    }, {
                        checkPersonnel : 0,
                    }
                ]
            }]
        };
        var itemsPricesQuery;
        var competitorItemQuery;
        var competitorPromoQuery;
        var priceSurveyQuery;
        var selfSharesQuery;
        var newProductLaunchQuery;
        var notificationQuery;

        var afterIteMTypeQuery = options.afterIteMTypeQuery || {};

        var allowedPersonnelTaskItemTypes = [
            CONTENT_TYPES.OBJECTIVES,
            CONTENT_TYPES.INSTORETASKS
        ];

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
                'MASTER_UPLOADER',
                'TRADE_MARKETER'
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

            if (currentUser.accessRoleLevel === ACL_CONSTANTS.TRADE_MARKETER) {
                regionsMathArray = {branch : {$in : currentUser.branch || afterIteMTypeQuery.branch}};

                // prevent send activity with type === objective for trade marketer
                allowedPersonnelTaskItemTypes = [
                    CONTENT_TYPES.INSTORETASKS
                ];
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
                                        $in : allowedPersonnelTaskItemTypes
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
                        }
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
            $lookup: {
                from: 'objectives',
                localField: 'itemId',
                foreignField: '_id',
                as: 'itemModel'
            }
        });

        pipeLine.push({
            $unwind: {
                path                      : '$itemModel',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeLine.push({
            $match: {
                'itemModel.status': {
                    $ne: OTHER_CONSTANTS.OBJECTIVE_STATUSES.DRAFT
                }
            }
        });

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
            if (err) {
                return waterFallCb(err);
            }

            if (!result[0]) {
                const error = new Error();
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

    this.getBadge = (req, res, next) => {
        const queryRun = (callback) => {
            const userId = req.session.uId;
            const actionKey = `${redisActionPrefix}:${userId}`;

            redis.cacheStore.readFromStorage(actionKey, (err, number) => {
                if (err) {
                    return next(err);
                }

                if (!number) {
                    number = 0;
                }

                callback(null, {badge : number});
            });
        };

        async.waterfall([

            (cb) => {
                access.getReadAccess(req, ACL_MODULES.ACTIVITY_LIST, cb);
            },

            (allowed, personnel, cb) => {
                queryRun(cb);
            }

        ], (err, body) => {
            if (err) {
                return next(err);
            }

            res.status(200).send(body);
        });
    };

    this.deleteBadge = (req, res, next) => {
        const queryRun = (callback) => {
            const userId = req.session.uId;
            const actionKey = `${redisActionPrefix}:${userId}`;

            redis.cacheStore.removeFromStorage(actionKey);

            callback(null, {
                message : 'OK Delete'
            });
        };

        async.waterfall([

            (cb) => {
                access.getReadAccess(req, ACL_MODULES.ACTIVITY_LIST, cb);
            },

            (allowed, personnel, cb) => {
                queryRun(cb);
            }

        ], (err, body) => {
            if (err) {
                return next(err);
            }

            res.status(200).send(body);
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

                aggregation = ActivityListModel.aggregate(pipeLine);

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

        async.waterfall([

            async.apply(access.getReadAccess, req, ACL_MODULES.PERSONNEL),

            (allowed, personnel) => {
                queryRun(personnel);
            }

        ]);
    };

    this.getAll = function(req, res, next) {
        function queryRun(activity, callback) {
            const isMobile = req.isMobile;
            const query = req.query;
            const page = query.page || 1;
            const limit = parseInt(query.count) || parseInt(CONSTANTS.LIST_COUNT);
            const skip = (page - 1) * limit;
            const uid = req.session.uId;
            const filterMapper = new FilterMapper();
            const filter = query.filter || {};
            const filterSearch = filter.globalSearch || '';
            const sort = {
                'createdBy.date' : -1
            };

            const searchFieldsArray = [
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

            const queryObject = filterMapper.mapFilter({
                contentType : CONTENT_TYPES.ACTIVITYLIST,
                filter : filter,
                personnel : activity
            });

            delete  queryObject.archived;

            const positionFilter = {};

            if (queryObject.position && queryObject.position.$in) {
                positionFilter['createdBy.user.position'] = queryObject.position

                delete queryObject.position;
            }

            for (let key in sort) {
                sort[key] = parseInt(sort[key]);
            }

            async.waterfall([

                async.apply(getUserInfo, uid),

                (currentUser, cb) => {
                    const aggregateHelper = new AggregationHelper($defProjection, queryObject);
                    const pipeLine = getAllPipelineActivity({
                        queryObject,
                        aggregateHelper,
                        searchFieldsArray,
                        filterSearch,
                        limit,
                        skip,
                        sort,
                        currentUser,
                        positionFilter,
                        isMobile
                    });

                    const aggregation = ActivityListModel.aggregate(pipeLine);

                    aggregation.exec(cb);
                },

                (response, cb) => {
                    let idsPersonnel = [];

                    response = response.length ?
                        response[0] : {
                            data : [],
                            total : 0
                        };

                    if (!response.data.length) {
                        return next({
                            status : 200,
                            body : response
                        });
                    }

                    _.forEach(response.data, (model) => {
                        idsPersonnel.push(model.createdBy.user._id);
                    });


                    const options = {
                        data : {
                            [CONTENT_TYPES.PERSONNEL]: _.uniqBy(idsPersonnel, 'id')
                        }
                    };

                    cb(null, {
                        response,
                        options
                    });
                },

                (data, cb) => {
                    getImagesHelper.getImages(data.options, (err, result) => {
                        cb(err, {
                            response: data.response,
                            result
                        })
                    });
                },

                (data, cb) => {
                    const options = {
                        response: data.response,
                        imgsObject: data.result,
                        fields: {
                            [CONTENT_TYPES.PERSONNEL]: ['createdBy.user']
                        }
                    };

                    getImagesHelper.setIntoResult(options, (response) => {
                        cb(null, response);
                    });
                },

                (response, cb) => {
                    response.data = response.data.map((item) => {
                        item.module = MODULE_NAMES[item.module._id];

                        return item;
                    });

                    cb(null, response);
                }

            ], callback);
        }

        async.waterfall([

            async.apply(access.getReadAccess, req, ACL_MODULES.ACTIVITY_LIST),

            (allowed, personnel, cb) => {
                queryRun(personnel, cb);
            }

        ], (err, body) => {
            if (err) {
                return next(err);
            }

            return next({
                status: 200,
                body
            });
        });
    };
};

module.exports = Personnel;
