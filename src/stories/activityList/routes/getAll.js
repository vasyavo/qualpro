const async = require('async');
const CONSTANTS = require('../../../constants/mainConstants');
const ACL_MODULES = require('../../../constants/aclModulesNames');
const CONTENT_TYPES = require('../../../public/js/constants/contentType');
const access = require('../../../helpers/access')();
const FilterMapper = require('../../../helpers/filterMapper');
const ActivityListModel = require('./../../../types/activityList/model');
const MODULE_NAMES = require('../../../public/js/constants/moduleNamesForActivity');
const getUserInfo = require('../reusable-components/getUserInfo');
const getAllPipelineActivity = require('../reusable-components/getAllPipelineActivity');

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

        /*
         * @feature
         * @see https://foxtrapp.myjetbrains.com/youtrack/issue/QP-848
         * @description Send all activities from 00:00:00 3 days ago.
         */
        if (isMobile) {
            filter.time = filter.time || {
                names: '3 days ago',
                type: 'date',
                values: [
                    new Date().addDays(-3),
                    new Date(),
                ],
            };
        }
        /* QP-848 end */

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

        async.waterfall([
            async.apply(getUserInfo, uid),

            (currentUser, cb) => {
                const pipeLine = getAllPipelineActivity({
                    queryObject,
                    searchFieldsArray,
                    filterSearch,
                    limit,
                    skip,
                    currentUser,
                    positionFilter,
                    isMobile,
                });

                const aggregation = ActivityListModel.aggregate(pipeLine);

                aggregation.exec(cb);
            },

            (response, cb) => {
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

                cb(null, response);
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
