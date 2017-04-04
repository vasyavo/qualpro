const _ = require('lodash');
const AggregationHelper = require('./../../../helpers/aggregationCreater');
const ObjectiveModel = require('./../../../types/objective/model');
const $defProjection = require('./../reusable-components/$defProjection');

module.exports = (options, callback) => {
    const id = options.id;
    const isMobile = options.isMobile || false;

    const aggregateHelper = new AggregationHelper($defProjection);
    const pipeline = [];

    pipeline.push({
        $match: { _id: id },
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
        from: 'personnels',
        key: 'assignedTo',
        addProjection: ['firstName', 'lastName', 'imageSrc', 'branch'].concat(isMobile ? [] : ['position', 'accessRole']),
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'files',
        key: 'attachments',
        addProjection: ['contentType', 'originalName', 'createdBy', 'preview'],
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'domains',
        key: 'country',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'domains',
        key: 'region',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'domains',
        key: 'subRegion',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'retailSegments',
        key: 'retailSegment',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'outlets',
        key: 'outlet',
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'branches',
        key: 'branch',
        addProjection: ['_id', 'name', 'outlet'],
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'personnels',
        key: 'createdBy.user',
        isArray: false,
        addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
        includeSiblings: { createdBy: { date: 1 } },
    }));

    pipeline.push({
        $unwind: {
            path: '$assignedTo',
            preserveNullAndEmptyArrays: true,
        },
    });

    if (!isMobile) {
        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from: 'accessRoles',
            key: 'assignedTo.accessRole',
            isArray: false,
            addProjection: ['_id', 'name', 'level'],
            includeSiblings: {
                assignedTo: {
                    _id: 1,
                    position: 1,
                    firstName: 1,
                    lastName: 1,
                    imageSrc: 1,
                    branch: 1,
                },
            },
        }));

        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from: 'positions',
            key: 'assignedTo.position',
            isArray: false,
            includeSiblings: {
                assignedTo: {
                    _id: 1,
                    accessRole: 1,
                    firstName: 1,
                    lastName: 1,
                    imageSrc: 1,
                    branch: 1,
                },
            },
        }));
    }

    pipeline.push({
        $group: aggregateHelper.getGroupObject({
            assignedTo: { $addToSet: '$assignedTo' },
        }),
    });

    pipeline.push(...aggregateHelper.aggregationPartMaker({
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
                    imageSrc: 1,
                },
            },
        },
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
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
                    imageSrc: 1,
                },
            },
        },
    }));

    if (isMobile) {
        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'editedBy.user',
            isArray: false,
            addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
            includeSiblings: { editedBy: { date: 1 } },
        }));

        pipeline.push(...aggregateHelper.aggregationPartMaker({
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
                        imageSrc: 1,
                    },
                },
            },
        }));

        pipeline.push(...aggregateHelper.aggregationPartMaker({
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
                        imageSrc: 1,
                    },
                },
            },
        }));
    }

    if (isMobile) {
        pipeline.push({
            $project: aggregateHelper.getProjection({
                creationDate: '$createdBy.date',
            }),
        });
    }

    pipeline.push({
        $project: aggregateHelper.getProjection({
            assignedTo: {
                $filter: {
                    input: '$assignedTo',
                    as: 'oneItem',
                    cond: { $ne: ['$$oneItem', null] },
                },
            },
        }),
    });

    ObjectiveModel.aggregate(pipeline)
        .allowDiskUse(true)
        .exec((err, result) => {
            if (err) {
                return callback(err);
            }

            const body = result[0];

            if (body) {
                if (body.title) {
                    body.title = {
                        en: body.title.en ? _.unescape(body.title.en) : '',
                        ar: body.title.ar ? _.unescape(body.title.ar) : '',
                    };
                }
                if (body.description) {
                    body.description = {
                        en: body.description.en ? _.unescape(body.description.en) : '',
                        ar: body.description.ar ? _.unescape(body.description.ar) : '',
                    };
                }
                if (body.companyObjective) {
                    body.companyObjective = {
                        en: body.companyObjective.en ? _.unescape(body.companyObjective.en) : '',
                        ar: body.companyObjective.ar ? _.unescape(body.companyObjective.ar) : '',
                    };
                }
            }

            callback(null, body);
        });
};
