const async = require('async');
const _ = require('underscore');
const mongoose = require('mongoose');
const ACL_CONSTANTS = require('./../../../constants/aclRolesNames');
const ACL_MODULES = require('./../../../constants/aclModulesNames');
const CONTENT_TYPES = require('./../../../public/js/constants/contentType');
const CONSTANTS = require('./../../../constants/mainConstants');
const AggregationHelper = require('./../../../helpers/aggregationCreater');
const PersonnelModel = require('./../../../types/personnel/model');
const FilterMapper = require('./../../../helpers/filterMapper');
const access = require('./../../../helpers/access')();

const ObjectId = mongoose.Types.ObjectId;

module.exports = function (req, res, next) {
    function queryRun(personnel) {
        const query = req.query;
        const page = query.page || 1;
        const limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
        const skip = (page - 1) * limit;

        const language = req.cookies.currentLanguage;
        const translateFields = ['firstName', 'lastName'];
        const translated = (query.filter && query.filter.translated) ? query.filter.translated.values : [];

        const filterMapper = new FilterMapper();
        const filter = query.filter || {};
        const filterSearch = filter.globalSearch || '';
        const currentUserId = req.session.uId;

        const queryObjectAfterLookup = {};
        let key;

        const $personnelDefProjection = {
            _id: 1,
            position: 1,
            avgRating: 1,
            manager: 1,
            lastAccess: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            phoneNumber: 1,
            accessRole: 1,
            createdBy: 1,
            vacation: 1,
            status: 1,
            region: 1,
            subRegion: 1,
            retailSegment: 1,
            outlet: 1,
            branch: 1,
            country: 1,
            currentLanguage: 1,
            super: 1,
            archived: 1,
            temp: 1,
            confirmed: 1,
            translated: 1,
        };

        const sort = query.sort || {
            'editedBy.date': 1,
        };

        const showAll = filter.showAll;

        delete filter.showAll;

        for (key in sort) {
            sort[key] = parseInt(sort[key], 10);
        }

        delete filter.globalSearch;
        const queryObject = filterMapper.mapFilter({
            contentType: CONTENT_TYPES.INSTORETASKS,
            filter,
            personnel,
        });

        const aggregateHelper = new AggregationHelper($personnelDefProjection, queryObject);

        if (queryObject.retailSegment) {
            queryObjectAfterLookup.retailSegment = queryObject.retailSegment;
            delete queryObject.retailSegment;
        }

        if (queryObject.outlet) {
            queryObjectAfterLookup.outlet = queryObject.outlet;
            delete queryObject.outlet;
        }

        if (!queryObject.hasOwnProperty('archived')) {
            queryObject.archived = false;
        }

        async.waterfall([
            function (waterfallCb) {
                PersonnelModel.aggregate([
                    {
                        $match: {
                            _id: ObjectId(currentUserId),
                        },
                    },
                    {
                        $lookup: {
                            from: 'accessRoles',
                            localField: 'accessRole',
                            foreignField: '_id',
                            as: 'accessRole',
                        },
                    },
                    {
                        $project: {
                            accessRole: { $arrayElemAt: ['$accessRole', 0] },
                            country: 1,
                        },
                    },
                ]).exec((err, personnels) => {
                    if (err) {
                        return waterfallCb(err);
                    }

                    waterfallCb(null, personnels[0]);
                });
            },
            function (personnel, waterfallCb) {
                let pipeLine = [];
                const domainsArray = ['country', 'region', 'subRegion'];
                const personnelCountryes = personnel.country;
                const searchFieldsArray = [
                    'firstName.en',
                    'firstName.ar',
                    'lastName.en',
                    'lastName.ar',
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
                    'email',
                    'phoneNumber',
                    'accessRole.name.en',
                    'accessRole.name.ar',
                    'position.name.en',
                    'position.name.ar',
                ];

                queryObject.super = {
                    $ne: true,
                };

                queryObject._id = {
                    $ne: ObjectId(currentUserId),
                };

                if (showAll) {
                    queryObject.$or = [
                        { country: queryObject.country },
                        { country: { $size: 0 } },
                    ];
                    delete queryObject.country;
                    delete queryObject.region;
                    delete queryObject.subRegion;
                }

                pipeLine.push({
                    $match: queryObject,
                });

                if (translated.length === 1) {
                    pipeLine.push({
                        $project: aggregateHelper.getProjection({
                            translated: aggregateHelper.translatedCond(language, translateFields, translated[0]),
                        }),
                    });

                    pipeLine.push({
                        $match: {
                            translated: true,
                        },
                    });
                }

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from: 'positions',
                    key: 'position',
                    isArray: false,
                }));

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from: 'accessRoles',
                    key: 'accessRole',
                    isArray: false,
                    addProjection: 'level',
                }));

                pipeLine.push({
                    $match: {
                        'accessRole.level': {
                            $nin: [
                                ACL_CONSTANTS.MASTER_UPLOADER,
                                ACL_CONSTANTS.COUNTRY_UPLOADER,
                            ],
                        },
                    },
                });

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from: 'branches',
                    key: 'branch',
                    addMainProjection: ['retailSegment', 'outlet'],
                }));

                if (personnelCountryes.length) {
                    queryObjectAfterLookup.$or = [
                        { country: { $in: personnelCountryes } },
                        {
                            country: { $eq: [] },
                            'accessRole.level': ACL_CONSTANTS.MASTER_ADMIN,
                        },
                    ];
                }

                pipeLine.push({
                    $match: queryObjectAfterLookup,
                });

                domainsArray.forEach((element) => {
                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from: 'domains',
                        key: element,
                    }));
                });

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from: 'retailSegments',
                    key: 'retailSegment',
                }));

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from: 'outlets',
                    key: 'outlet',
                }));

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from: 'personnels',
                    key: 'createdBy.user',
                    isArray: false,
                    nameFields: ['firstName', 'lastName'],
                    includeSiblings: { createdBy: { date: 1 } },
                }));

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from: 'personnels',
                    key: 'manager',
                    isArray: false,
                    addProjection: ['_id', 'firstName', 'lastName'],
                }));

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from: 'personnels',
                    key: 'vacation.cover',
                    isArray: false,
                    addProjection: ['_id', 'firstName', 'lastName'],
                    includeSiblings: { vacation: { onLeave: 1 } },
                }));

                pipeLine.push({
                    $match: aggregateHelper.getSearchMatch(searchFieldsArray, filterSearch),
                });

                pipeLine.push({
                    $sort: sort,
                });

                pipeLine = _.union(pipeLine, aggregateHelper.setTotal());

                if (limit && limit !== -1) {
                    pipeLine.push({
                        $skip: skip,
                    });

                    pipeLine.push({
                        $limit: limit,
                    });
                }

                pipeLine = _.union(pipeLine, aggregateHelper.groupForUi());

                const aggregation = PersonnelModel.aggregate(pipeLine);

                aggregation.options = {
                    allowDiskUse: true,
                };

                aggregation.exec((err, response) => {
                    if (err) {
                        return waterfallCb(err);
                    }

                    response = response && response[0] ? response[0] : { data: [], total: 0 };

                    waterfallCb(null, response);
                });
            },
        ], (err, response) => {
            if (err) {
                return next(err);
            }

            next({ status: 200, body: response });
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

        queryRun(personnel);
    });
};
