const async = require('async');
const CONSTANTS = require('../../../constants/mainConstants');
const FilterMapper = require('../../../helpers/filterMapper');
const ACL_MODULES = require('../../../constants/aclModulesNames');
const CONTENT_TYPES = require('../../../public/js/constants/contentType.js');
const AggregationHelper = require('../../../helpers/aggregationCreater');
const access = require('../../../helpers/access')();
const filterRetrievedResultOnGetAll = require('../reusable-components/filterRetrievedResultOnGetAll');
const ConsumersSurveyModel = require('../../../types/consumersSurvey/model');
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
        const limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
        const skip = (page - 1) * limit;
        const filterMapper = new FilterMapper();
        const queryFilter = query.filter || {};
        const pipeline = [];

        const sort = query.sort || {
            lastDate: -1,
        };

        const queryObject = filterMapper.mapFilter({
            contentType: CONTENT_TYPES.CONSUMER_SURVEY,
            filter: queryFilter,
        });

        // user sees only ongoing questionnaire via mobile app
        const currentDate = new Date();

        queryObject.dueDate = {
            $gt: currentDate,
        };

        queryObject.status = {
            $nin: ['draft'],
        };

        const aggregateHelper = new AggregationHelper($defProjection);

        pipeline.push({
            $match: queryObject,
        });

        pipeline.push(...filterByPersonnelAndLocation(personnel, personnel._id));

        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'createdBy.user',
            isArray: false,
            addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
            includeSiblings: { createdBy: { date: 1 } },
        }));

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
                    },
                },
            },
        }));

        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'editedBy.user',
            isArray: false,
            addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
            includeSiblings: { editedBy: { date: 1 } },
        }));

        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from: 'accessRoles',
            key: 'editedBy.user.accessRole',
            isArray: false,
            addProjection: ['_id', 'name', 'level'],
            includeSiblings: {
                editedBy: {
                    date: 1,
                    user: {
                        _id: 1,
                        position: 1,
                        firstName: 1,
                        lastName: 1,
                    },
                },
            },
        }));

        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from: 'positions',
            key: 'editedBy.user.position',
            isArray: false,
            includeSiblings: {
                editedBy: {
                    date: 1,
                    user: {
                        _id: 1,
                        accessRole: 1,
                        firstName: 1,
                        lastName: 1,
                    },
                },
            },
        }));

        pipeline.push(...aggregateHelper.endOfPipeLine({
            isMobile: true,
            skip,
            limit,
            sort,
        }));

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
                    isMobile: true,
                    personnel,
                    result,
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
