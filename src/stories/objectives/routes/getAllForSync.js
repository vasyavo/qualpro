const async = require('async');
const mongoose = require('mongoose');
const _ = require('lodash');
const detectObjectivesForSubordinates = require('./../../../reusableComponents/detectObjectivesForSubordinates');
const ACL_MODULES = require('./../../../constants/aclModulesNames');
const CONTENT_TYPES = require('./../../../public/js/constants/contentType');
const ACL_CONSTANTS = require('./../../../constants/aclRolesNames');
const AccessManager = require('./../../../helpers/access')();
const AggregationHelper = require('./../../../helpers/aggregationCreater');
const coveredByMe = require('./../../../helpers/coveredByMe');
const ObjectiveModel = require('./../../../types/objective/model');
const PersonnelModel = require('./../../../types/personnel/model');
const $defProjection = require('./../reusable-components/$defProjection');
const getAllPipeline = require('./../reusable-components/getAllPipeline');
const getAllPipelineTrue = require('./../reusable-components/getAllPipelineTrue');

const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const session = req.session;
    const userId = session.uId;
    const accessRoleLevel = session.level;

    const queryRunForAdmins = (personnel, callback) => {
        const query = req.query;
        const lastLogOut = new Date(query.lastLogOut);
        const queryObject = {
            context: CONTENT_TYPES.OBJECTIVES,
        };

        queryObject.$or = [
            {
                'editedBy.date': {
                    $gt: lastLogOut,
                },
            },
            {
                'createdBy.date': {
                    $gt: lastLogOut,
                },
            },
        ];

        const pipeLine = getAllPipelineTrue({
            queryObject,
            isMobile: true,
            personnel,
            currentUserLevel: accessRoleLevel,
        });

        ObjectiveModel.aggregate(pipeLine)
            .allowDiskUse(true)
            .exec((err, result) => {
                if (err) {
                    return next(err);
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

    const queryRun = (personnel, callback) => {
        const query = req.query;
        const lastLogOut = new Date(query.lastLogOut);
        const queryObject = {
            context: CONTENT_TYPES.OBJECTIVES,
        };

        const aggregateHelper = new AggregationHelper($defProjection);

        aggregateHelper.setSyncQuery(queryObject, lastLogOut);

        const setSubordinateObjectId = [];

        async.waterfall([

            (cb) => {
                PersonnelModel.distinct('_id', {
                    manager: userId,
                }).exec((err, setAvailableSubordinateId) => {
                    if (err) {
                        return cb(err);
                    }

                    setSubordinateObjectId.push(...setAvailableSubordinateId);

                    cb(null);
                });
            },

            (cb) => {
                coveredByMe(PersonnelModel, ObjectId(userId), cb);
            },

            (coveredIds, cb) => {
                const pipeLine = getAllPipeline({
                    aggregateHelper,
                    queryObject,
                    isMobile: true,
                    forSync: true,
                    personnel: ObjectId(userId),
                    coveredIds,
                    currentUserLevel: accessRoleLevel,
                    subordinates: setSubordinateObjectId,
                });

                ObjectiveModel.aggregate(pipeLine)
                    .allowDiskUse(true)
                    .exec(cb);
            },

        ], (err, result) => {
            if (err) {
                return next(err);
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

            const setSubordinateStringId = setSubordinateObjectId.map((ObjectId) => {
                return ObjectId.toString();
            });

            body.data = detectObjectivesForSubordinates(body.data, setSubordinateStringId, userId);

            callback(null, body);
        });
    };

    async.waterfall([

        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.OBJECTIVE, cb);
        },

        (allowed, personnel, cb) => {
            const isAdmin = [
                ACL_CONSTANTS.COUNTRY_ADMIN,
                ACL_CONSTANTS.AREA_MANAGER,
                ACL_CONSTANTS.AREA_IN_CHARGE,
            ].indexOf(accessRoleLevel) !== -1;

            if (isAdmin) {
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
