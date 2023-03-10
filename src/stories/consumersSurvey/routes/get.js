const async = require('async');
const CONSTANTS = require('../../../constants/mainConstants');
const FilterMapper = require('../../../helpers/filterMapper');
const ACL_MODULES = require('../../../constants/aclModulesNames');
const aclRolesNames = require('../../../constants/aclRolesNames');
const CONTENT_TYPES = require('../../../public/js/constants/contentType.js');
const AggregationHelper = require('../../../helpers/aggregationCreater');
const access = require('../../../helpers/access')();
const filterRetrievedResultOnGetAll = require('../reusable-components/filterRetrievedResultOnGetAll');
const ConsumersSurveyModel = require('../../../types/consumersSurvey/model');
const filterByPersonnelAndLocation = require('../reusable-components/filterByPersonnelAndLocation');

const $defProjection = {
    _id          : 1,
    title        : 1,
    dueDate      : 1,
    startDate    : 1,
    country      : 1,
    region       : 1,
    subRegion    : 1,
    retailSegment: 1,
    outlet       : 1,
    branch       : 1,
    countAnswered: 1,
    status       : 1,
    questions    : 1,
    location     : 1,
    editedBy     : 1,
    createdBy    : 1,
    creationDate : 1,
    updateDate   : 1,
    position     : 1,
};

module.exports = (req, res, next) => {
    function queryRun(personnel, callback) {
        const query = req.query;
        const accessRoleLevel = req.session.level;
        const page = query.page || 1;
        const limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
        const skip = (page - 1) * limit;
        const filterMapper = new FilterMapper();
        const queryFilter = query.filter || {};
        const filterSearch = queryFilter.globalSearch || '';
        const pipeline = [];
        const allowedAccessRoles = [
            aclRolesNames.TRADE_MARKETER,
            aclRolesNames.MASTER_ADMIN,
        ];

        const searchFieldsArray = [
            'title.en',
            'title.ar',
        ];

        const sort = query.sort || {
            startDate: -1,
        };

        const queryObject = filterMapper.mapFilter({
            contentType: CONTENT_TYPES.CONSUMER_SURVEY,
            filter     : queryFilter,
            personnel,
        });

        if (queryObject.globalSearch) {
            delete queryObject.globalSearch;
        }

        for (const key in sort) {
            sort[key] = parseInt(sort[key], 10);
        }

        let positionFilter;

        if (queryObject.position) {
            positionFilter = queryObject.position;
            delete queryObject.position;
        }

        let personnelFilter;

        if (queryObject.personnel) {
            personnelFilter = queryObject.personnel;
            delete queryObject.personnel;
        }

        let publisherFilter;

        if (queryObject.publisher) {
            publisherFilter = queryObject.publisher;
            delete queryObject.publisher;
        }

        if (allowedAccessRoles.includes(accessRoleLevel)) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            'createdBy.user': personnel._id,
                            status          : {
                                $in: ['draft', 'expired'],
                            },
                        }, {
                            status: {
                                $ne: 'draft',
                            },
                        },
                    ],
                },
            });
        } else {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            'createdBy.user': personnel._id,
                            status          : {
                                $in: ['draft', 'expired'],
                            },
                        }, {
                            status: {
                                $nin: ['draft', 'expired'],
                            },
                        },
                    ],
                },
            });
        }

        const aggregateHelper = new AggregationHelper($defProjection);
        const isAdmin = [aclRolesNames.MASTER_ADMIN, aclRolesNames.TRADE_MARKETER].includes(personnel.accessRole.level);

        pipeline.push(...filterByPersonnelAndLocation(queryObject, personnel._id, isAdmin));

        if (personnelFilter) {
            pipeline.push({
                $match: {
                    personnels: personnelFilter,
                },
            });
        }

        if (publisherFilter) {
            pipeline.push({
                $match: {
                    'createdBy.user': publisherFilter,
                },
            });
        }

        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
            includeSiblings: {createdBy: {date: 1}},
        }));

        if (positionFilter) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            position: positionFilter,
                        },
                        {
                            'createdBy.user.position': positionFilter,
                        },
                    ],
                },
            });
        }

        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from           : 'accessRoles',
            key            : 'createdBy.user.accessRole',
            isArray        : false,
            addProjection  : ['_id', 'name', 'level'],
            includeSiblings: {
                createdBy: {
                    date: 1,
                    user: {
                        _id      : 1,
                        position : 1,
                        firstName: 1,
                        lastName : 1,
                    },
                },
            },
        }));

        pipeline.push(...aggregateHelper.aggregationPartMaker({
            from           : 'positions',
            key            : 'createdBy.user.position',
            isArray        : false,
            includeSiblings: {
                createdBy: {
                    date: 1,
                    user: {
                        _id       : 1,
                        accessRole: 1,
                        firstName : 1,
                        lastName  : 1,
                    },
                },
            },
        }));

        pipeline.push(...aggregateHelper.endOfPipeLine({
            isMobile: false,
            filterSearch,
            searchFieldsArray,
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
                    isMobile: false,
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
