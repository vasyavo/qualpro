const _ = require('lodash');
const ACL_CONSTANTS = require('../../../constants/aclRolesNames');
const CONTENT_TYPES = require('../../../public/js/constants/contentType');
const MODULE_NAMES = require('../../../public/js/constants/moduleNamesForActivity');
const OTHER_CONSTANTS = require('../../../public/js/constants/otherConstants');

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

module.exports = (options) => {
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
            createdBy: {
                date: '$createdBy.date',
                user: {
                    $let: {
                        vars: {
                            createdByUser: {
                                $arrayElemAt: ['$createdBy.user', 0],
                            },
                        },
                        in: {
                            _id: '$$createdByUser._id',
                            name: {
                                $concat: ['$$createdByUser.firstName.en', ' ', '$$createdByUser.lastName.en'],
                            },
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

    if (queryObject.position && queryObject.position.$in) {
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
                    _id: '$createdBy.user._id',
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
                    firstName: '$createdBy.user.firstName',
                    lastName: '$createdBy.user.lastName',
                },
                diffDate: {
                    $let: {
                        vars: {
                            dateNow: new Date(),
                            createDate: '$createdBy.date',
                        },
                        in: { $subtract: ['$$dateNow', '$$createDate'] },
                    },
                },
                date: '$createdBy.date',
            },
            module: {
                name: '$module.name',
                _id: '$module._id',
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
                },
            ],
        });

        $match.$or.push({
            $and: [
                regionsMathArray, {
                    itemType: {
                        $in: [
                            CONTENT_TYPES.BRANDINGANDDISPLAY,
                            CONTENT_TYPES.PROMOTIONS,
                        ],
                    },
                },
            ],
        });

        $match.$or.push({
            assignedTo: { $in: usersArray },
        });

        pipeLine.push({ $match });
    }

    pipeLine.push({
        $lookup: {
            from: 'personnels',
            localField: 'assignedTo',
            foreignField: '_id',
            as: 'assignedTo',
        },
    });

    pipeLine.push({
        $lookup: {
            from: 'domains',
            localField: 'country',
            foreignField: '_id',
            as: 'country',
        },
    });

    pipeLine.push({
        $lookup: {
            from: 'domains',
            localField: 'region',
            foreignField: '_id',
            as: 'region',
        },
    });

    pipeLine.push({
        $lookup: {
            from: 'domains',
            localField: 'subRegion',
            foreignField: '_id',
            as: 'subRegion',
        },
    });

    pipeLine.push({
        $lookup: {
            from: 'branches',
            localField: 'branch',
            foreignField: '_id',
            as: 'branch',
        },
    });

    pipeLine.push({
        $addFields: {
            assignedTo: {
                $map: {
                    input: '$assignedTo',
                    as: 'personnel',
                    in: {
                        _id: '$$personnel._id',
                        name: {
                            $concat: ['$$personnel.firstName.en', ' ', '$$personnel.lastName.en'],
                        },
                    },
                },
            },
            country: {
                $map: {
                    input: '$country',
                    as: 'item',
                    in: {
                        _id: '$$item._id',
                        name: '$$item.name',
                    },
                },
            },
            region: {
                $map: {
                    input: '$region',
                    as: 'item',
                    in: {
                        _id: '$$item._id',
                        name: '$$item.name',
                    },
                },
            },
            subRegion: {
                $map: {
                    input: '$subRegion',
                    as: 'item',
                    in: {
                        _id: '$$item._id',
                        name: '$$item.name',
                    },
                },
            },
            branch: {
                $map: {
                    input: '$branch',
                    as: 'item',
                    in: {
                        _id: '$$item._id',
                        name: '$$item.name',
                    },
                },
            },
            retailSegment: '$branch.retailSegment',
            outlet: '$branch.outlet',
        },
    });

    pipeLine.push({
        $lookup: {
            from: 'retailSegments',
            localField: 'retailSegment',
            foreignField: '_id',
            as: 'retailSegment',
        },
    });

    pipeLine.push({
        $lookup: {
            from: 'outlets',
            localField: 'outlet',
            foreignField: '_id',
            as: 'outlet',
        },
    });

    pipeLine.push({
        $addFields: {
            retailSegment: {
                $map: {
                    input: '$retailSegment',
                    as: 'item',
                    in: {
                        _id: '$$item._id',
                        name: '$$item.name',
                    },
                },
            },
            outlet: {
                $map: {
                    input: '$outlet',
                    as: 'item',
                    in: {
                        _id: '$$item._id',
                        name: '$$item.name',
                    },
                },
            },
        },
    });

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

    pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
        isMobile,
        searchFieldsArray,
        filterSearch,
        skip,
        limit,
        sort,
    }));

    return pipeLine;
};
