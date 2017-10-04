const _ = require('underscore');
const ACL_CONSTANTS = require('./../../../constants/aclRolesNames');
const OTHER_CONSTANTS = require('./../../../public/js/constants/otherConstants');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;

module.exports = (options) => {
    const subordinates = options.subordinates;
    const aggregateHelper = options.aggregateHelper;
    const queryObject = options.queryObject;
    const positionFilter = options.positionFilter;
    const isMobile = options.isMobile;
    const skip = options.skip;
    const limit = options.limit;
    const coveredIds = options.coveredIds;
    const searchFieldsArray = options.searchFieldsArray;
    const filterSearch = options.filterSearch;
    const currentUserLevel = options.currentUserLevel;
    const personelObj = options.personnel;
    const locations = ['country', 'region', 'subRegion', 'branch'];

    if (personelObj && personelObj.accessRole && personelObj.accessRole.level === ACL_CONSTANTS.AREA_IN_CHARGE) {
        locations.pop();
    }

    let pipeLine = [];

    pipeLine.push({
        $match: queryObject,
    });

    if (isMobile) {
        if (currentUserLevel && currentUserLevel !== ACL_CONSTANTS.MASTER_ADMIN) {
            const allowedAccessRoles = [
                ACL_CONSTANTS.COUNTRY_ADMIN,
                ACL_CONSTANTS.AREA_MANAGER,
                ACL_CONSTANTS.AREA_IN_CHARGE,
            ];

            if (allowedAccessRoles.indexOf(currentUserLevel) > -1 && queryObject) {
                pipeLine.push({
                    $match: {
                        $or: [
                            {
                                assignedTo: {$in: subordinates},
                                status    : {$nin: [OBJECTIVE_STATUSES.DRAFT]},
                            },
                            {
                                'history.assignedTo': {$in: coveredIds},
                                status              : {$nin: [OBJECTIVE_STATUSES.DRAFT]},
                            },
                            {
                                'createdBy.user': {$in: coveredIds},
                            },
                        ],
                    },
                });
            } else {
                pipeLine.push({
                    $match: {
                        $or: [
                            {
                                assignedTo: {$in/**/: coveredIds},
                                status    : {$nin: [OBJECTIVE_STATUSES.DRAFT]},
                            },
                            {
                                'history.assignedTo': {$in: coveredIds},
                                status              : {$nin: [OBJECTIVE_STATUSES.DRAFT]},
                            },
                            {
                                'createdBy.user': {$in: coveredIds},
                            },
                        ],
                    },
                });
            }
        }
    }

    if (!isMobile) {
        pipeLine.push({
            $match: {
                $or: [
                    {archived: false},
                    {archived: {$exists: false}},
                ],
            },
        });

        const $locationMatch = {
            $and: [],
        };

        locations.forEach((location) => {
            if (personelObj[location] && personelObj[location].length && !queryObject[location]) {
                $locationMatch.$and.push({
                    $or: [
                        {
                            [location]: {$in: personelObj[location]},
                        },
                        {
                            [location]: {$eq: []},
                        },
                        {
                            [location]: {$eq: null},
                        },
                        {
                            assignedTo: {$in: subordinates},
                        },
                        {
                            'createdBy.user': {$eq: personelObj._id},
                        },
                    ],
                });
            }
        });

        if ($locationMatch.$and.length) {
            pipeLine.push({
                $match: $locationMatch,
            });
        }

    }
    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from         : 'personnels',
        key          : 'assignedTo',
        addProjection: ['_id', 'position', 'accessRole', 'firstName', 'lastName', 'imageSrc'],
    }));

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from         : 'files',
        key          : 'attachments',
        addProjection: ['contentType', 'originalName', 'createdBy', 'preview'],
    }));

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from: 'domains',
        key : 'country',
    }));

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from: 'domains',
        key : 'region',
    }));

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from: 'domains',
        key : 'subRegion',
    }));

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from: 'retailSegments',
        key : 'retailSegment',
    }));

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from: 'outlets',
        key : 'outlet',
    }));

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from: 'branches',
        key : 'branch',
    }));

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from           : 'personnels',
        key            : 'createdBy.user',
        isArray        : false,
        addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
        includeSiblings: {createdBy: {date: 1}},
    }));

    pipeLine.push({
        $project: aggregateHelper.getProjection({
            assignedTo: {$arrayElemAt: ['$assignedTo', 0]},
        }),
    });

    if (positionFilter) {
        pipeLine.push({
            $match: positionFilter,
        });
    }

    if (!isMobile) {
        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'accessRoles',
            key            : 'assignedTo.accessRole',
            isArray        : false,
            addProjection  : ['_id', 'name', 'level'],
            includeSiblings: {
                assignedTo: {
                    _id      : 1,
                    firstName: 1,
                    lastName : 1,
                    position : 1,
                    imageSrc : 1,
                },
            },
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'positions',
            key            : 'assignedTo.position',
            isArray        : false,
            includeSiblings: {
                assignedTo: {
                    _id       : 1,
                    firstName : 1,
                    lastName  : 1,
                    accessRole: 1,
                    imageSrc  : 1,
                },
            },
        }));
    }

    pipeLine.push({
        $group: aggregateHelper.getGroupObject({
            assignedTo: {$addToSet: '$assignedTo'},
        }),
    });

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
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

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
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
        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'editedBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
            includeSiblings: {editedBy: {date: 1}},
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
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

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
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

    pipeLine.push({
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

    pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
        isMobile,
        searchFieldsArray,
        filterSearch,
        skip,
        limit,
        creationDate: true,
    }));

    return pipeLine;
};
