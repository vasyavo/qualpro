const async = require('async');
const FilterMapper = require('../../../helpers/filterMapper');
const CONTENT_TYPES = require('../../../public/js/constants/contentType.js');
const CONSTANTS = require('../../../constants/mainConstants');
const ACL_MODULES = require('../../../constants/aclModulesNames');
const AggregationHelper = require('../../../helpers/aggregationCreater');
const ConsumersSurveyModel = require('../../../types/consumersSurvey/model');
const filterRetrievedResultOnGetAll = require('../reusable-components/filterRetrievedResultOnGetAll');
const access = require('../../../helpers/access')();
const filterByPersonnelAndLocation = require('../reusable-components/filterByPersonnelAndLocation');

const $defProjection = {
    _id: 1,
    title: 1,
    dueDate: 1,
    startDate: 1,
    country: 1,
    region: 1,
    subRegion: 1,
    retailSegment: 1,
    outlet: 1,
    branch: 1,
    countAll: 1,
    countAnswered: 1,
    status: 1,
    questions: 1,
    location: 1,
    editedBy: 1,
    createdBy: 1,
    creationDate: 1,
    updateDate: 1,
    position: 1,
};

module.exports = (req, res, next) => {
    function queryRun(personnel, callback) {
        const query = req.query;
        const page = query.page || 1;
        const isMobile = req.isMobile;
        const accessRoleLevel = req.session.level;
        const lastLogOut = new Date(query.lastLogOut);
        const limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
        const skip = (page - 1) * limit;
        const filterMapper = new FilterMapper();
        const queryFilter = query.filter || {};

        const sort = query.sort || {
            lastDate: -1,
        };

        delete queryFilter.globalSearch;

        const queryObject = filterMapper.mapFilter({
            contentType: CONTENT_TYPES.CONSUMER_SURVEY,
            filter: queryFilter,
        });

        for (const key in sort) {
            sort[key] = parseInt(sort[key], 10);
        }

        const aggregateHelper = new AggregationHelper($defProjection, queryObject);

        queryObject.$and = [{
            // standard synchronization behaviour
            $or: [{
                'editedBy.date': {
                    $gt: lastLogOut,
                },
            }, {
                'createdBy.date': {
                    $gt: lastLogOut,
                },
            }],
        }, {
            status: { $ne: 'draft' },
        }];

        const pipeline = [];

        pipeline.push({
            $match: queryObject,
        });

        pipeline.push(...filterByPersonnelAndLocation(personnel, personnel._id));

        pipeline.push({
            $project: Object.assign({}, $defProjection, {
                creationDate: '$createdBy.date',
                updateDate: '$editedBy.date',
            }),
        });

        pipeline.push({
            $project: Object.assign({}, $defProjection, {
                lastDate: {
                    $ifNull: [
                        '$editedBy.date',
                        '$createdBy.date',
                    ],
                },
            }),
        });

        pipeline.push({
            $sort: sort,
        });

        pipeline.push(...aggregateHelper.setTotal());

        pipeline.push({
            $skip: skip,
        });

        pipeline.push({
            $limit: limit,
        });

        pipeline.push(...aggregateHelper.groupForUi());

        async.waterfall([
            (cb) => {
                const aggregation = ConsumersSurveyModel.aggregate(pipeline);

                aggregation.options = {
                    allowDiskUse: true,
                };

                aggregation.exec(cb);
            },

            (result, cb) => {
                filterRetrievedResultOnGetAll({
                    personnel,
                    accessRoleLevel,
                    result,
                    isMobile,
                }, cb);
            },

        ], callback);
    }

    async.waterfall([

        async.apply(access.getReadAccess, req, ACL_MODULES.CONSUMER_SURVEY),

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
