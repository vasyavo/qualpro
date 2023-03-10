const ACL_CONSTANTS = require('./../../../constants/aclRolesNames');
const OTHER_CONSTANTS = require('./../../../public/js/constants/otherConstants');
const _ = require('lodash');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;

module.exports = (options) => {
    const subordinates = options.subordinates;
    const personnel = options.personnel;
    const personelObj = options.personnelObj || {};
    const aggregateHelper = options.aggregateHelper;
    const queryObject = options.queryObject;
    const parentIds = options.parentIds;
    const positionFilter = options.positionFilter;
    const searchFieldsArray = options.searchFieldsArray;
    const filterSearch = options.filterSearch;
    const skip = options.skip;
    const limit = options.limit;
    const isMobile = options.isMobile;
    const coveredIds = options.coveredIds;
    const pipeline = [];
    const currentUserLevel = options.currentUserLevel;
    const locations = ['country', 'region', 'subRegion', 'branch'];

    if (personelObj.accessRole.level === ACL_CONSTANTS.AREA_IN_CHARGE) {
        locations.pop();
    }

    if (parentIds && parentIds.length) {
        pipeline.push({
            $match: {
                $and: [{
                    $or: [
                        {'parent.1': {$in: parentIds}},
                        {'parent.2': {$in: parentIds}},
                        {'parent.3': {$in: parentIds}},
                        {'parent.4': {$in: parentIds}},
                    ],
                }, {
                    _id: {$nin: parentIds},
                }],
            },
        });
    } else {
        if (queryObject) {
            pipeline.push({
                $match: queryObject,
            });
        }

        if (isMobile && currentUserLevel && currentUserLevel !== ACL_CONSTANTS.MASTER_ADMIN) {
            const allowedAccessRoles = [
                ACL_CONSTANTS.COUNTRY_ADMIN,
                ACL_CONSTANTS.AREA_MANAGER,
                ACL_CONSTANTS.AREA_IN_CHARGE,
            ];

            if (allowedAccessRoles.indexOf(currentUserLevel) > -1 && queryObject) {
                // get objectives that assigned to subordinate users
                pipeline.push({
                    $match: {
                        $or: [
                            {assignedTo: {$in: subordinates}},
                            {assignedTo: {$in: coveredIds}},
                            {'createdBy.user': {$in: coveredIds}},
                        ],
                    },
                });
            }
        }

        // prevent retrieving objectives with status === draft if user not creator
        pipeline.push({
            $match: {
                $or: [{
                    status: {$ne: OBJECTIVE_STATUSES.DRAFT},
                }, {
                    status          : {$eq: OBJECTIVE_STATUSES.DRAFT},
                    'createdBy.user': {$eq: personnel},
                }],
            },
        });
    }

    const $locationMatch = {
        $and: [],
    };

    locations.forEach((location) => {
        if (personelObj[location] && personelObj[location].length && !queryObject[location]) {
            $locationMatch.$and.push({
                $or: [
                    {
                        [location]: { $in: personelObj[location] },
                    },
                    {
                        [location]: { $eq: [] },
                    },
                    {
                        [location]: { $eq: null },
                    },
                    {
                        assignedTo: { $in: subordinates },
                    },
                    {
                        'createdBy.user': { $eq: personelObj._id },
                    },
                ],
            });
        }
    });

    if ($locationMatch.$and.length) {
        pipeline.push({
            $match: $locationMatch,
        });
    }

    pipeline.push({
        $match: {
            $or: [
                {archived: false},
                {archived: {$exists: false}},
            ],
        },
    });

    if (isMobile) {
        pipeline.push({
            $project: aggregateHelper.getProjection({
                parent: {
                    level1: '$parent.1',
                    level2: '$parent.2',
                    level3: '$parent.3',
                    level4: '$parent.4',
                },
            }),
        });
    }

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from         : 'personnels',
        key          : 'assignedTo',
        addProjection: ['position', 'accessRole', 'firstName', 'lastName', 'imageSrc'],
        isArray      : true,
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from         : 'files',
        key          : 'attachments',
        addProjection: ['contentType', 'originalName', 'createdBy', 'preview'],
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'domains',
        key : 'country',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'domains',
        key : 'region',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'domains',
        key : 'subRegion',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'retailSegments',
        key : 'retailSegment',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'outlets',
        key : 'outlet',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'branches',
        key : 'branch',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from           : 'personnels',
        key            : 'createdBy.user',
        isArray        : false,
        addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
        includeSiblings: {createdBy: {date: 1}},
    }));

    pipeline.push({
        $unwind: {
            path                      : '$assignedTo',
            preserveNullAndEmptyArrays: true,
        },
    });

    if (positionFilter) {
        pipeline.push({
            $match: positionFilter,
        });
    }

    if (!isMobile) {
        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from           : 'accessRoles',
            key            : 'assignedTo.accessRole',
            isArray        : false,
            addProjection  : ['_id', 'name', 'level'],
            includeSiblings: {
                assignedTo: {
                    _id      : 1,
                    position : 1,
                    firstName: 1,
                    lastName : 1,
                    imageSrc : 1,
                },
            },
        }));

        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from           : 'positions',
            key            : 'assignedTo.position',
            isArray        : false,
            includeSiblings: {
                assignedTo: {
                    _id       : 1,
                    accessRole: 1,
                    firstName : 1,
                    lastName  : 1,
                    imageSrc  : 1,
                },
            },
        }));
    }

    pipeline.push({
        $group: aggregateHelper.getGroupObject({
            assignedTo: {$addToSet: '$assignedTo'},
        }),
    });

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from           : 'accessRoles',
        key            : 'createdBy.user.accessRole',
        isArray        : false,
        addProjection  : ['_id', 'name', 'level'],
        includeSiblings: {
            createdBy: {
                date: 1,
                user: {
                    _id      : 1,
                    position : 1,
                    firstName: 1,
                    lastName : 1,
                    imageSrc : 1,
                },
            },
        },
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from           : 'positions',
        key            : 'createdBy.user.position',
        isArray        : false,
        includeSiblings: {
            createdBy: {
                date: 1,
                user: {
                    _id       : 1,
                    accessRole: 1,
                    firstName : 1,
                    lastName  : 1,
                    imageSrc  : 1,
                },
            },
        },
    }));

    if (isMobile) {
        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'editedBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
            includeSiblings: {editedBy: {date: 1}},
        }));

        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from           : 'accessRoles',
            key            : 'editedBy.user.accessRole',
            isArray        : false,
            addProjection  : ['_id', 'name', 'level'],
            includeSiblings: {
                editedBy: {
                    date: 1,
                    user: {
                        _id      : 1,
                        position : 1,
                        firstName: 1,
                        lastName : 1,
                        imageSrc : 1,
                    },
                },
            },
        }));

        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from           : 'positions',
            key            : 'editedBy.user.position',
            isArray        : false,
            includeSiblings: {
                editedBy: {
                    date: 1,
                    user: {
                        _id       : 1,
                        accessRole: 1,
                        firstName : 1,
                        lastName  : 1,
                        imageSrc  : 1,
                    },
                },
            },
        }));
    }

    pipeline.push({
        $project: aggregateHelper.getProjection({
            assignedTo: {
                $filter: {
                    input: '$assignedTo',
                    as   : 'oneItem',
                    cond : {$ne: ['$$oneItem', null]},
                },
            },
        }),
    });

    pipeline.push(...aggregateHelper.endOfPipeLine({
        isMobile,
        searchFieldsArray,
        filterSearch,
        skip,
        limit,
        creationDate: true,
    }));

    return pipeline;
};
