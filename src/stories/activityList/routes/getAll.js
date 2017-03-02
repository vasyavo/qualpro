const async = require('async');
const _ = require('lodash');
const CONSTANTS = require('../../../constants/mainConstants');
const ACL_MODULES = require('../../../constants/aclModulesNames');
const CONTENT_TYPES = require('../../../public/js/constants/contentType');
const access = require('../../../helpers/access')();
const FilterMapper = require('../../../helpers/filterMapper');
const ActivityListModel = require('./../../../types/activityList/model');
const AggregationHelper = require('../../../helpers/aggregationCreater');
const MODULE_NAMES = require('../../../public/js/constants/moduleNamesForActivity');
const getUserInfo = require('../reusable-components/getUserInfo');
const GetImageHelper = require('../../../helpers/getImages');
const getAllPipelineActivity = require('../reusable-components/getAllPipelineActivity');

const getImagesHelper = new GetImageHelper();

const $defProjection = {
    _id: 1,
    module: 1,
    actionType: 1,
    itemType: 1,
    itemDetails: 1,
    createdBy: 1,
    country: 1,
    region: 1,
    subRegion: 1,
    branch: 1,
    retailSegment: 1,
    outlet: 1,
    itemId: 1,
    itemName: 1,
    accessRoleLevel: 1,
    assignedTo: 1,
    creationDate: 1,
    personnels: 1,
    checkPersonnel: 1,
};

module.exports = (req, res, next) => {
    function queryRun(activity, callback) {
        const isMobile = req.isMobile;
        const query = req.query;
        const page = query.page || 1;
        const limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
        const skip = (page - 1) * limit;
        const uid = req.session.uId;
        const filterMapper = new FilterMapper();
        const filter = query.filter || {};
        const filterSearch = filter.globalSearch || '';
        const sort = {
            'createdBy.date': -1,
        };

        const searchFieldsArray = [
            'createdBy.user.firstName.en',
            'createdBy.user.firstName.ar',
            'createdBy.user.lastName.en',
            'createdBy.user.lastName.ar',
            'module.name.ar',
            'module.name.en',
            'type',
        ];

        if (filter.module && filter.module.values) {
            filter.module.values[0] = parseInt(filter.module.values[0], 10);
        }

        delete filter.globalSearch;

        const queryObject = filterMapper.mapFilter({
            contentType: CONTENT_TYPES.ACTIVITYLIST,
            filter,
            personnel: activity,
        });

        delete queryObject.archived;

        const positionFilter = {};

        if (queryObject.position && queryObject.position.$in) {
            positionFilter['createdBy.user.position'] = queryObject.position;

            delete queryObject.position;
        }

        for (const key in sort) {
            sort[key] = parseInt(sort[key], 10);
        }

        async.waterfall([
            async.apply(getUserInfo, uid),

            (currentUser, cb) => {
                const aggregateHelper = new AggregationHelper($defProjection, queryObject);
                const pipeLine = getAllPipelineActivity({
                    queryObject,
                    aggregateHelper,
                    searchFieldsArray,
                    filterSearch,
                    limit,
                    skip,
                    sort,
                    currentUser,
                    positionFilter,
                    isMobile,
                });

                const aggregation = ActivityListModel.aggregate(pipeLine);

                aggregation.exec(cb);
            },

            (response, cb) => {
                const idsPersonnel = [];

                response = response.length ?
                    response[0] : {
                        data: [],
                        total: 0,
                    };

                if (!response.data.length) {
                    return next({
                        status: 200,
                        body: response,
                    });
                }

                _.forEach(response.data, (model) => {
                    idsPersonnel.push(model.createdBy.user._id);
                });


                const options = {
                    data: {
                        [CONTENT_TYPES.PERSONNEL]: _.uniqBy(idsPersonnel, 'id'),
                    },
                };

                cb(null, {
                    response,
                    options,
                });
            },

            (data, cb) => {
                getImagesHelper.getImages(data.options, (err, result) => {
                    cb(err, {
                        response: data.response,
                        result,
                    });
                });
            },

            (data, cb) => {
                const options = {
                    response: data.response,
                    imgsObject: data.result,
                    fields: {
                        [CONTENT_TYPES.PERSONNEL]: ['createdBy.user'],
                    },
                };

                getImagesHelper.setIntoResult(options, (response) => {
                    cb(null, response);
                });
            },

            (response, cb) => {
                response.data = response.data.map((item) => {
                    item.module = MODULE_NAMES[item.module._id];

                    return item;
                });

                cb(null, response);
            },

        ], callback);
    }

    async.waterfall([

        async.apply(access.getReadAccess, req, ACL_MODULES.ACTIVITY_LIST),

        (allowed, personnel, cb) => {
            queryRun(personnel, cb);
        },

    ], (err, body) => {
        if (err) {
            return next(err);
        }

        return next({
            status: 200,
            body,
        });
    });
};
