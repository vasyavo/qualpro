const _ = require('underscore');
const lodash = require('lodash');
const mongoose = require('mongoose');
const ACL_MODULES = require('./../../../constants/aclModulesNames');
const AggregationHelper = require('./../../../helpers/aggregationCreater');
const ObjectiveModel = require('././../../../types/objective/model');
const access = require('./../../../helpers/access')();
const $defProjection = require('../reusable-components/defProjection');

const ObjectId = mongoose.Types.ObjectId;

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
            addProjection: ['contentType', 'originalName', 'createdBy', 'preview'],
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'createdBy.user',
            isArray: false,
            addProjection: ['_id', 'firstName', 'lastName', 'imageSrc'].concat(isMobile ? [] : ['position', 'accessRole']),
            includeSiblings: { createdBy: { date: 1 } },
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key: 'country',
            isArray: true,
            addProjection: ['_id', 'name'],
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'outlets',
            key: 'outlet',
            isArray: true,
            addProjection: ['_id', 'name'],
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key: 'region',
            isArray: true,
            addProjection: ['_id', 'name'],
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key: 'subRegion',
            isArray: true,
            addProjection: ['_id', 'name'],
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'retailSegments',
            key: 'retailSegment',
            isArray: true,
            addProjection: ['_id', 'name'],
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'assignedTo',
            addProjection: ['position', 'accessRole', 'firstName', 'lastName', 'imageSrc'],
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
                            imageSrc: 1,
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
                            imageSrc: 1,
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
            addProjection: ['_id', 'position', 'firstName', 'lastName', 'accessRole', 'imageSrc'],
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
                        imageSrc: 1,
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
                        imageSrc: 1,
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

        aggregation.exec((err, result) => {
            if (err) {
                return next(err);
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

            next({
                status: 200,
                body,
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
