const _ = require('underscore');
const lodash = require('lodash');
const mongoose = require('mongoose');
const ACL_MODULES = require('./../../../constants/aclModulesNames');
const CONTENT_TYPES = require('./../../../public/js/constants/contentType');
const AggregationHelper = require('./../../../helpers/aggregationCreater');
const GetImagesHelper = require('./../../../helpers/getImages');
const ObjectiveModel = require('././../../../types/objective/model');
const access = require('./../../../helpers/access')();
const $defProjection = require('../reusable-components/defProjection');

const ObjectId = mongoose.Types.ObjectId;
const getImagesHelper = new GetImagesHelper();

module.exports = function (req, res, next) {
    function queryRun() {
        const id = req.params.id;
        let pipeLine = [];
        const isMobile = req.isMobile;

        const aggregateHelper = new AggregationHelper($defProjection);

        pipeLine.push({
            $match: { _id: ObjectId(id) },
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'branches',
            key: 'branch',
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'files',
            key: 'attachments',
            addProjection: ['contentType', 'originalName', 'createdBy'],
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'createdBy.user',
            isArray: false,
            addProjection: ['_id', 'firstName', 'lastName'].concat(isMobile ? [] : ['position', 'accessRole']),
            includeSiblings: { createdBy: { date: 1 } },
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'assignedTo',
            addProjection: ['position', 'accessRole', 'firstName', 'lastName'],
        }));

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

        pipeLine.push({
            $unwind: {
                path: '$history',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'history.assignedTo',
            isArray: false,
            addProjection: ['_id', 'position', 'firstName', 'lastName', 'accessRole'],
            includeSiblings: { history: { index: 1 } },
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'accessRoles',
            key: 'history.assignedTo.accessRole',
            isArray: false,
            addProjection: ['_id', 'name', 'level'],
            includeSiblings: {
                history: {
                    index: 1,
                    assignedTo: {
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
            key: 'history.assignedTo.position',
            isArray: false,
            includeSiblings: {
                history: {
                    index: 1,
                    assignedTo: {
                        _id: 1,
                        accessRole: 1,
                        firstName: 1,
                        lastName: 1,
                    },
                },
            },
        }));

        pipeLine.push({
            $group: aggregateHelper.getGroupObject({
                history: {
                    $addToSet: {
                        assignedTo: '$history.assignedTo',
                        index: '$history.index',
                    },
                },
            }),
        });

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                history: {
                    $filter: {
                        input: '$history',
                        as: 'oneItem',
                        cond: { $ne: ['$$oneItem.assignedTo', {}] },
                    },
                },
            }),
        });

        pipeLine.push(...aggregateHelper.aggregationPartMaker({
            from: 'visibilityForms',
            key: 'form._id',
            as: 'additionalFormData',
            isArray: false,
            addProjection: ['_id', 'after'],
        }));

        const aggregation = ObjectiveModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true,
        };

        aggregation.exec((err, response) => {
            let idsPersonnel;
            const options = {
                data: {},
            };
            if (err) {
                return next(err);
            }

            if (!response.length) {
                return next({ status: 200, body: {} });
            }

            response = response[0];

            const idsFile = _.map(response.attachments, '_id');
            idsPersonnel = _.union([response.createdBy.user._id], _.map(response.assignedTo, '_id'));
            response.history.forEach((history) => {
                idsPersonnel.push(history.assignedTo._id);
            });

            idsPersonnel = lodash.uniqBy(idsPersonnel, 'id');

            options.data[CONTENT_TYPES.PERSONNEL] = idsPersonnel;
            options.data[CONTENT_TYPES.FILES] = idsFile;

            getImagesHelper.getImages(options, (err, result) => {
                const fieldNames = {};
                if (err) {
                    return next(err);
                }

                const setOptions = {
                    response,
                    imgsObject: result,
                };
                fieldNames[CONTENT_TYPES.PERSONNEL] = [['assignedTo'], ['history.assignedTo'], 'createdBy.user'];
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
                    next({ status: 200, body: model });
                });
            });
        });
    }

    access.getReadAccess(req, ACL_MODULES.IN_STORE_REPORTING, (err, allowed) => {
        if (err) {
            return next(err);
        }
        if (!allowed) {
            err = new Error();
            err.status = 403;

            return next(err);
        }

        queryRun();
    });
};
