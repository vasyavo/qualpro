const async = require('async');
const _ = require('underscore');
const lodash = require('lodash');
const mongoose = require('mongoose');
const ACL_MODULES = require('./../../../constants/aclModulesNames');
const ACL_CONSTANTS = require('./../../../constants/aclRolesNames');
const CONTENT_TYPES = require('./../../../public/js/constants/contentType');
const AggregationHelper = require('./../../../helpers/aggregationCreater');
const ObjectiveModel = require('././../../../types/objective/model');
const PersonnelModel = require('./../../../types/personnel/model');
const FilterMapper = require('./../../../helpers/filterMapper');
const coveredByMe = require('./../../../helpers/coveredByMe');
const access = require('./../../../helpers/access')();
const detectObjectivesForSubordinates = require('../../../reusableComponents/detectObjectivesForSubordinates');
const getAllPipeLine = require('../reusable-components/getAllPipeline');
const getAllPipeLineTrue = require('../reusable-components/getAllPipeLineTrue');
const $defProjection = require('../reusable-components/defProjection');

const ObjectId = mongoose.Types.ObjectId;

module.exports = function (req, res, next) {
    const session = req.session;
    const accessRoleLevel = session.level;

    function queryRun(personnel) {
        const query = req.query;
        const aggregateHelper = new AggregationHelper($defProjection);
        const filterMapper = new FilterMapper();
        const lastLogOut = new Date(query.lastLogOut);
        const queryObject = query.filter ? filterMapper.mapFilter({
            contentType: CONTENT_TYPES.INSTORETASKS,
            filter: query.filter || {},
            personnel,
        }) : {};
        const currentUserLevel = req.session.level;
        let pipeLine;
        let positionFilter;
        let aggregation;
        let ids;
        let arrayOfSubordinateUsersId = [];

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

        aggregateHelper.setSyncQuery(queryObject, lastLogOut);

        async.waterfall([
            (cb) => {
                PersonnelModel.find({ manager: req.session.uId })
                    .select('_id')
                    .lean()
                    .exec(cb);
            },

            function (arrayOfUserId, cb) {
                arrayOfSubordinateUsersId = arrayOfUserId.map((model) => {
                    return model._id;
                });
                coveredByMe(PersonnelModel, ObjectId(req.session.uId), cb);
            },
            function (coveredIds, cb) {
                pipeLine = getAllPipeLine({
                    aggregateHelper,
                    queryObject,
                    positionFilter,
                    isMobile: req.isMobile,
                    coveredIds,
                    forSync: true,
                    currentUserLevel,
                    subordinates: arrayOfSubordinateUsersId,
                });

                aggregation = ObjectiveModel.aggregate(pipeLine);

                aggregation.options = {
                    allowDiskUse: true,
                };

                aggregation.exec(cb);
            },
        ], (err, response) => {
            if (err) {
                return next(err);
            }

            const body = response.length ?
                response[0] : { data: [], total: 0 };

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
        const filterMapper = new FilterMapper();
        const lastLogOut = new Date(query.lastLogOut);
        const queryObject = query.filter ? filterMapper.mapFilter({
            contentType: CONTENT_TYPES.INSTORETASKS,
            filter: query.filter || {},
            personnel,
        }) : {};
        let pipeLine;
        let positionFilter;
        let aggregation;
        let ids;

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

        queryObject.$or = [{
            'editedBy.date': {
                $gt: lastLogOut,
            },
        }, {
            'createdBy.date': {
                $gt: lastLogOut,
            },
        }];

        async.waterfall([
            function (cb) {
                pipeLine = getAllPipeLineTrue({
                    queryObject,
                    positionFilter,
                    isMobile: true,
                    personnel,
                });

                aggregation = ObjectiveModel.aggregate(pipeLine);

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

            body.data.forEach(element => {
                if (element.description) {
                    element.description = {
                        ar: _.unescape(element.description.ar),
                        en: _.unescape(element.description.en),
                    };
                }

                if (element.title) {
                    element.title = {
                        ar: _.unescape(element.title.ar),
                        en: _.unescape(element.title.en),
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

        const adminFromMobile = req.isMobile && [
            ACL_CONSTANTS.COUNTRY_ADMIN,
            ACL_CONSTANTS.AREA_MANAGER,
            ACL_CONSTANTS.AREA_IN_CHARGE,
        ].indexOf(accessRoleLevel) !== -1;

        if (adminFromMobile) {
            queryRunForAdmins(personnel);
        } else {
            queryRun(personnel);
        }
    });
};
