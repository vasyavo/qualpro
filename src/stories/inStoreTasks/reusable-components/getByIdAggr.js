const _ = require('underscore');
const lodash = require('lodash');
const CONTENT_TYPES = require('./../../../public/js/constants/contentType');
const AggregationHelper = require('./../../../helpers/aggregationCreater');
const GetImagesHelper = require('./../../../helpers/getImages');
const ObjectiveModel = require('././../../../types/objective/model');
const $defProjection = require('../reusable-components/defProjection');

const getImagesHelper = new GetImagesHelper();

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
        let idsPersonnel;
        response = response[0];
        const options = {
            data: {},
        };
        if (err) {
            return callback(err);
        }

        if (!response || !Object.keys(response).length) {
            return callback(null, response);
        }

        const idsFile = _.map(response.attachments, '_id');
        idsPersonnel = _.union([response.createdBy.user._id], _.map(response.assignedTo, '_id'));
        idsPersonnel = lodash.uniqBy(idsPersonnel, 'id');
        options.data[CONTENT_TYPES.PERSONNEL] = idsPersonnel;
        options.data[CONTENT_TYPES.FILES] = idsFile;

        getImagesHelper.getImages(options, (err, result) => {
            const fieldNames = {};
            if (err) {
                return callback(err);
            }

            const setOptions = {
                response,
                imgsObject: result,
            };
            fieldNames[CONTENT_TYPES.PERSONNEL] = [['assignedTo'], 'createdBy.user'];
            fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
            setOptions.fields = fieldNames;

            getImagesHelper.setIntoResult(setOptions, (model) => {
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
