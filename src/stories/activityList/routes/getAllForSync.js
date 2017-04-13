const async = require('async');
const _ = require('lodash');
const ACL_MODULES = require('../../../constants/aclModulesNames');
const CONTENT_TYPES = require('../../../public/js/constants/contentType');
const access = require('../../../helpers/access')();
const FilterMapper = require('../../../helpers/filterMapper');
const ActivityListModel = require('../../../types/activityList/model');
const AggregationHelper = require('../../../helpers/aggregationCreater');
const MODULE_NAMES = require('../../../public/js/constants/moduleNamesForActivity');
const getUserInfo = require('../reusable-components/getUserInfo');
const getAllPipelineActivity = require('../reusable-components/getAllPipelineActivity');

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
    function queryRun(personnel) {
        const query = req.query;
        const isMobile = req.isMobile;
        const filterMapper = new FilterMapper();
        const filter = query.filter || {};
        const lastLogOut = new Date(query.lastLogOut);
        let key;
        let aggregation;
        let pipeLine;
        const sort = {
            'createdBy.date': -1,
        };

        let queryObject = filterMapper.mapFilter({
            contentType: CONTENT_TYPES.ACTIVITYLIST,
            filter,
            personnel,
        });

        const afterIteMTypeQuery = {
            region: queryObject.region,
            subRegion: queryObject.subRegion,
            retailSegment: queryObject.retailSegment,
            outlet: queryObject.outlet,
            branch: queryObject.branch,
        };

        delete queryObject.region;
        delete queryObject.subRegion;
        delete queryObject.retailSegment;
        delete queryObject.outlet;
        delete queryObject.branch;

        const aggregateHelper = new AggregationHelper($defProjection, queryObject);

        delete queryObject.archived;

        // aggregateHelper.setSyncQuery(queryObject, lastLogOut);
        queryObject = {
            'createdBy.date': { $gte: lastLogOut },
        };

        for (key in sort) {
            sort[key] = parseInt(sort[key], 10);
        }

        getUserInfo(req.session.uId, (err, currentUser) => {
            pipeLine = getAllPipelineActivity({
                queryObject,
                aggregateHelper,
                sort,
                isMobile,
                currentUser,
                afterIteMTypeQuery,
                forSync: true,
            });

            aggregation = ActivityListModel.aggregate(pipeLine);

            aggregation.exec((err, result) => {
                if (err) {
                    return next(err);
                }

                const body = result.length ?
                    result[0] : { data: [], total: 0 };

                body.data.forEach(element => {
                    element.module = MODULE_NAMES[element.module._id];
                });

                next({
                    status: 200,
                    body,
                });
            });
        });
    }

    async.waterfall([

        async.apply(access.getReadAccess, req, ACL_MODULES.PERSONNEL),

        (allowed, personnel) => {
            queryRun(personnel);
        },

    ]);
};
