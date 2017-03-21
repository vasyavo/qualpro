const async = require('async');
const _ = require('underscore');
const lodash = require('lodash');
const mongoose = require('mongoose');
const ACL_MODULES = require('./../../../constants/aclModulesNames');
const ACL_CONSTANTS = require('./../../../constants/aclRolesNames');
const CONTENT_TYPES = require('./../../../public/js/constants/contentType');
const AggregationHelper = require('./../../../helpers/aggregationCreater');
const GetImagesHelper = require('./../../../helpers/getImages');
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
const getImagesHelper = new GetImagesHelper();

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

                aggregation.exec((err, response) => {
                    if (err) {
                        return next(err);
                    }
                    if (response.length) {
                        response[0].data = _.map(response[0].data, (element) => {
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

                            return element;
                        });
                    }

                    const result = response && response[0] ? response[0] : { data: [], total: 0 };

                    cb(null, result);
                });
            },
        ], (err, response) => {
            let idsPersonnel = [];
            let idsFile = [];
            const options = {
                data: {},
            };
            if (err) {
                return next(err);
            }

            _.map(response.data, (model) => {
                idsFile = _.union(idsFile, _.map(model.attachments, '_id'));
                idsPersonnel.push(model.createdBy.user._id);
                idsPersonnel = _.union(idsPersonnel, _.map(model.assignedTo, '_id'));
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
                fieldNames[CONTENT_TYPES.PERSONNEL] = [['assignedTo'], 'createdBy.user'];
                fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
                setOptions.fields = fieldNames;

                getImagesHelper.setIntoResult(setOptions, (response) => {
                    const subordinatesId = arrayOfSubordinateUsersId.map((ObjectId) => {
                        return ObjectId.toString();
                    });
                    const currentUserId = req.session.uId;

                    response.data = detectObjectivesForSubordinates(response.data, subordinatesId, currentUserId);

                    next({ status: 200, body: response });
                });
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

                aggregation.exec((err, response) => {
                    if (err) {
                        return next(err);
                    }
                    if (response.length) {
                        response[0].data = _.map(response[0].data, (element) => {
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

                            return element;
                        });
                    }

                    const result = response && response[0] ? response[0] : { data: [], total: 0 };

                    cb(null, result);
                });
            },
        ], (err, response) => {
            let idsPersonnel = [];
            let idsFile = [];
            const options = {
                data: {},
            };
            if (err) {
                return next(err);
            }

            _.map(response.data, (model) => {
                idsFile = _.union(idsFile, _.map(model.attachments, '_id'));
                idsPersonnel.push(model.createdBy.user._id);
                idsPersonnel = _.union(idsPersonnel, _.map(model.assignedTo, '_id'));
            });

            idsPersonnel = lodash.uniqBy(idsPersonnel, 'id');
            options.data[CONTENT_TYPES.PERSONNEL] = idsPersonnel;
            options.data[CONTENT_TYPES.FILES] = idsFile;

            getImagesHelper.getImages(options, (err, result) => {
                if (err) {
                    return next(err);
                }

                const fieldNames = {};

                const setOptions = {
                    response,
                    imgsObject: result,
                };
                fieldNames[CONTENT_TYPES.PERSONNEL] = [['assignedTo'], 'createdBy.user'];
                fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
                setOptions.fields = fieldNames;

                getImagesHelper.setIntoResult(setOptions, (response) => {
                    next({ status: 200, body: response });
                });
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
