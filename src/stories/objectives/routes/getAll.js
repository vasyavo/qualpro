const async = require('async');
const mongoose = require('mongoose');
const _ = require('lodash');
const detectObjectivesForSubordinates = require('./../../../reusableComponents/detectObjectivesForSubordinates');

const ACL_MODULES = require('./../../../constants/aclModulesNames');
const ACL_CONSTANTS = require('./../../../constants/aclRolesNames');
const CONTENT_TYPES = require('./../../../public/js/constants/contentType');
const CONSTANTS = require('./../../../constants/mainConstants');

const AccessManager = require('./../../../helpers/access')();
const AggregationHelper = require('./../../../helpers/aggregationCreater');
const FilterMapper = require('./../../../helpers/filterMapper');
const coveredByMe = require('./../../../helpers/coveredByMe');
const getAllPipeline = require('./../reusable-components/getAllPipeline');
const getAllPipelineTrue = require('./../reusable-components/getAllPipelineTrue');

const ObjectiveModel = require('./../../../types/objective/model');
const PersonnelModel = require('./../../../types/personnel/model');
const $defProjection = require('./../reusable-components/$defProjection');

const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const session = req.session;
    const userId = session.uId;
    const accessRoleLevel = session.level;

    const queryRun = (personnel, callback) => {
        const query = req.query;
        const filter = query.filter || {};
        const page = query.page || 1;
        const limit = query.count * 1 || CONSTANTS.LIST_COUNT;
        const skip = (page - 1) * limit;
        const filterMapper = new FilterMapper();
        const filterSearch = filter.globalSearch || '';
        const isMobile = req.isMobile;

        const searchFieldsArray = [
            'myCC',
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
            'assignedTo._id',
            'assignedTo.firstName.en',
            'assignedTo.lastName.en',
            'assignedTo.firstName.ar',
            'assignedTo.lastName.ar',
            'assignedTo.position.name.ar',
            'assignedTo.position.name.en',
        ];

        const cover = filter.cover;
        const myCC = filter.myCC;

        delete filter.cover;
        delete filter.globalSearch;
        delete filter.myCC;

        const queryObject = filterMapper.mapFilter({
            contentType: CONTENT_TYPES.OBJECTIVES,
            filter,
            personnel,
        });

        if (cover || isMobile) {
            delete queryObject.region;
            delete queryObject.subRegion;
            delete queryObject.branch;
        }

        const aggregateHelper = new AggregationHelper($defProjection, queryObject);

        const positionFilter = {};

        if (queryObject.position && queryObject.position.$in) {
            positionFilter.$or = [
                { 'assignedTo.position': queryObject.position },
                { 'createdBy.user.position': queryObject.position },
            ];

            delete queryObject.position;
        }

        queryObject.context = CONTENT_TYPES.OBJECTIVES;

        const setSubordinateId = [];

        async.waterfall([

            // if request with myCC, then Appends to queryObject _id of user that subordinate to current user.
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

                coveredByMe(PersonnelModel, ObjectId(userId), cb);
            },

            (coveredIds, cb) => {
                const pipeline = getAllPipeline({
                    aggregateHelper,
                    queryObject,
                    positionFilter,
                    isMobile,
                    searchFieldsArray,
                    filterSearch,
                    skip,
                    limit,
                    personnel: ObjectId(userId),
                    coveredIds,
                    subordinates: setSubordinateId,
                    currentUserLevel: accessRoleLevel,
                });

                ObjectiveModel.aggregate(pipeline)
                    .allowDiskUse(true)
                    .exec((err, result) => {
                        if (err) {
                            return cb(err);
                        }

                        const body = result.length ? result[0] : { data: [], total: 0 };

                        cb(null, body);
                    });
            },

            (response, cb) => {
                if (!isMobile) {
                    return cb(null, response);
                }

                const mobilePipeLine = getAllPipeline({
                    aggregateHelper,
                    parentIds: isMobile ? _.map(response.data, '_id') : [],
                    positionFilter,
                    isMobile,
                    searchFieldsArray,
                    filterSearch,
                    skip,
                    limit,
                    currentUserLevel: accessRoleLevel,
                });

                ObjectiveModel.aggregate(mobilePipeLine)
                    .allowDiskUse(true)
                    .exec(cb);
            },

        ], (err, result) => {
            if (err) {
                return callback(err);
            }

            const body = result.length ?
                result[0] : { data: [], total: 0 };

            body.data = body.data.concat(result.data);
            body.total += result.total;

            body.data.forEach(model => {
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
            });

            const subordinatesId = setSubordinateId.map((ObjectId) => {
                return ObjectId.toString();
            });

            body.data = detectObjectivesForSubordinates(body.data, subordinatesId, userId);

            callback(null, body);
        });
    };

    const queryRunForAdmins = (personnel, callback) => {
        const query = req.query;
        const filter = query.filter || {};
        const page = query.page || 1;
        const limit = query.count * 1 || CONSTANTS.LIST_COUNT;
        const skip = (page - 1) * limit;
        const filterMapper = new FilterMapper();
        const filterSearch = filter.globalSearch || '';
        const isMobile = req.isMobile;

        delete filter.cover;
        delete filter.globalSearch;

        const queryObject = filterMapper.mapFilter({
            contentType: CONTENT_TYPES.OBJECTIVES,
            filter,
            personnel,
        });

        const positionFilter = {};

        if (queryObject.position && queryObject.position.$in) {
            positionFilter.$or = [
                { 'assignedTo.position': queryObject.position },
                { 'createdBy.user.position': queryObject.position },
            ];

            delete queryObject.position;
        }

        queryObject.context = CONTENT_TYPES.OBJECTIVES;

        const pipeline = getAllPipelineTrue({
            queryObject,
            positionFilter,
            filterSearch,
            isMobile,
            skip,
            limit,
            personnel,
        });

        ObjectiveModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec((err, result) => {
                if (err) {
                    return callback(err);
                }

                const body = result.length ?
                    result[0] : { data: [], total: 0 };

                body.data.forEach(model => {
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
                });

                callback(null, body);
            });
    };

    async.waterfall([

        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.OBJECTIVE, cb);
        },

        (allowed, personnel, cb) => {
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
                queryRunForAdmins(personnel, cb);
            } else {
                queryRun(personnel, cb);
            }
        },

    ], (err, response) => {
        if (err) {
            return next(err);
        }

        next({
            status: 200,
            body: response,
        });
    });
};
