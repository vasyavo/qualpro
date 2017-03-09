const {
    rehydrate,
    dispatch,
} = require('./../stories/badges/store');

const cleanupBadges = require('./../stories/badges/actions').cleanup;
const PubNubClient = require('./../stories/push-notifications/utils/pubnub');
const mongoose = require('mongoose');
const CONSTANTS = require('../constants/mainConstants');
const OTHER_CONSTANTS = require('../public/js/constants/otherConstants');
const ACL_CONSTANTS = require('../constants/aclRolesNames');
const ACL_MODULES = require('../constants/aclModulesNames');
const CONTENT_TYPES = require('../public/js/constants/contentType');
const access = require('../helpers/access')();
const FilterMapper = require('../helpers/filterMapper');
const async = require('async');
const ActivityListModel = require('./../types/activityList/model');
const PersonnelModel = require('./../types/personnel/model');
const AggregationHelper = require('../helpers/aggregationCreater');
const GetImageHelper = require('../helpers/getImages');
const _ = require('lodash');
const MODULE_NAMES = require('../public/js/constants/moduleNamesForActivity');

const ObjectId = mongoose.Types.ObjectId;

const Personnel = function() {
    const getImagesHelper = new GetImageHelper();
    const $defProjection = {
        _id: 1,
        module: 1,
        actionType: 1,
        itemType: 1,
        itemDetails: 1,
        createdBy: 1,
        country: 1,
        region: 1,
        subRegion: 1,
        branch: 1,
        retailSegment: 1,
        outlet: 1,
        itemId: 1,
        itemName: 1,
        accessRoleLevel: 1,
        assignedTo: 1,
        creationDate: 1,
        personnels: 1,
        checkPersonnel: 1,
    };

// 11 - virtual role level
    const levelsByLevel = {
        1: _.values(ACL_CONSTANTS),
        2: _(ACL_CONSTANTS).pick([
            'AREA_MANAGER',
            'AREA_IN_CHARGE',
            'SALES_MAN',
            'MERCHANDISER',
            'CASH_VAN',
            'VIRTUAL',
        ]).values().value(),
        3: _(ACL_CONSTANTS).pick([
            'AREA_IN_CHARGE',
            'SALES_MAN',
            'MERCHANDISER',
            'MERCHANDISER',
            'CASH_VAN',
            'VIRTUAL',
        ]).values().value(),
        4: _(ACL_CONSTANTS).pick([
            'SALES_MAN',
            'MERCHANDISER',
            'MERCHANDISER',
            'CASH_VAN',
            'VIRTUAL',
        ]).values().value(),
        5: [ACL_CONSTANTS.VIRTUAL],
        6: [ACL_CONSTANTS.VIRTUAL],
        7: [ACL_CONSTANTS.VIRTUAL],
        8: _(ACL_CONSTANTS).omit(['SUPER_ADMIN', 'COUNTRY_UPLOADER']).values().value(),
        9: _(ACL_CONSTANTS).omit(['SUPER_ADMIN', 'COUNTRY_UPLOADER']).values().value(),
        10: [ACL_CONSTANTS.VIRTUAL],
    };

    function getAllPipelineActivity(options) {
        const {
            aggregateHelper,
            searchFieldsArray,
            queryObject,
            positionFilter,
            filterSearch,
            limit,
            skip,
            sort,
            isMobile,
            currentUser,
            afterIteMTypeQuery = {},
        } = options;

        let pipeLine = [];
        let regionsMathArray = {};
        let usersArray = [currentUser._id];

        if (currentUser.cover && currentUser.cover.length) {
            usersArray = usersArray.concat(currentUser.cover);
        }

        pipeLine.push({
            $match: Object.assign({}, queryObject, {
                'createdBy.date': { $gte: (new Date()).addDays(-3) },
                personnels: currentUser._id
            }),
        });

        pipeLine.push({
            $lookup: {
                from: 'personnels',
                localField: 'createdBy.user',
                foreignField: '_id',
                as: 'createdBy.user',
            },
        });

        pipeLine.push({
            $addFields: {
                createdBy: {
                    date: 1,
                    user: {
                        $let: {
                            vars: {
                                createdByUser: {
                                    $arrayElemAt: ['$createdBy.user', 0],
                                },
                            },
                            in: {
                                _id: '$$createdByUser._id',
                                name: '$$createdByUser.name',
                                firstName: '$$createdByUser.firstName',
                                lastName: '$$createdByUser.lastName',
                                position: '$$createdByUser.position',
                                accessRole: '$$createdByUser.accessRole',
                            },
                        },
                    },
                },
            },
        });

        pipeLine.push({
            $lookup: {
                from: 'modules',
                localField: 'module',
                foreignField: '_id',
                as: 'module',
            },
        });

        pipeLine.push({
            $addFields: {
                module: { $arrayElemAt: ['$module', 0] },
                checkPersonnel: {
                    $cond: {
                        if: {
                            $or: [
                                {
                                    $eq: ['$itemType', CONTENT_TYPES.CONTRACTSSECONDARY],
                                },
                                {
                                    $eq: ['$itemType', CONTENT_TYPES.CONTRACTSYEARLY],
                                },
                            ],
                        },
                        then: 1,
                        else: 0,
                    },
                },
            },
        });

        pipeLine.push({
            $match: {
                $or: [
                    {
                        $and: [
                            {
                                checkPersonnel: 1,
                            }, {
                                personnels: {
                                    $in: usersArray,
                                },
                            },
                        ],
                    }, {
                        checkPersonnel: 0,
                    },
                ],
            },
        });

        if (positionFilter) {
            pipeLine.push({
                $match: positionFilter,
            });
        }

        pipeLine.push({
            $lookup: {
                from: 'accessRoles',
                localField: 'createdBy.user.accessRole',
                foreignField: '_id',
                as: 'createdBy.user.accessRole',
            },
        });

        pipeLine.push({
            $addFields: {
                createdBy: {
                    user: {
                        accessRole: {
                            $let: {
                                vars: {
                                    createdByUserAccessRole: {
                                        $arrayElemAt: ['$createdBy.user.accessRole', 0],
                                    },
                                },
                                in: {
                                    _id: '$$createdByUserAccessRole._id',
                                    name: '$$createdByUserAccessRole.name',
                                    level: '$$createdByUserAccessRole.level',
                                },
                            },
                        },
                        _id: 1,
                        position: 1,
                        firstName: 1,
                        lastName: 1,
                    },
                    date: 1,
                },
            },
        });

        pipeLine.push({
            $lookup: {
                from: 'positions',
                localField: 'createdBy.user.position',
                foreignField: '_id',
                as: 'createdBy.user.position',
            },
        });

        pipeLine.push({
            $addFields: {
                createdBy: {
                    user: {
                        position: {
                            $let: {
                                vars: {
                                    createdByUserPosition: {
                                        $arrayElemAt: ['$createdBy.user.position', 0],
                                    },
                                },
                                in: {
                                    _id: '$$createdByUserPosition._id',
                                    name: '$$createdByUserPosition.name',
                                },
                            },
                        },
                        _id: 1,
                        accessRole: 1,
                        firstName: 1,
                        lastName: 1,
                    },
                    date: 1,
                },
            },
        });

        pipeLine.push({
            $addFields: {
                createdBy: {
                    user: 1,
                    date: 1,
                    diffDate: {
                        $let: {
                            vars: {
                                dateNow: new Date(),
                                createDate: '$createdBy.date',
                            },
                            in: { $subtract: ['$$dateNow', '$$createDate'] },
                        },
                    },
                },
            },
        });

        pipeLine.push({
            $addFields: {
                module: {
                    name: 1,
                    _id: 1,
                },
                creationDate: '$createdBy.date',
            },
        });

        if ([ACL_CONSTANTS.MASTER_ADMIN, ACL_CONSTANTS.MASTER_UPLOADER, ACL_CONSTANTS.TRADE_MARKETER].indexOf(currentUser.accessRoleLevel) === -1) {
            const $match = {
                $or: [],
            };
            const modulesForFilterByCountryAndType = [
                CONTENT_TYPES.PLANOGRAM,
                CONTENT_TYPES.ITEM,
                CONTENT_TYPES.COMPETITORITEM,
                CONTENT_TYPES.COMPETITORPROMOTION,
                CONTENT_TYPES.NEWPRODUCTLAUNCH,
                CONTENT_TYPES.PRICESURVEY,
                CONTENT_TYPES.SHELFSHARES,
                CONTENT_TYPES.QUESTIONNARIES,
            ];
            const personnelQuery = [];

            modulesForFilterByCountryAndType.forEach((module) => {
                $match.$or.push({
                    $and: [
                        {
                            country: {
                                $in: currentUser.country,
                            },
                        },
                        {
                            itemType: { $eq: module },
                        },
                    ],
                });
            });

            $match.$or.push({
                $and: [
                    {
                        country: {
                            $in: currentUser.country,
                        },
                    },
                    {
                        itemType: { $in: ['domain', 'retailSegment', 'outlet'] },
                    },
                    {
                        itemDetails: { $in: ['country', 'region', 'subRegion', ''] },
                    },
                ],
            });

            $match.$or.push({
                $and: [
                    {
                        personnels: {
                            $in: [currentUser._id],
                        },
                    },
                    {
                        itemType: { $eq: CONTENT_TYPES.NOTIFICATIONS },
                    },
                ],
            });

            personnelQuery.push({
                country: {
                    $in: currentUser.country,
                },
                itemType: { $eq: CONTENT_TYPES.PERSONNEL },
            });

            if (!isMobile) {
                personnelQuery.push({
                    accessRoleLevel: {
                        $in: _.union(levelsByLevel[currentUser.accessRoleLevel], [currentUser.accessRoleLevel]),
                    },
                });
            }

            $match.$or.push({
                $and: personnelQuery,
            });

            if (currentUser.accessRoleLevel === MODULE_NAMES.SALES_MAN) {
                regionsMathArray = { branch: { $in: currentUser.branch || afterIteMTypeQuery.branch } };
            }
            if (currentUser.accessRoleLevel === MODULE_NAMES.MERCHANDISER) {
                regionsMathArray = { branch: { $in: currentUser.branch || afterIteMTypeQuery.branch } };
            }
            if (currentUser.accessRoleLevel === MODULE_NAMES.CASH_VAN) {
                regionsMathArray = { branch: { $in: currentUser.branch || afterIteMTypeQuery.branch } };
            }

            if (currentUser.accessRoleLevel === MODULE_NAMES.AREA_IN_CHARGE) {
                regionsMathArray = { subRegion: { $in: currentUser.subRegion || afterIteMTypeQuery.subRegion } };
            }
            if (currentUser.accessRoleLevel === MODULE_NAMES.AREA_MANAGER) {
                regionsMathArray = { region: { $in: currentUser.region || afterIteMTypeQuery.region } };
            }
            if (currentUser.accessRoleLevel === MODULE_NAMES.COUNTRY_ADMIN) {
                regionsMathArray = { country: { $in: currentUser.country || afterIteMTypeQuery.country } };
            }

            $match.$or.push({
                $and: [
                    regionsMathArray,
                    {
                        accessRoleLevel: {
                            $in: levelsByLevel[currentUser.accessRoleLevel],
                        },
                    },
                    {
                        itemType: {
                            $in: [CONTENT_TYPES.OBJECTIVES, CONTENT_TYPES.INSTORETASKS],
                        },
                        {
                            $and : [
                                regionsMathArray, {
                                    itemType : {
                                        $in : [
                                            CONTENT_TYPES.MARKETING_CAMPAIGN,
                                            CONTENT_TYPES.PROMOTIONS
                                        ]
                                    }
                                }
                            ]
                        },
                    },
                ],
            });

            $match.$or.push({
                assignedTo: { $in: usersArray },
            });

            pipeLine.push({ $match });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'assignedTo',
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key: 'country',
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key: 'region',
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key: 'subRegion',
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'branches',
            key: 'branch',
            addMainProjection: ['retailSegment', 'outlet'],
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'retailSegments',
            key: 'retailSegment',
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'outlets',
            key: 'outlet',
        }));

        pipeLine.push({
            $lookup: {
                from: 'objectives',
                localField: 'itemId',
                foreignField: '_id',
                as: 'itemModel',
            },
        });

        pipeLine.push({
            $unwind: {
                path: '$itemModel',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeLine.push({
            $match: {
                'itemModel.status': {
                    $ne: OTHER_CONSTANTS.OBJECTIVE_STATUSES.DRAFT,
                },
            },
        });

        pipeLine.push({
            $group: {
                _id: '$_id',
                createdBy: { $first: '$createdBy' },
                region: { $first: '$region' },
                subRegion: { $first: '$subRegion' },
                retailSegment: { $first: '$retailSegment' },
                outlet: { $first: '$outlet' },
                branch: { $first: '$branch' },
                country: { $first: '$country' },
                module: { $first: '$module' },
                creationDate: { $first: '$creationDate' },
                accessRoleLevel: { $first: '$accessRoleLevel' },
                actionType: { $first: '$actionType' },
                assignedTo: { $first: '$assignedTo' },
                itemDetails: { $first: '$itemDetails' },
                itemId: { $first: '$itemId' },
                itemName: { $first: '$itemName' },
                itemType: { $first: '$itemType' },
            },
        });

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile,
            searchFieldsArray,
            filterSearch,
            skip,
            limit,
            sort,
        }));

        return pipeLine;
    }

    function getCoveredUsers(userObject, waterFallCb) {
        PersonnelModel
            .find({ 'vacation.cover': userObject._id }, { _id: 1 })
            .lean()
            .exec((err, result) => {
                if (err) {
                    return waterFallCb(err);
                }

                userObject.cover = _.map(result, (el) => {
                    return el._id;
                });

                return waterFallCb(null, userObject);
            });
    }

    function getUserLocationsAndLevel(userId, waterFallCb) {
        const aggregation = PersonnelModel.aggregate([
            {
                $match: { _id: ObjectId(userId) },
            },
            {
                $project: {
                    country: 1,
                    region: 1,
                    subRegion: 1,
                    branch: 1,
                    accessRole: 1,
                    beforeAccess: 1,
                },
            }, {
                $lookup: {
                    from: 'accessRoles',
                    localField: 'accessRole',
                    foreignField: '_id',
                    as: 'accessRole',
                },
            }, {
                $project: {
                    country: 1,
                    region: 1,
                    subRegion: 1,
                    branch: 1,
                    beforeAccess: 1,
                    accessRoleLevel: { $arrayElemAt: ['$accessRole.level', 0] },
                },
            },
        ]);

        aggregation.exec((err, result) => {
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
        const waterFallTasks = [];

        waterFallTasks.push(
            async.apply(getUserLocationsAndLevel, userId)
        );

        waterFallTasks.push(getCoveredUsers);

        async.waterfall(waterFallTasks, (err, result) => {
            if (err) {
                return cb(err);
            }

            cb(null, result);
        });
    }

    this.getBadge = (req, res, next) => {
        const queryRun = (callback) => {
            const userId = req.session.uId;
            const address = `badges:${userId}`;

            rehydrate(address, callback);
        };

        async.waterfall([

            (cb) => {
                access.getReadAccess(req, ACL_MODULES.ACTIVITY_LIST, cb);
            },

            (allowed, personnel, cb) => {
                queryRun(cb);
            },

        ], (err, state) => {
            if (err) {
                return next(err);
            }

            res.status(200).send({
                badgesState: state,
            });
        });
    };

    this.deleteBadge = (req, res, next) => {
        const userId = req.session.uId;
        const moduleId = req.body.moduleId;

        async.waterfall([

            (cb) => {
                access.getReadAccess(req, ACL_MODULES.ACTIVITY_LIST, cb);
            },

            (allowed, personnel, cb) => {
                dispatch(cleanupBadges({
                    userId,
                    moduleId,
                }), cb);
            },

            (state, cb) => {
                PubNubClient.publish({
                    channel: userId,
                    message: {
                        badgesState: state,
                    },
                }, cb);
            },

        ], (err) => {
            if (err) {
                return next(err);
            }

            res.status(200).send({
                message: 'OK Delete',
            });
        });
    };

    this.getAllForSync = function(req, res, next) {
        function queryRun(personnel) {
            const query = req.query;
            const isMobile = req.isMobile;
            const filterMapper = new FilterMapper();
            const filter = query.filter || {};
            const lastLogOut = new Date(query.lastLogOut);
            let key;
            let aggregation;
            let pipeLine;
            const sort = {
                'createdBy.date': -1,
            };

            let queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.ACTIVITYLIST,
                filter,
                personnel,
            });

            const afterIteMTypeQuery = {
                region: queryObject.region,
                subRegion: queryObject.subRegion,
                retailSegment: queryObject.retailSegment,
                outlet: queryObject.outlet,
                branch: queryObject.branch,
            };

            delete queryObject.region;
            delete queryObject.subRegion;
            delete queryObject.retailSegment;
            delete queryObject.outlet;
            delete queryObject.branch;

            const aggregateHelper = new AggregationHelper($defProjection, queryObject);

            delete queryObject.archived;

            // aggregateHelper.setSyncQuery(queryObject, lastLogOut);
            queryObject = {
                'createdBy.date': { $gte: lastLogOut },
            };

            for (key in sort) {
                sort[key] = parseInt(sort[key], 10);
            }

            getUserInfo(req.session.uId, (err, currentUser) => {
                pipeLine = getAllPipelineActivity({
                    queryObject,
                    aggregateHelper,
                    sort,
                    isMobile,
                    currentUser,
                    afterIteMTypeQuery,
                    forSync: true,
                });

                aggregation = ActivityListModel.aggregate(pipeLine);

                aggregation.exec((err, response) => {
                    let idsPersonnel = [];
                    const options = {
                        data: {},
                    };
                    if (err) {
                        return next(err);
                    }
                    response = response.length ? response[0] : {
                        data: [],
                        total: 0,
                    };

                    if (!response.data.length) {
                        return next({
                            status: 200,
                            body: response,
                        });
                    }

                    _.map(response.data, (model) => {
                        idsPersonnel.push(model.createdBy.user._id);
                    });

                    idsPersonnel = _.uniqBy(idsPersonnel, 'id');
                    options.data[CONTENT_TYPES.PERSONNEL] = idsPersonnel;

                    getImagesHelper.getImages(options, (err, result) => {
                        const fieldNames = {};
                        let setOptions;
                        if (err) {
                            return next(err);
                        }

                        setOptions = {
                            response,
                            imgsObject: result,
                        };
                        fieldNames[CONTENT_TYPES.PERSONNEL] = ['createdBy.user'];
                        setOptions.fields = fieldNames;

                        getImagesHelper.setIntoResult(setOptions, (response) => {
                            _.map(response.data, (element) => {
                                element.module = MODULE_NAMES[element.module._id];
                            });

                            next({
                                status: 200,
                                body: response,
                            });
                        });
                    });
                });
            });
        }

        async.waterfall([

            async.apply(access.getReadAccess, req, ACL_MODULES.PERSONNEL),

            (allowed, personnel) => {
                queryRun(personnel);
            },

        ]);
    };

    this.getAll = function(req, res, next) {
        function queryRun(activity, callback) {
            const isMobile = req.isMobile;
            const query = req.query;
            const page = query.page || 1;
            const limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
            const skip = (page - 1) * limit;
            const uid = req.session.uId;
            const filterMapper = new FilterMapper();
            const filter = query.filter || {};
            const filterSearch = filter.globalSearch || '';
            const sort = {
                'createdBy.date': -1,
            };

            const searchFieldsArray = [
                'createdBy.user.firstName.en',
                'createdBy.user.firstName.ar',
                'createdBy.user.lastName.en',
                'createdBy.user.lastName.ar',
                'module.name.ar',
                'module.name.en',
                'type',
            ];

            if (filter.module) {
                if (filter.module.values) {
                    filter.module.values[0] = parseInt(filter.module.values[0], 10);
                }
            }

            delete filter.globalSearch;

            const queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.ACTIVITYLIST,
                filter,
                personnel: activity,
            });

            delete queryObject.archived;

            const positionFilter = {};

            if (queryObject.position && queryObject.position.$in) {
                positionFilter['createdBy.user.position'] = queryObject.position;

                delete queryObject.position;
            }

            for (const key in sort) {
                sort[key] = parseInt(sort[key], 10);
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
                        isMobile,
                    });

                    const aggregation = ActivityListModel.aggregate(pipeLine);

                    aggregation.exec(cb);
                },

                (response, cb) => {
                    const idsPersonnel = [];

                    response = response.length ?
                        response[0] : {
                            data: [],
                            total: 0,
                        };

                    if (!response.data.length) {
                        return next({
                            status: 200,
                            body: response,
                        });
                    }

                    _.forEach(response.data, (model) => {
                        idsPersonnel.push(model.createdBy.user._id);
                    });


                    const options = {
                        data: {
                            [CONTENT_TYPES.PERSONNEL]: _.uniqBy(idsPersonnel, 'id'),
                        },
                    };

                    cb(null, {
                        response,
                        options,
                    });
                },

                (data, cb) => {
                    getImagesHelper.getImages(data.options, (err, result) => {
                        cb(err, {
                            response: data.response,
                            result,
                        });
                    });
                },

                (data, cb) => {
                    const options = {
                        response: data.response,
                        imgsObject: data.result,
                        fields: {
                            [CONTENT_TYPES.PERSONNEL]: ['createdBy.user'],
                        },
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
                },

            ], callback);
        }

        async.waterfall([

            async.apply(access.getReadAccess, req, ACL_MODULES.ACTIVITY_LIST),

            (allowed, personnel, cb) => {
                queryRun(personnel, cb);
            },

        ], (err, body) => {
            if (err) {
                return next(err);
            }

            return next({
                status: 200,
                body,
            });
        });
    };
};

module.exports = Personnel;
