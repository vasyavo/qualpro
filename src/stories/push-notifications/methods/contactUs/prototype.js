const _ = require('lodash');
const ObjectId = require('mongoose').Types.ObjectId;
const ActivityModel = require('./../../../../types/activityList/model');
const toString = require('./../../../../utils/toString');
const accessRoles = require('./../../../../constants/aclRolesNames');
const PersonnelModel = require('./../../../../types/personnel/model');

const getPipeline = (options) => {
    const contentAuthor = ObjectId(options.contentAuthor);

    return [{
        $project: {
            accessRole: 1,
            country: 1,
        },
    }, {
        $lookup: {
            from: 'accessRoles',
            localField: 'accessRole',
            foreignField: '_id',
            as: 'accessRole',
        },
    }, {
        $unwind: {
            path: '$accessRole',
        },
    }, {
        $project: {
            'accessRole.level': 1,
            country: 1,
        },
    }, {
        $match: {
            // fetch content author as well in order to get his country
            $or: [{
                _id: contentAuthor,
            }, {
                'accessRole.level': {
                    $in: [
                        accessRoles.MASTER_ADMIN,
                        accessRoles.COUNTRY_ADMIN,
                        accessRoles.MASTER_UPLOADER,
                        accessRoles.COUNTRY_UPLOADER,
                    ],
                },
            }],
        },
    }, {
        $group: {
            _id: 1,
            setPersonnel: {
                $push: '$$ROOT',
            },
        },
    }, {
        $project: {
            setPersonnel: 1,
            // persist content author to next comparision
            contentAuthor: {
                $arrayElemAt: [{
                    $filter: {
                        input: '$setPersonnel',
                        as: 'item',
                        cond: {
                            $eq: ['$$item._id', contentAuthor],
                        },
                    },
                }, 0],
            },
        },
    }, {
        $project: {
            setAdmin: {
                $cond: {
                    // if publisher is Master Admin which haven't assigned country
                    if: {
                        $eq: ['$contentAuthor.accessRole.level', accessRoles.MASTER_ADMIN],
                    },
                    then: {
                        $filter: {
                            input: '$setPersonnel',
                            as: 'item',
                            cond: {
                                $and: [{
                                    $ne: ['$$item._id', contentAuthor],
                                }, {
                                    $setIsSubset: [['$$item.accessRole.level'], [
                                        accessRoles.MASTER_ADMIN,
                                        accessRoles.MASTER_UPLOADER,
                                    ]],
                                }],
                            },
                        },
                    },
                    // if publisher have country, so that Country Admin and Country Uploader may be notified.
                    else: {
                        $filter: {
                            input: '$setPersonnel',
                            as: 'item',
                            cond: {
                                $and: [{
                                    $ne: ['$$item._id', contentAuthor],
                                }, {
                                    $or: [{
                                        $and: [{
                                            $setIsSubset: [['$$item.accessRole.level'], [
                                                accessRoles.COUNTRY_ADMIN,
                                                accessRoles.COUNTRY_UPLOADER,
                                            ]],
                                        }, {
                                            $gt: [{
                                                $size: {
                                                    $setIntersection: ['$$item.country', '$contentAuthor.country'],
                                                },
                                            }, 0],
                                        }],
                                    }, {
                                        $setIsSubset: [['$$item.accessRole.level'], [
                                            accessRoles.MASTER_ADMIN,
                                            accessRoles.MASTER_UPLOADER,
                                        ]],
                                    }],
                                }],
                            },
                        },
                    },
                },
            },
        },
    }, {
        $project: {
            setAdmin: '$setAdmin._id',
        },
    }];
};

module.exports = function * (options) {
    const {
        moduleId,
        contentType,
        actionType,

        accessRoleLevel,
        body,
    } = options;

    const actionOriginator = toString(options, 'actionOriginator');
    const contentAuthor = toString(body, 'createdBy');

    const pipeline = getPipeline({
        contentAuthor,
    });
    const result = yield PersonnelModel.aggregate(pipeline);
    const setAdmin = (result.length ? result : [{ setAdmin: [] }])
        .slice()
        .pop().setAdmin
        .filter(objectId => objectId)
        .map(objectId => objectId.toString());
    const highPriority = _.uniq([actionOriginator, contentAuthor]);

    const newActivity = new ActivityModel();

    newActivity.set({
        itemType: contentType,
        module: moduleId,
        actionType,
        itemId: body._id,
        itemName: {
            en: _.get(body, 'title.en'),
            ar: _.get(body, 'title.ar'),
        },
        createdBy: {
            user: actionOriginator,
        },
        accessRoleLevel,
        personnels: _.uniq([
            actionOriginator,
            contentAuthor,
            ...setAdmin,
        ]),
        assignedTo: [],
        country: [],
        region: [],
        subRegion: [],
        retailSegment: [],
        outlet: [],
        branch: [],
    });

    yield newActivity.save();

    const payload = {
        actionType,
    };

    return {
        actionOriginator,
        payload,
        highPriority,
        setAdmin: _.difference(setAdmin, highPriority),
    };
};
