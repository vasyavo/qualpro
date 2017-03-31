const async = require('async');
const _ = require('underscore');
const lodash = require('lodash');
const mongoose = require('mongoose');
const ACL_MODULES = require('./../../../constants/aclModulesNames');
const CONTENT_TYPES = require('./../../../public/js/constants/contentType');
const ACL_CONSTANTS = require('./../../../constants/aclRolesNames');
const CONSTANTS = require('./../../../constants/mainConstants');
const AggregationHelper = require('./../../../helpers/aggregationCreater');
const ObjectiveModel = require('././../../../types/objective/model');
const PersonnelModel = require('./../../../types/personnel/model');
const FilterMapper = require('./../../../helpers/filterMapper');
const coveredByMe = require('./../../../helpers/coveredByMe');
const access = require('./../../../helpers/access')();
const detectObjectivesForSubordinates = require('../../../reusableComponents/detectObjectivesForSubordinates');
const $defProjection = require('../reusable-components/defProjection');
const getAllPipeLine = require('../reusable-components/getAllPipeline');
const getAllPipeLineTrue = require('../reusable-components/getAllPipeLineTrue');

const ObjectId = mongoose.Types.ObjectId;

module.exports = function (req, res, next) {
    const session = req.session;
    const accessRoleLevel = session.level;
    const userId = session.uId;

    function queryRun(personnel) {
        const query = req.query;
        const filter = query.filter || {};
        const page = query.page || 1;
        const limit = query.count * 1 || parseInt(CONSTANTS.LIST_COUNT, 10);
        const skip = (page - 1) * limit;
        const isMobile = req.isMobile;
        let aggregateHelper;
        const filterMapper = new FilterMapper();
        const filterSearch = filter.globalSearch || '';
        let positionFilter = {};
        let ids;
        const uId = req.session.uId;
        const currentUserLevel = req.session.level;
        const myCC = filter.myCC;
        const cover = filter.cover;
        let arrayOfSubordinateUsersId = [];

        const searchFieldsArray = [
            'title.en',
            'title.ar',
            'description.en',
            'description.ar',
            'objectiveType',
            'priority',
            'status',
            'country.name.en',
            'country.name.ar',
            'region.name.en',
            'region.name.ar',
            'subRegion.name.en',
            'subRegion.name.ar',
            'retailSegment.name.en',
            'retailSegment.name.ar',
            'outlet.name.en',
            'outlet.name.ar',
            'branch.name.en',
            'branch.name.ar',
            'createdBy.user.firstName.en',
            'createdBy.user.lastName.en',
            'createdBy.user.firstName.ar',
            'createdBy.user.lastName.ar',
            'createdBy.user.position.name.en',
            'createdBy.user.position.name.ar',
            'assignedTo.firstName.en',
            'assignedTo.lastName.en',
            'assignedTo.firstName.ar',
            'assignedTo.lastName.ar',
            'assignedTo.position.name.ar',
            'assignedTo.position.name.en',
        ];

        delete filter.globalSearch;
        delete filter.myCC;


        const queryObject = filterMapper.mapFilter({
            contentType: CONTENT_TYPES.INSTORETASKS,
            filter: query.filter || {},
            personnel,
        });

        if (cover || isMobile) {
            delete queryObject.region;
            delete queryObject.subRegion;
            delete queryObject.branch;
        }

        if (query.personnelTasks) {
            $defProjection.context = 1;
        }

        if (query._ids) {
            ids = query._ids.split(',');
            ids = _.map(ids, (id) => {
                return ObjectId(id);
            });
            queryObject._id = {
                $in: ids,
            };
        }

        if (queryObject.position && queryObject.position.$in) {
            positionFilter = {
                $or: [
                    {
                        'assignedTo.position': queryObject.position,
                    },
                    {
                        'createdBy.user.position': queryObject.position,
                    },
                ],
            };

            delete queryObject.position;
        }

        queryObject.context = CONTENT_TYPES.INSTORETASKS;

        async.waterfall([
            // if request with myCC, then Appends to queryObject _id of user that subordinate to current user.
            (cb) => {
                if (myCC || isMobile) {
                    PersonnelModel.find({ manager: req.session.uId })
                        .select('_id')
                        .lean()
                        .exec(cb);
                } else {
                    cb(null, true);
                }
            },

            function (arrayOfUserId, cb) {
                if (myCC || isMobile) {
                    // array of subordinate users id, to send on android app
                    arrayOfSubordinateUsersId = arrayOfUserId.map((model) => {
                        return model._id;
                    });
                }
                if (myCC) {
                    queryObject.$and[0].assignedTo.$in = arrayOfSubordinateUsersId;
                }
                coveredByMe(PersonnelModel, ObjectId(req.session.uId), cb);
            },

            function (coveredIds, cb) {
                const pipeLine = [];

                if (!queryObject.cover) {
                    return cb(null, null, coveredIds);
                }

                aggregateHelper = new AggregationHelper($defProjection, queryObject);

                pipeLine.push({
                    $match: {
                        'vacation.cover': ObjectId(uId),
                    },
                });

                pipeLine.push({
                    $lookup: {
                        from: 'objectives',
                        localField: '_id',
                        foreignField: 'assignedTo',
                        as: 'objectives',
                    },
                });

                pipeLine.push({
                    $project: {
                        objectives: 1,
                    },
                });

                pipeLine.push({
                    $unwind: {
                        path: '$objectives',
                        preserveNullAndEmptyArrays: true,
                    },
                });

                pipeLine.push({
                    $project: {
                        _id: '$objectives._id',
                    },
                });

                const aggregation = PersonnelModel.aggregate(pipeLine);

                aggregation.options = {
                    allowDiskUse: true,
                };

                aggregation.exec((err, result) => {
                    if (err) {
                        return cb(err, null, coveredIds);
                    }

                    result = _.pluck(result, '_id');
                    cb(null, result, coveredIds);
                });
            },
            function (objectiveIds, coveredIds, cb) {
                if (objectiveIds) {
                    if (queryObject.$or && Array.isArray(queryObject.$or)) {
                        queryObject.$or.push({ _id: { $in: objectiveIds } });
                    } else {
                        queryObject._id = { $in: objectiveIds };
                    }

                    delete queryObject.cover;
                }

                aggregateHelper = new AggregationHelper($defProjection, queryObject);

                const pipeLine = getAllPipeLine({
                    aggregateHelper,
                    queryObject,
                    positionFilter,
                    isMobile,
                    searchFieldsArray,
                    filterSearch,
                    skip,
                    limit,
                    coveredIds,
                    currentUserLevel,
                    subordinates: arrayOfSubordinateUsersId,
                });

                const aggregation = ObjectiveModel.aggregate(pipeLine);

                aggregation.options = {
                    allowDiskUse: true,
                };

                aggregation.exec(cb);
            },

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            const body = result.length ?
                result[0] : { data: [], total: 0 };

            const subordinatesId = arrayOfSubordinateUsersId.map((ObjectId) => {
                return ObjectId.toString();
            });

            const currentUserId = req.session.uId;

            body.data = detectObjectivesForSubordinates(body.data, subordinatesId, currentUserId);
            body.data.forEach(objective => {
                if (objective.description) {
                    objective.description = {
                        ar: _.unescape(objective.description.ar),
                        en: _.unescape(objective.description.en),
                    };
                }

                if (objective.title) {
                    objective.title = {
                        ar: _.unescape(objective.title.ar),
                        en: _.unescape(objective.title.en),
                    };
                }
            });

            next({
                status: 200,
                body,
            });
        });
    }

    function queryRunForAdmins(personnel) {
        const query = req.query;
        const filter = query.filter || {};
        const page = query.page || 1;
        const limit = query.count * 1 || parseInt(CONSTANTS.LIST_COUNT, 10);
        const skip = (page - 1) * limit;
        const isMobile = req.isMobile;
        const filterMapper = new FilterMapper();
        const filterSearch = filter.globalSearch || '';
        let positionFilter = {};
        let ids;
        const myCC = filter.myCC;

        delete filter.globalSearch;
        delete filter.myCC;

        const queryObject = filterMapper.mapFilter({
            contentType: CONTENT_TYPES.INSTORETASKS,
            filter: query.filter || {},
            personnel,
        });

        if (isMobile) {
            delete queryObject.region;
            delete queryObject.subRegion;
            delete queryObject.branch;
        }

        if (query.personnelTasks) {
            $defProjection.context = 1;
        }

        if (query._ids) {
            ids = query._ids.split(',');
            ids = _.map(ids, (id) => {
                return ObjectId(id);
            });
            queryObject._id = {
                $in: ids,
            };
        }

        if (queryObject.position && queryObject.position.$in) {
            positionFilter = {
                $or: [
                    {
                        'assignedTo.position': queryObject.position,
                    },
                    {
                        'createdBy.user.position': queryObject.position,
                    },
                ],
            };

            delete queryObject.position;
        }

        const setSubordinateId = [];

        queryObject.context = CONTENT_TYPES.INSTORETASKS;

        async.waterfall([
            (cb) => {
                if (myCC || isMobile) {
                    return PersonnelModel.distinct('_id', {
                        manager: userId,
                    }).exec((err, setAvailableSubordinateId) => {
                        if (err) {
                            return cb(err);
                        }

                        setSubordinateId.push(...setAvailableSubordinateId);

                        cb(null);
                    });
                }

                cb(null);
            },
            (cb) => {
                if (myCC) {
                    _.set(queryObject, '$and[0].assignedTo.$in', setSubordinateId);
                }

                const pipeLine = getAllPipeLineTrue({
                    queryObject,
                    positionFilter,
                    isMobile,
                    filterSearch,
                    skip,
                    limit,
                    personnel,
                    setSubordinateId,
                });

                const aggregation = ObjectiveModel.aggregate(pipeLine);

                aggregation.options = {
                    allowDiskUse: true,
                };

                aggregation.exec(cb);
            },

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            const body = result.length ?
                result[0] : { data: [], total: 0 };

            body.data.forEach(objective => {
                if (objective.description) {
                    objective.description = {
                        ar: _.unescape(objective.description.ar),
                        en: _.unescape(objective.description.en),
                    };
                }

                if (objective.title) {
                    objective.title = {
                        ar: _.unescape(objective.title.ar),
                        en: _.unescape(objective.title.en),
                    };
                }
            });

            next({
                status: 200,
                body,
            });
        });
    }

    access.getReadAccess(req, ACL_MODULES.IN_STORE_REPORTING, (err, allowed, personnel) => {
        if (err) {
            return next(err);
        }

        if (!allowed) {
            err = new Error();
            err.status = 403;

            return next(err);
        }

        const adminFromCMS = req.query.filter && req.query.filter.tabName === 'all';
        const adminFromMobile = req.isMobile && [
            ACL_CONSTANTS.COUNTRY_ADMIN,
            ACL_CONSTANTS.AREA_MANAGER,
            ACL_CONSTANTS.AREA_IN_CHARGE,
        ].indexOf(accessRoleLevel) !== -1;

        if (adminFromCMS) {
            delete req.query.filter.tabName;
        }

        if (adminFromCMS || adminFromMobile) {
            queryRunForAdmins(personnel);
        } else {
            queryRun(personnel);
        }
    });
};
