const async = require('async');
const mongoose = require('mongoose');
const _ = require('lodash');

const ACL_MODULES = require('./../../../constants/aclModulesNames');
const CONTENT_TYPES = require('./../../../public/js/constants/contentType');
const CONSTANTS = require('./../../../constants/mainConstants');

const AccessManager = require('./../../../helpers/access')();
const AggregationHelper = require('./../../../helpers/aggregationCreater');
const FilterMapper = require('./../../../helpers/filterMapper');

const PersonnelModel = require('./../../../types/personnel/model');

const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const queryRun = (personnel, callback) => {
        const query = req.query;
        const page = query.page || 1;
        const limit = parseInt(query.count, 10) || CONSTANTS.LIST_COUNT;
        const skip = (page - 1) * limit;
        const language = req.cookies.currentLanguage;
        const translateFields = ['firstName', 'lastName'];
        const translated = (query.filter && query.filter.translated) ?
            query.filter.translated.values : [];
        const filterMapper = new FilterMapper();
        const filter = query.filter || {};
        const objectiveType = (filter.objectiveType && filter.objectiveType.values) || query.objectiveType ?
            query.objectiveType || filter.objectiveType.values[0] : null;
        const filterSearch = filter.globalSearch || '';
        const currentUserId = req.session.uId;
        const queryObjectAfterLookup = {};
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

        _.forOwn(sort, (value, prop) => {
            sort[prop] = parseInt(value, 10);
        });

        delete filter.globalSearch;
        delete filter.objectiveType;

        const queryObject = filterMapper.mapFilter({
            contentType: CONTENT_TYPES.OBJECTIVES,
            filter,
            context: 'objectivesAssign',
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

        if (queryObject.assignLevel) {
            queryObjectAfterLookup['accessRole.level'] = queryObject.assignLevel;
            delete queryObject.assignLevel;
        }

        if (!_.has(queryObject, 'archived')) {
            queryObject.archived = false;
        }

        async.waterfall([

            (cb) => {
                PersonnelModel.aggregate([{
                    $match: {
                        _id: ObjectId(currentUserId),
                    },
                }, {
                    $lookup: {
                        from: 'accessRoles',
                        localField: 'accessRole',
                        foreignField: '_id',
                        as: 'accessRole',
                    },
                }, {
                    $project: {
                        accessRole: { $arrayElemAt: ['$accessRole', 0] },
                        country: 1,
                        region: 1,
                        subRegion: 1,
                    },
                }]).exec((err, personnels) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, personnels[0]);
                });
            },

            (personnel, cb) => {
                const domainsArray = ['country', 'region', 'subRegion'];
                const personnelLocations = _.pick(personnel, 'country', 'region', 'subRegion');
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

                /* eslint-disable no-restricted-syntax */
                for (const personnelLocationKey in personnelLocations) {
                    if (!personnelLocations[personnelLocationKey][0]) {
                        delete personnelLocations[personnelLocationKey];
                    }
                }
                /* eslint-enable no-restricted-syntax */

                queryObject.super = {
                    $ne: true,
                };

                queryObject._id = {
                    $ne: ObjectId(currentUserId),
                };

                const pipeline = [];

                pipeline.push({
                    $match: queryObject,
                });

                if (translated.length === 1) {
                    pipeline.push({
                        $project: aggregateHelper.getProjection({
                            translated: aggregateHelper.translatedCond(language, translateFields, translated[0]),
                        }),
                    });

                    pipeline.push({
                        $match: {
                            translated: true,
                        },
                    });
                }

                pipeline.push(...aggregateHelper.aggregationPartMaker({
                    from: 'positions',
                    key: 'position',
                    isArray: false,
                }));

                pipeline.push(...aggregateHelper.aggregationPartMaker({
                    from: 'accessRoles',
                    key: 'accessRole',
                    isArray: false,
                    addProjection: 'level',
                }));

                pipeline.push(...aggregateHelper.aggregationPartMaker({
                    from: 'branches',
                    key: 'branch',
                    addMainProjection: ['retailSegment', 'outlet'],
                    addProjection: ['outlet'],
                }));

                if (objectiveType && objectiveType !== 'individual') {
                    if (personnel.accessRole.level <= 2) {
                        queryObjectAfterLookup['accessRole.level'] = {
                            $eq: personnel.accessRole.level + 1,
                        };
                    }
                } else {
                    queryObjectAfterLookup.$and = [
                        { 'accessRole.level': { $gte: personnel.accessRole.level } },
                        { 'accessRole.level': { $lt: 8 } },
                    ];
                }

                _.forOwn(personnelLocations, (value, key) => {
                    queryObjectAfterLookup[key] = {
                        $in: value,
                    };
                });

                pipeline.push({
                    $match: queryObjectAfterLookup,
                });

                domainsArray.forEach((element) => {
                    pipeline.push(...aggregateHelper.aggregationPartMaker({
                        from: 'domains',
                        key: element,
                    }));
                });

                pipeline.push(...aggregateHelper.aggregationPartMaker({
                    from: 'retailSegments',
                    key: 'retailSegment',
                }));

                pipeline.push(...aggregateHelper.aggregationPartMaker({
                    from: 'outlets',
                    key: 'outlet',
                }));

                pipeline.push(...aggregateHelper.aggregationPartMaker({
                    from: 'personnels',
                    key: 'createdBy.user',
                    isArray: false,
                    mameFields: ['firstName', 'lastName'],
                    includeSiblings: { createdBy: { date: 1 } },
                }));

                pipeline.push(...aggregateHelper.aggregationPartMaker({
                    from: 'personnels',
                    key: 'manager',
                    isArray: false,
                    addProjection: ['_id', 'firstName', 'lastName'],
                }));

                pipeline.push(...aggregateHelper.aggregationPartMaker({
                    from: 'personnels',
                    key: 'vacation.cover',
                    isArray: false,
                    addProjection: ['_id', 'firstName', 'lastName'],
                    includeSiblings: { vacation: { onLeave: 1 } },
                }));

                pipeline.push({
                    $match: aggregateHelper.getSearchMatch(searchFieldsArray, filterSearch),
                });

                pipeline.push({
                    $sort: sort,
                });

                pipeline.push(...aggregateHelper.setTotal());

                if (limit && limit !== -1) {
                    pipeline.push({
                        $skip: skip,
                    });

                    pipeline.push({
                        $limit: limit,
                    });
                }

                pipeline.push(...aggregateHelper.groupForUi());

                PersonnelModel.aggregate(pipeline)
                    .allowDiskUse(true)
                    .exec((err, result) => {
                        if (err) {
                            return cb(err);
                        }

                        const data = result && result[0] ?
                            result[0] : { data: [], total: 0 };

                        cb(null, data);
                    });
            },

        ], callback);
    };

    async.waterfall([

        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.OBJECTIVE, cb);
        },

        (allowed, personnel, cb) => {
            queryRun(personnel, cb);
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
