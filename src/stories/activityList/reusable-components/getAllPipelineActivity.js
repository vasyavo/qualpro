const ACL_CONSTANTS = require('../../../constants/aclRolesNames');
const matchByAcl = require('./aclMatch');

module.exports = (options) => {
    const {
        queryObject,
        positionFilter,
        filterSearch,
        limit,
        skip,
        currentUser,
    } = options;

    const pipeLine = [];
    const locations = ['country', 'region', 'subRegion', 'branch'];
    const today = new Date();

    const $generalMatch = Object.assign({}, queryObject, {
        'createdBy.date': queryObject['createdBy.date'] || { $gte: new Date(today.setMonth(today.getMonth() - 2)) },
    }, matchByAcl({
        currentUser,
        queryObject,
    }));

    if ([ACL_CONSTANTS.MASTER_ADMIN,
        ACL_CONSTANTS.MASTER_UPLOADER,
        ACL_CONSTANTS.TRADE_MARKETER,
        ACL_CONSTANTS.COUNTRY_ADMIN,
        ACL_CONSTANTS.COUNTRY_UPLOADER,
        ACL_CONSTANTS.AREA_MANAGER,
        ACL_CONSTANTS.AREA_IN_CHARGE,
    ].indexOf(currentUser.accessRoleLevel) === -1) {
        // if user not admin
        $generalMatch.personnels = currentUser._id;
    } else {
        // if user some of admin
        locations.forEach((location) => {
            if (currentUser[location] && currentUser[location].length && !$generalMatch[location]) {
                $generalMatch.$and.push({
                    $or: [
                        {
                            [location]: { $in: currentUser[location] },
                        },
                        {
                            [location]: { $eq: [] },
                        },
                        {
                            [location]: { $eq: null },
                        },
                    ],
                });
            }
        });
    }

    $generalMatch['createdBy.user'] = {
        $ne: null,
    };

    pipeLine.push({
        $match: $generalMatch,
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
                                en: {
                                    $concat: ['$$createdByUser.firstName.en', ' ', '$$createdByUser.lastName.en'],
                                },
                                ar: {
                                    $concat: ['$$createdByUser.firstName.ar', ' ', '$$createdByUser.lastName.ar'],
                                },
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

    const getSearchReference = (string) => {
        return { $regex: string, $options: 'i' };
    };

    if (filterSearch && filterSearch.length > 0) {
        pipeLine.push({
            $match: {
                $or: [
                    { 'createdBy.user.name.en': getSearchReference(filterSearch) },
                    { 'createdBy.user.name.ar': getSearchReference(filterSearch) },
                ],
            },
        });
    }

    if (queryObject.position && queryObject.position.$in) {
        pipeLine.push({
            $match: positionFilter,
        });
    }


    pipeLine.push({
        $sort: {
            'createdBy.date': -1,
        },
    });

    pipeLine.push({
        $group: {
            _id: null,
            setActivity: { $push: '$_id' },
            total: { $sum: 1 },
        },
    });

    if (limit) {
        pipeLine.push({
            $project: {
                setActivity: {
                    $let: {
                        vars: {
                            skip,
                            limit,
                        },
                        in: {
                            $cond: {
                                if: {
                                    $gte: [
                                        '$total',
                                        { $add: ['$$skip', '$$limit'] },
                                    ],
                                },
                                then: { $slice: ['$setActivity', '$$skip', '$$limit'] },
                                else: {
                                    $cond: {
                                        if: {
                                            $gt: [
                                                '$total',
                                                '$$skip',
                                            ],
                                        },
                                        then: {
                                            $slice: ['$setActivity', '$$skip', { $subtract: ['$total', '$$skip'] }],
                                        }, // if set objectives is empty array, total will be 0
                                        else: [],
                                    },
                                },
                            },
                        },
                    },
                },
                total: 1,
            },
        });
    }

    pipeLine.push({
        $unwind: '$setActivity',
    });

    pipeLine.push({
        $lookup: {
            from: 'activityLists',
            localField: 'setActivity',
            foreignField: '_id',
            as: 'activity',
        },
    });

    pipeLine.push({
        $project: {
            activity: {
                $let: {
                    vars: {
                        fields: { $arrayElemAt: ['$activity', 0] },
                    },
                    in: {
                        total: '$total',
                        _id: '$$fields._id',
                        module: '$$fields.module',
                        accessRoleLevel: '$$fields.accessRoleLevel',
                        createdBy: '$$fields.createdBy',
                        actionType: '$$fields.actionType',
                        itemType: '$$fields.itemType',
                        itemId: '$$fields.itemId',
                        itemDetails: '$$fields.itemDetails',
                        assignedTo: '$$fields.assignedTo',
                        country: '$$fields.country',
                        itemName: '$$fields.itemName',
                    },
                },
            },
        },
    });

    pipeLine.push({
        $replaceRoot: {
            newRoot: '$activity',
        },
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
        $project: {
            assignedTo: {
                $filter: {
                    input: '$assignedTo',
                    as: 'assignedToPersonnel',
                    cond: {
                        $cond: {
                            if: {
                                $eq: ['$$assignedToPersonnel', null],
                            },
                            then: [],
                            else: '$$assignedToPersonnel',
                        },
                    },
                },
            },
            createdBy: {
                user: {
                    $let: {
                        vars: {
                            createdByUser: { $arrayElemAt: ['$createdBy.user', 0] },
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
                date: '$createdBy.date',
            },
            module: 1,
            actionType: 1,
            accessRoleLevel: 1,
            country: 1,
            total: 1,
            itemType: 1,
            itemDetails: 1,
            itemName: 1,
            itemId: 1,
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
        $lookup: {
            from: 'positions',
            localField: 'createdBy.user.position',
            foreignField: '_id',
            as: 'createdBy.user.position',
        },
    });

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
                    name: {
                        $concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en'],
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
                $let: {
                    vars: {
                        moduleModel: {
                            $arrayElemAt: ['$module', 0],
                        },
                    },
                    in: {
                        _id: '$$moduleModel._id',
                        name: '$$moduleModel.name',
                    },
                },
            },
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
            creationDate: '$createdBy.date',
        },
    });

    pipeLine.push({
        $group: {
            _id: null,
            data: {
                $push: '$$ROOT',
            },
            total: { $first: '$total' },
        },
    });

    pipeLine.push({
        $project: {
            _id: 0,
            total: 1,
            data: 1,
        },
    });

    return pipeLine;
};
