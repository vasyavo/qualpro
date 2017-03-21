const _ = require('lodash');

const CONTENT_TYPES = require('./../../../public/js/constants/contentType');

const AggregationHelper = require('./../../../helpers/aggregationCreater');
const GetImage = require('./../../../helpers/getImages');

const ObjectiveModel = require('./../../../types/objective/model');

const getImage = new GetImage();

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
        addProjection: ['firstName', 'lastName'].concat(isMobile ? [] : ['position', 'accessRole']),
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'files',
        key: 'attachments',
        addProjection: ['contentType', 'originalName', 'createdBy'],
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
        addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
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
                },
            },
        },
    }));

    if (isMobile) {
        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'editedBy.user',
            isArray: false,
            addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
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
        .exec((err, response) => {
            if (err) {
                return callback(err);
            }

            const objective = response[0];

            if (!objective || !Object.keys(objective).length) {
                return callback(null, objective);
            }

            const setFileId = _.map(objective.attachments, '_id');
            const setPersonnelId = [
                _.get(objective, 'createdBy.user._id'),
                ..._.map(objective.assignedTo, '_id'),
            ];

            const options = {
                data: {
                    [CONTENT_TYPES.PERSONNEL]: setPersonnelId,
                    [CONTENT_TYPES.FILES]: setFileId,
                },
            };

            getImage.getImages(options, (err, result) => {
                if (err) {
                    return callback(err);
                }

                const setOptions = {
                    response: objective,
                    imgsObject: result,
                    fields: {
                        [CONTENT_TYPES.PERSONNEL]: [['assignedTo'], 'createdBy.user'],
                        [CONTENT_TYPES.FILES]: [['attachments']],
                    },
                };

                getImage.setIntoResult(setOptions, (model) => {
                    if (model) {
                        if (model.title) {
                            model.title = {
                                en: model.title.en ? _.unescape(model.title.en) : '',
                                ar: model.title.ar ? _.unescape(model.title.ar) : '',
                            };
                        }
                        if (model.description) {
                            model.description = {
                                en: model.description.en ? _.unescape(model.description.en) : '',
                                ar: model.description.ar ? _.unescape(model.description.ar) : '',
                            };
                        }
                        if (model.companyObjective) {
                            model.companyObjective = {
                                en: model.companyObjective.en ? _.unescape(model.companyObjective.en) : '',
                                ar: model.companyObjective.ar ? _.unescape(model.companyObjective.ar) : '',
                            };
                        }
                    }
                    callback(null, model);
                });
            });
        });
};
