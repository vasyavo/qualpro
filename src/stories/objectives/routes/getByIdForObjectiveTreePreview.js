const async = require('async');
const mongoose = require('mongoose');
const _ = require('lodash');
const ACL_MODULES = require('./../../../constants/aclModulesNames');
const AccessManager = require('./../../../helpers/access')();
const AggregationHelper = require('./../../../helpers/aggregationCreater');
const ObjectiveModel = require('./../../../types/objective/model');
const $defProjection = require('./../reusable-components/$defProjection');

const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const queryRun = (callback) => {
        const id = ObjectId(req.params.id);
        const isMobile = req.isMobile;

        const aggregateHelper = new AggregationHelper($defProjection);
        const pipeline = [];

        pipeline.push({
            $match: {
                $or: [
                    { _id: id },
                    { 'parent.1': id },
                    { 'parent.2': id },
                    { 'parent.3': id },
                    { 'parent.4': id },
                ],
            },
        });

        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'assignedTo',
            addProjection: ['firstName', 'lastName']
                .concat(isMobile ? [] : ['position', 'accessRole', 'imageSrc']),
        }));

        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'createdBy.user',
            isArray: false,
            addProjection: ['_id', 'firstName', 'lastName']
                .concat(isMobile ? [] : ['position', 'accessRole', 'imageSrc']),
            includeSiblings: {
                createdBy: {
                    date: 1,
                },
            },
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
                    },
                },
            }));
        }

        pipeline.push({
            $group: aggregateHelper.getGroupObject({
                assignedTo: {
                    $addToSet: '$assignedTo',
                },
            }),
        });

        if (!isMobile) {
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
        }

        pipeline.push({
            $project: aggregateHelper.getProjection({
                assignedTo: {
                    $filter: {
                        input: '$assignedTo',
                        as: 'oneItem',
                        cond: {
                            $ne: ['$$oneItem', null],
                        },
                    },
                },
            }),
        });

        pipeline.push({
            $project: aggregateHelper.getProjection({
                parentNew: {
                    $cond: {
                        if: { $eq: ['$level', 1] },
                        then: 0,
                        else: {
                            $cond: {
                                if: { $eq: ['$level', 2] },
                                then: '$parent.1',
                                else: {
                                    $cond: {
                                        if: { $eq: ['$level', 3] },
                                        then: '$parent.2',
                                        else: {
                                            $cond: {
                                                if: { $eq: ['$level', 4] },
                                                then: '$parent.3',
                                                else: 0,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                child: [],
            }),
        });

        pipeline.push({
            $group: {
                _id: '$level',
                subTasks: {
                    $addToSet: '$$ROOT',
                },
            },
        });

        ObjectiveModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([

        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.OBJECTIVE, cb);
        },

        (allowed, personnel, cb) => {
            queryRun(cb);
        },

    ], (err, result) => {
        if (err) {
            return next(err);
        }

        if (result.length) {
            result.forEach((item) => {
                const subTasks = item.subTasks;

                subTasks.forEach((task) => {
                    task.description = {
                        en: _.unescape(_.get(task, 'description.en') || ''),
                        ar: _.unescape(_.get(task, 'description.ar') || ''),
                    };
                });
            });
        }

        next({
            status: 200,
            body: result,
        });
    });
};
