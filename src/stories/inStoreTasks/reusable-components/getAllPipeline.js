const _ = require('underscore');
const ACL_CONSTANTS = require('./../../../constants/aclRolesNames');
const OTHER_CONSTANTS = require('./../../../public/js/constants/otherConstants');

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

    let pipeLine = [];

    pipeLine.push({
        $match: queryObject,
    });

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
                            assignedTo: { $in: subordinates },
                            status: { $nin: [OBJECTIVE_STATUSES.DRAFT] },
                        },
                        {
                            'history.assignedTo': { $in: coveredIds },
                            status: { $nin: [OBJECTIVE_STATUSES.DRAFT] },
                        },
                        {
                            'createdBy.user': { $in: coveredIds },
                        },
                    ],
                },
            });
        } else {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            assignedTo: { $in: coveredIds },
                            status: { $nin: [OBJECTIVE_STATUSES.DRAFT] },
                        },
                        {
                            'history.assignedTo': { $in: coveredIds },
                            status: { $nin: [OBJECTIVE_STATUSES.DRAFT] },
                        },
                        {
                            'createdBy.user': { $in: coveredIds },
                        },
                    ],
                },
            });
        }
    }

    if (!isMobile) {
        pipeLine.push({
            $match: {
                $or: [
                    { archived: false },
                    { archived: { $exists: false } },
                ],
            },
        });
    }

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from: 'personnels',
        key: 'assignedTo',
        addProjection: ['_id', 'position', 'accessRole', 'firstName', 'lastName'],
    }));

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from: 'files',
        key: 'attachments',
        addProjection: ['contentType', 'originalName', 'createdBy'],
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
        from: 'retailSegments',
        key: 'retailSegment',
    }));

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from: 'outlets',
        key: 'outlet',
    }));

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from: 'branches',
        key: 'branch',
    }));

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from: 'personnels',
        key: 'createdBy.user',
        isArray: false,
        addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
        includeSiblings: { createdBy: { date: 1 } },
    }));

    pipeLine.push({
        $project: aggregateHelper.getProjection({
            assignedTo: { $arrayElemAt: ['$assignedTo', 0] },
        }),
    });

    if (positionFilter) {
        pipeLine.push({
            $match: positionFilter,
        });
    }

    if (!isMobile) {
        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'accessRoles',
            key: 'assignedTo.accessRole',
            isArray: false,
            addProjection: ['_id', 'name', 'level'],
            includeSiblings: {
                assignedTo: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    position: 1,
                },
            },
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'positions',
            key: 'assignedTo.position',
            isArray: false,
            includeSiblings: {
                assignedTo: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    accessRole: 1,
                },
            },
        }));
    }

    pipeLine.push({
        $group: aggregateHelper.getGroupObject({
            assignedTo: { $addToSet: '$assignedTo' },
        }),
    });

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from: 'accessRoles',
        key: 'createdBy.user.accessRole',
        isArray: false,
        addProjection: ['_id', 'name', 'level'],
        includeSiblings: {
            createdBy: {
                date: 1,
                user: {
                    _id: 1,
                    position: 1,
                    firstName: 1,
                    lastName: 1,
                },
            },
        },
    }));

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from: 'positions',
        key: 'createdBy.user.position',
        isArray: false,
        includeSiblings: {
            createdBy: {
                date: 1,
                user: {
                    _id: 1,
                    accessRole: 1,
                    firstName: 1,
                    lastName: 1,
                },
            },
        },
    }));

    if (isMobile) {
        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'editedBy.user',
            isArray: false,
            addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
            includeSiblings: { editedBy: { date: 1 } },
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'accessRoles',
            key: 'editedBy.user.accessRole',
            isArray: false,
            addProjection: ['_id', 'name', 'level'],
            includeSiblings: {
                editedBy: {
                    date: 1,
                    user: {
                        _id: 1,
                        position: 1,
                        firstName: 1,
                        lastName: 1,
                    },
                },
            },
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'positions',
            key: 'editedBy.user.position',
            isArray: false,
            includeSiblings: {
                editedBy: {
                    date: 1,
                    user: {
                        _id: 1,
                        accessRole: 1,
                        firstName: 1,
                        lastName: 1,
                    },
                },
            },
        }));

        /* pipeLine.push({
         $project: aggregateHelper.getProjection({
         creationDate: '$createdBy.date',
         updateDate  : '$editedBy.date'
         })
         });*/
    }

    pipeLine.push({
        $project: aggregateHelper.getProjection({
            assignedTo: {
                $filter: {
                    input: '$assignedTo',
                    as: 'oneItem',
                    cond: { $ne: ['$$oneItem', null] },
                },
            },
            /*lastDate  : {
             $ifNull: [
             '$editedBy.date',
             '$createdBy.date'
             ]
             }*/
        }),
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
     }

     pipeLine = _.union(pipeLine, aggregateHelper.setTotal());

     if (limit && limit !== -1) {
     pipeLine.push({
     $skip: skip
     });
     pipeLine.push({
     $limit: limit
     });
     }

     pipeLine = _.union(pipeLine, aggregateHelper.groupForUi());*/

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