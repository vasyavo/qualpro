const _ = require('underscore');
const lodash = require('lodash');
const AggregationHelper = require('./../../../helpers/aggregationCreater');
const ObjectiveModel = require('././../../../types/objective/model');
const $defProjection = require('../reusable-components/defProjection');

module.exports = (options, callback) => {
    let pipeLine = [];
    const id = options.id;
    const isMobile = options.isMobile || false;

    const aggregateHelper = new AggregationHelper($defProjection);

    pipeLine.push({
        $match: { _id: id },
    });

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from: 'personnels',
        key: 'assignedTo',
        addProjection: ['firstName', 'lastName'].concat(isMobile ? [] : ['position', 'accessRole']),
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
        addProjection: ['_id', 'firstName', 'lastName'].concat(isMobile ? [] : ['position', 'accessRole']),
        includeSiblings: { createdBy: { date: 1 } },
    }));

    pipeLine.push({
        $unwind: {
            path: '$assignedTo',
            preserveNullAndEmptyArrays: true,
        },
    });

    if (!isMobile) {
        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
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

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
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

    pipeLine.push({
        $group: aggregateHelper.getGroupObject({
            assignedTo: { $addToSet: '$assignedTo' },
        }),
    });

    if (!isMobile) {
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
    }

    const pipeObject = {
        $project: aggregateHelper.getProjection({
            assignedTo: {
                $filter: {
                    input: '$assignedTo',
                    as: 'oneItem',
                    cond: { $ne: ['$$oneItem', null] },
                },
            },
        }),
    };

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

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                creationDate: '$createdBy.date',
            }),
        });
    }

    pipeLine.push(pipeObject);

    const aggregation = ObjectiveModel.aggregate(pipeLine);

    aggregation.options = {
        allowDiskUse: true,
    };

    aggregation.exec((err, response) => {
        if (err) {
            return callback(err);
        }

        const body = response[0];

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
