const mongoose = require('mongoose');
const async = require('async');
const _ = require('underscore');
const lodash = require('lodash');
const PersonnelModel = require('./../types/personnel/model');
const MarketingCampaignModel = require('./../types/marketingCampaign/model');
const ObjectiveModel = require('./../types/objective/model');
const ItemModel = require('./../types/item/model');
const PlanogramModel = require('./../types/planogram/model');
const QuestionnaryModel = require('./../types/questionnaries/model');
const CompetitorPromotionModel = require('./../types/competitorPromotion/model');
const CompetitorBrandingModel = require('./../types/competitorBranding/model');
const ContractsYearlyModel = require('./../types/contractYearly/model');
const ContractsSecondaryModel = require('./../types/contractSecondary/model');
const PromotionModel = require('./../types/promotion/model');
const DocumentModel = require('./../types/document/model');
const DomainModel = require('./../types/domain/model');
const NoteModel = require('./../types/note/model');
const ShelfSharesModel = require('./../types/shelfShare/model');
const PriceSurveyModel = require('./../types/priceSurvey/model');
const ContactUsModel = require('./../types/contactUs/model');
const NotificationModel = require('./../types/notification/model');
const BranchModel = require('./../types/branch/model');
const OutletModel = require('./../types/outlet/model');
const NewProductLaunchModel = require('./../types/newProductLaunch/model');
const BrandingAndMonthlyDisplayModel = require('./../types/brandingAndMonthlyDisplay/model');
const AggregationHelper = require('../helpers/aggregationCreater');
const FilterMapper = require('../helpers/filterMapper');
const FILTERS_CONSTANTS = require('../public/js/constants/filters');
const CONTENT_TYPES = require('../public/js/constants/contentType.js');
const logger = require('./../utils/logger');
const redis = require('./../helpers/redisClient');
const ObjectId = mongoose.Types.ObjectId;
const ACL_CONSTANTS = require('./../constants/aclRolesNames');
const ACL_MODULES = require('../constants/aclModulesNames');
const AccessManager = require('../helpers/access')();

const Filters = function () {
    const self = this;

    const $defProjection = {
        _id: 1,
        origin: 1,
        country: 1,
        retailSegment: 1,
        displayType: 1,
        region: 1,
        subRegion: 1,
        outlet: 1,
        branch: 1,
        brand: 1,
        variant: 1,
        category: 1,
        product: 1,
        editedBy: 1,
        createdBy: 1,
        archived: 1,
        type: 1,
        status: 1,
        configuration: 1,
        priority: 1,
        assignedTo: 1,
        location: 1,
        name: 1,
        position: 1,
    };

    function mapFiltersValues(resultObject, constants) {
        return _.map(resultObject || [], (element) => {
            let constantsElement;

            if (element) {
                let name;
                if (_.isArray(constants)) {
                    constantsElement = _.findWhere(constants, { _id: element });
                } else {
                    constantsElement = constants[element] || constants[element.toUpperCase()];
                }
                if (constantsElement && constantsElement.name) {
                    name = constantsElement.name && constantsElement.name.en ? constantsElement.name : { en: constantsElement.name };
                } else {
                    name = { en: constantsElement };
                }

                element = {
                    _id: element,
                    name,
                };
            }

            return element;
        });
    }

    function domainPileLine(options) {
        const filter = options.filter;
        const pipeLine = [];
        const matchObj = {
            $match: {
                $and: [],
            },
        };

        if (filter.country) {
            matchObj.$match.$and.push({
                'country._id': filter.country,
            }, {
                $or: [
                    { 'region.parent': { $exists: false } },
                    { 'region.parent': filter.country },
                ],
            });
        }

        if (filter.region) {
            matchObj.$match.$and.push({
                'region._id': filter.region,
            }, {
                $or: [
                    { 'subRegion.parent': { $exists: false } },
                    { 'subRegion.parent': filter.region },
                ],
            });
        }

        if (filter.subRegion) {
            matchObj.$match.$and.push({
                'subRegion._id': filter.subRegion,
            }, {
                $or: [
                    { 'branch.subRegion': { $exists: false } },
                    { 'branch.subRegion': filter.subRegion },
                ],
            });
        }

        if (filter.branch) {
            matchObj.$match.$and.push({
                'branch._id': filter.branch,
            });
        }

        if (matchObj.$match.$and.length) {
            pipeLine.push(matchObj);
        }

        return pipeLine;
    }

    function redisFilters(options, callback) {
        const filterExists = options.filterExists || false;
        const filtersObject = options.filtersObject || {};
        const personnelId = options.personnelId;
        const contentType = options.contentType;
        const currentSelected = options.currentSelected;
        const key = `${personnelId}.${contentType}`;

        if (!filterExists) {
            redis.cacheStore.writeToStorage(key, JSON.stringify(filtersObject), '864000');

            return callback(null, filtersObject);
        }

        async.waterfall([

            async.apply(redis.cacheStore.readFromStorage, key),

            (value, cb) => {
                if (value && currentSelected) {
                    const valueJSON = JSON.parse(value);

                    filtersObject[currentSelected] = valueJSON[currentSelected];
                }

                redis.cacheStore.writeToStorage(key, JSON.stringify(filtersObject), '864000');
                cb(null, filtersObject);
            },

        ], callback);
    }

    function getObjectiveFilters(req, res, next, cb) {
        const CONSTANTS = require('../public/js/constants/otherConstants');
        const query = req.query;

        const queryFilter = query.filter || {};
        const myCC = queryFilter.myCC;

        if (myCC) {
            delete queryFilter.myCC;
            queryFilter.$and.values[0]['createdBy.user'] = queryFilter.$and.values[0].assignedTo;
            delete queryFilter.$and.values[0].assignedTo;
        }

        const filterMapper = new FilterMapper();

        const currentSelected = query.current;
        const filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);

        const filter = filterMapper.mapFilter({
            contentType: CONTENT_TYPES.OBJECTIVES,
            filter: queryFilter,
            personnel: req.personnelModel,
        });

        // ToDo: add filtering by time

        const beforeFilter = _.pick(filter, '_id', 'priority', 'objectiveType', 'status', 'country', 'region',
            'subRegion', 'retailSegment', 'outlet', 'branch', '$and', '$or', 'assignedTo', 'createdBy');
        const pipeLine = [{
            $match: {
                context: 'objectives',
            },
        }];
        let personnelFilter;

        if (filter && filter.assignedTo) {
            personnelFilter = filter.assignedTo;
            delete filter.assignTo;
        }

        if (Object.keys(beforeFilter).length) {
            pipeLine.push({
                $match: beforeFilter,
            });
        }

        // country pipelines START
        pipeLine.push({
            $unwind: {
                path: '$country',
                preserveNullAndEmptyArrays: true,
            },
        });

        if (filter.country) {
            pipeLine.push({
                $match: {
                    country: filter.country,
                },
            });
        }

        pipeLine.push({
            $lookup: {
                from: 'domains',
                localField: 'country',
                foreignField: '_id',
                as: 'country',
            },
        }, {
            $project: {
                country: {
                    $let: {
                        vars: {
                            item: {
                                $cond: {
                                    if: { $eq: ['$country', []] },
                                    then: null,
                                    else: { $arrayElemAt: ['$country', 0] },
                                },
                            },
                        },
                        in: {
                            $cond: {
                                if: { $eq: ['$$item', null] },
                                then: null,
                                else: {
                                    _id: '$$item._id',
                                    name: '$$item.name',
                                    parent: '$$item.parent',
                                },
                            },
                        },
                    },
                },
                _id: 1,
                retailSegment: 1,
                region: 1,
                subRegion: 1,
                outlet: 1,
                branch: 1,
                editedBy: 1,
                createdBy: 1,
                archived: 1,
                objectiveType: 1,
                status: 1,
                priority: 1,
                assignedTo: 1,
            },
        }, {
            $group: {
                _id: '$_id',
                country: { $addToSet: '$country' },
                region: { $first: '$region' },
                subRegion: { $first: '$subRegion' },
                branch: { $first: '$branch' },
                retailSegment: { $first: '$retailSegment' },
                outlet: { $first: '$outlet' },
                createdBy: { $first: '$createdBy' },
                actionType: { $first: '$actionType' },
                editedBy: { $first: '$editedBy' },
                archived: { $first: '$archived' },
                objectiveType: { $first: '$objectiveType' },
                status: { $first: '$status' },
                priority: { $first: '$priority' },
                assignedTo: { $first: '$assignedTo' },
            },
        });
        // country pipelines END

        // region pipelines START
        pipeLine.push({
            $unwind: {
                path: '$region',
                preserveNullAndEmptyArrays: true,
            },
        });

        if (filter.region) {
            pipeLine.push({
                $match: {
                    region: filter.region,
                },
            });
        }

        pipeLine.push({
            $lookup: {
                from: 'domains',
                localField: 'region',
                foreignField: '_id',
                as: 'region',
            },
        }, {
            $project: {
                region: {
                    $let: {
                        vars: {
                            item: {
                                $cond: {
                                    if: { $eq: ['$region', []] },
                                    then: null,
                                    else: { $arrayElemAt: ['$region', 0] },
                                },
                            },
                        },
                        in: {
                            $cond: {
                                if: { $eq: ['$$item', null] },
                                then: null,
                                else: {
                                    _id: '$$item._id',
                                    name: '$$item.name',
                                    parent: '$$item.parent',
                                },
                            },
                        },
                    },
                },
                _id: 1,
                country: 1,
                retailSegment: 1,
                subRegion: 1,
                outlet: 1,
                branch: 1,
                editedBy: 1,
                createdBy: 1,
                archived: 1,
                objectiveType: 1,
                status: 1,
                priority: 1,
                assignedTo: 1,
            },
        }, {
            $group: {
                _id: '$_id',
                country: { $first: '$country' },
                region: { $addToSet: '$region' },
                subRegion: { $first: '$subRegion' },
                branch: { $first: '$branch' },
                retailSegment: { $first: '$retailSegment' },
                outlet: { $first: '$outlet' },
                createdBy: { $first: '$createdBy' },
                actionType: { $first: '$actionType' },
                editedBy: { $first: '$editedBy' },
                archived: { $first: '$archived' },
                objectiveType: { $first: '$objectiveType' },
                status: { $first: '$status' },
                priority: { $first: '$priority' },
                assignedTo: { $first: '$assignedTo' },
            },
        });
        // region pipelines END

        // subRegion pipelines START
        pipeLine.push({
            $unwind: {
                path: '$subRegion',
                preserveNullAndEmptyArrays: true,
            },
        });

        if (filter.subRegion) {
            pipeLine.push({
                $match: {
                    subRegion: filter.subRegion,
                },
            });
        }

        pipeLine.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegion',
                foreignField: '_id',
                as: 'subRegion',
            },
        }, {
            $project: {
                subRegion: {
                    $let: {
                        vars: {
                            item: {
                                $cond: {
                                    if: { $eq: ['$subRegion', []] },
                                    then: null,
                                    else: { $arrayElemAt: ['$subRegion', 0] },
                                },
                            },
                        },
                        in: {
                            $cond: {
                                if: { $eq: ['$$item', null] },
                                then: null,
                                else: {
                                    _id: '$$item._id',
                                    name: '$$item.name',
                                    parent: '$$item.parent',
                                },
                            },
                        },
                    },
                },
                _id: 1,
                country: 1,
                retailSegment: 1,
                region: 1,
                outlet: 1,
                branch: 1,
                editedBy: 1,
                createdBy: 1,
                archived: 1,
                objectiveType: 1,
                status: 1,
                priority: 1,
                assignedTo: 1,
            },
        }, {
            $group: {
                _id: '$_id',
                country: { $first: '$country' },
                region: { $first: '$region' },
                subRegion: { $addToSet: '$subRegion' },
                branch: { $first: '$branch' },
                retailSegment: { $first: '$retailSegment' },
                outlet: { $first: '$outlet' },
                createdBy: { $first: '$createdBy' },
                actionType: { $first: '$actionType' },
                editedBy: { $first: '$editedBy' },
                archived: { $first: '$archived' },
                objectiveType: { $first: '$objectiveType' },
                status: { $first: '$status' },
                priority: { $first: '$priority' },
                assignedTo: { $first: '$assignedTo' },
            },
        });
        // subRegion pipelines END

        // retailSegments pipelines START
        pipeLine.push({
            $unwind: {
                path: '$retailSegment',
                preserveNullAndEmptyArrays: true,
            },
        });

        if (filter.retailSegment) {
            pipeLine.push({
                $match: {
                    retailSegment: filter.retailSegment,
                },
            });
        }

        pipeLine.push({
            $lookup: {
                from: 'retailSegments',
                localField: 'retailSegment',
                foreignField: '_id',
                as: 'retailSegment',
            },
        }, {
            $project: {
                retailSegment: {
                    $let: {
                        vars: {
                            item: {
                                $cond: {
                                    if: { $eq: ['$retailSegment', []] },
                                    then: null,
                                    else: { $arrayElemAt: ['$retailSegment', 0] },
                                },
                            },
                        },
                        in: {
                            $cond: {
                                if: { $eq: ['$$item', null] },
                                then: null,
                                else: {
                                    _id: '$$item._id',
                                    name: '$$item.name',
                                },
                            },
                        },
                    },
                },
                _id: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                outlet: 1,
                branch: 1,
                editedBy: 1,
                createdBy: 1,
                archived: 1,
                objectiveType: 1,
                status: 1,
                priority: 1,
                assignedTo: 1,
            },
        }, {
            $group: {
                _id: '$_id',
                country: { $first: '$country' },
                region: { $first: '$region' },
                subRegion: { $first: '$subRegion' },
                retailSegment: { $addToSet: '$retailSegment' },
                branch: { $first: '$branch' },
                outlet: { $first: '$outlet' },
                createdBy: { $first: '$createdBy' },
                actionType: { $first: '$actionType' },
                editedBy: { $first: '$editedBy' },
                archived: { $first: '$archived' },
                objectiveType: { $first: '$objectiveType' },
                status: { $first: '$status' },
                priority: { $first: '$priority' },
                assignedTo: { $first: '$assignedTo' },
            },
        });
        // retailSegments pipelines END

        // outlet pipelines START
        pipeLine.push({
            $unwind: {
                path: '$outlet',
                preserveNullAndEmptyArrays: true,
            },
        });

        if (filter.outlet) {
            pipeLine.push({
                $match: {
                    outlet: filter.outlet,
                },
            });
        }

        pipeLine.push({
            $lookup: {
                from: 'outlets',
                localField: 'outlet',
                foreignField: '_id',
                as: 'outlet',
            },
        }, {
            $project: {
                outlet: {
                    $let: {
                        vars: {
                            item: {
                                $cond: {
                                    if: { $eq: ['$outlet', []] },
                                    then: null,
                                    else: { $arrayElemAt: ['$outlet', 0] },
                                },
                            },
                        },
                        in: {
                            $cond: {
                                if: { $eq: ['$$item', null] },
                                then: null,
                                else: {
                                    _id: '$$item._id',
                                    name: '$$item.name',
                                },
                            },
                        },
                    },
                },
                _id: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                branch: 1,
                retailSegment: 1,
                editedBy: 1,
                createdBy: 1,
                archived: 1,
                objectiveType: 1,
                status: 1,
                priority: 1,
                assignedTo: 1,
            },
        }, {
            $group: {
                _id: '$_id',
                country: { $first: '$country' },
                region: { $first: '$region' },
                subRegion: { $first: '$subRegion' },
                retailSegment: { $first: '$retailSegment' },
                branch: { $first: '$branch' },
                outlet: { $addToSet: '$outlet' },
                createdBy: { $first: '$createdBy' },
                actionType: { $first: '$actionType' },
                editedBy: { $first: '$editedBy' },
                archived: { $first: '$archived' },
                objectiveType: { $first: '$objectiveType' },
                status: { $first: '$status' },
                priority: { $first: '$priority' },
                assignedTo: { $first: '$assignedTo' },
            },
        });
        // outlets pipelines END

        // branch pipelines START
        pipeLine.push({
            $unwind: {
                path: '$branch',
                preserveNullAndEmptyArrays: true,
            },
        });

        if (filter.branch) {
            pipeLine.push({
                $match: {
                    branch: filter.branch,
                },
            });
        }

        pipeLine.push({
            $lookup: {
                from: 'branches',
                localField: 'branch',
                foreignField: '_id',
                as: 'branch',
            },
        }, {
            $project: {
                branch: {
                    $let: {
                        vars: {
                            item: {
                                $cond: {
                                    if: { $eq: ['$branch', []] },
                                    then: null,
                                    else: { $arrayElemAt: ['$branch', 0] },
                                },
                            },
                        },
                        in: {
                            $cond: {
                                if: { $eq: ['$$item', null] },
                                then: null,
                                else: {
                                    _id: '$$item._id',
                                    name: '$$item.name',
                                },
                            },
                        },
                    },
                },
                _id: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                outlet: 1,
                retailSegment: 1,
                editedBy: 1,
                createdBy: 1,
                archived: 1,
                objectiveType: 1,
                status: 1,
                priority: 1,
                assignedTo: 1,
            },
        }, {
            $group: {
                _id: '$_id',
                country: { $first: '$country' },
                region: { $first: '$region' },
                subRegion: { $first: '$subRegion' },
                retailSegment: { $first: '$retailSegment' },
                branch: { $addToSet: '$branch' },
                outlet: { $first: '$outlet' },
                createdBy: { $first: '$createdBy' },
                actionType: { $first: '$actionType' },
                editedBy: { $first: '$editedBy' },
                archived: { $first: '$archived' },
                objectiveType: { $first: '$objectiveType' },
                status: { $first: '$status' },
                priority: { $first: '$priority' },
                assignedTo: { $first: '$assignedTo' },
            },
        });
        // branch pipelines END

        if (personnelFilter) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'createdBy.user': personnelFilter,
                        },
                        {
                            assignedTo: personnelFilter,
                        },
                    ],
                },
            });
        }

        pipeLine.push({
            $lookup: {
                from: 'personnels',
                localField: 'createdBy.user',
                foreignField: '_id',
                as: 'createdBy',
            },
        }, {
            $project: {
                createdBy: {
                    $let: {
                        vars: {
                            item: {
                                $cond: {
                                    if: { $eq: ['$createdBy', []] },
                                    then: null,
                                    else: { $arrayElemAt: ['$createdBy', 0] },
                                },
                            },
                        },
                        in: {
                            $cond: {
                                if: { $eq: ['$$item', null] },
                                then: null,
                                else: {
                                    _id: '$$item._id',
                                    name: '$$item.name',
                                    position: '$$item.position',
                                },
                            },
                        },
                    },
                },
                _id: 1,
                branch: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                outlet: 1,
                retailSegment: 1,
                editedBy: 1,
                archived: 1,
                objectiveType: 1,
                status: 1,
                priority: 1,
                assignedTo: 1,
            },
        });
        // createdBy pipelines END

        pipeLine.push({
            $unwind: {
                path: '$assignedTo',
                preserveNullAndEmptyArrays: true,
            },
        });

        // assignedTo pipelines START
        if (filter.assignedTo) {
            pipeLine.push({
                $match: {
                    assignedTo: filter.assignedTo,
                },
            });
        }

        pipeLine.push({
            $lookup: {
                from: 'personnels',
                localField: 'assignedTo',
                as: 'assignedTo',
                foreignField: '_id',
            },
        }, {
            $project: {
                assignedTo: {
                    $let: {
                        vars: {
                            item: {
                                $cond: {
                                    if: { $eq: ['$assignedTo', []] },
                                    then: null,
                                    else: { $arrayElemAt: ['$assignedTo', 0] },
                                },
                            },
                        },
                        in: {
                            $cond: {
                                if: { $eq: ['$$item', null] },
                                then: null,
                                else: {
                                    _id: '$$item._id',
                                    name: '$$item.name',
                                    position: '$$item.position',
                                },
                            },
                        },
                    },
                },
                _id: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                branch: 1,
                outlet: 1,
                retailSegment: 1,
                editedBy: 1,
                createdBy: 1,
                archived: 1,
                objectiveType: 1,
                status: 1,
                priority: 1,
            },
        }, {
            $group: {
                _id: '$_id',
                country: { $first: '$country' },
                region: { $first: '$region' },
                subRegion: { $first: '$subRegion' },
                retailSegment: { $first: '$retailSegment' },
                branch: { $first: '$branch' },
                outlet: { $first: '$outlet' },
                createdBy: { $first: '$createdBy' },
                actionType: { $first: '$actionType' },
                editedBy: { $first: '$editedBy' },
                archived: { $first: '$archived' },
                objectiveType: { $first: '$objectiveType' },
                status: { $first: '$status' },
                priority: { $first: '$priority' },
                assignedTo: { $addToSet: '$assignedTo' },
                position: { $addToSet: '$assignedTo.position' },
            },
        });
        // branch pipelines END

        pipeLine.push(...domainPileLine({
            filter,
        }));

        pipeLine.push({
            $project: {
                objectiveType: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                priority: 1,
                status: 1,
                position: { $setUnion: [['$createdBy.position'], '$position'] },
            },
        });

        if (filter.position) {
            pipeLine.push({
                $match: {
                    position: filter.position,
                },
            });
        }

        // position pipelines START
        pipeLine.push({
            $unwind: {
                path: '$position',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeLine.push({
            $lookup: {
                from: 'positions',
                localField: 'position',
                as: 'position',
                foreignField: '_id',
            },
        }, {
            $project: {
                position: {
                    $let: {
                        vars: {
                            item: {
                                $cond: {
                                    if: { $eq: ['$position', []] },
                                    then: null,
                                    else: { $arrayElemAt: ['$position', 0] },
                                },
                            },
                        },
                        in: {
                            $cond: {
                                if: { $eq: ['$$item', null] },
                                then: null,
                                else: {
                                    _id: '$$item._id',
                                    name: '$$item.name',
                                },
                            },
                        },
                    },
                },
                _id: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                branch: 1,
                outlet: 1,
                retailSegment: 1,
                objectiveType: 1,
                status: 1,
                priority: 1,
            },
        });
        // position pipelines END

        pipeLine.push({
            $project: {
                country: { $setDifference: ['$country', [null]] },
                region: { $setDifference: ['$region', [null]] },
                subRegion: { $setDifference: ['$subRegion', [null]] },
                retailSegment: { $setDifference: ['$retailSegment', [null]] },
                branch: { $setDifference: ['$branch', [null]] },
                outlet: { $setDifference: ['$outlet', [null]] },
                position: 1,
                objectiveType: 1,
                status: 1,
                priority: 1,
            },
        });

        pipeLine.push({
            $unwind: {
                path: '$country',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $unwind: {
                path: '$region',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $unwind: {
                path: '$subRegion',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $unwind: {
                path: '$retailSegment',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $unwind: {
                path: '$outlet',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $unwind: {
                path: '$branch',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $group: {
                _id: null,
                country: { $addToSet: '$country' },
                region: { $addToSet: '$region' },
                subRegion: { $addToSet: '$subRegion' },
                retailSegment: { $addToSet: '$retailSegment' },
                outlet: { $addToSet: '$outlet' },
                branch: { $addToSet: '$branch' },
                priority: { $addToSet: '$priority' },
                position: { $addToSet: '$position' },
                objectiveType: { $addToSet: '$objectiveType' },
                status: { $addToSet: '$status' },
            },
        });

        ObjectiveModel.aggregate(pipeLine).allowDiskUse(true).exec((err, result) => {
            if (err) {
                if (cb && typeof cb === 'function') {
                    return cb(err);
                }

                return next(err);
            }

            result = result[0] || {};

            result = {
                country: result.country || [],
                region: result.region || [],
                subRegion: result.subRegion || [],
                retailSegment: result.retailSegment || [],
                outlet: result.outlet || [],
                branch: result.branch || [],
                position: result.position || [],
                priority: mapFiltersValues(result.priority, CONSTANTS.OBJECTIVES_PRIORITY),
                objectiveType: mapFiltersValues(result.objectiveType, CONSTANTS.OBJECTIVES_TYPE),
                status: mapFiltersValues(result.status, CONSTANTS.OBJECTIVESTATUSES_FOR_UI),
            };
            if (cb && cb instanceof Function) {
                return cb(null, result);
            }

            redisFilters({
                currentSelected,
                filterExists,
                filtersObject: result,
                personnelId: req.personnelModel._id,
                contentType: CONTENT_TYPES.OBJECTIVES,
            }, (err, response) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    }

    function getInStoreTaskFilters(req, res, next, cb) {
        const CONSTANTS = require('../public/js/constants/otherConstants');

        const query = req.query;
        const queryFilter = query.filter || {};
        const myCC = queryFilter.myCC;
        const currentSelected = query.current;

        if (myCC) {
            delete queryFilter.myCC;
            queryFilter.$and.values[0]['createdBy.user'] = queryFilter.$and.values[0].assignedTo;
            delete queryFilter.$and.values[0].assignedTo;
        }

        const filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);

        const filterMapper = new FilterMapper();
        const filter = filterMapper.mapFilter({
            filter: queryFilter,
            personnel: req.personnelModel,
        });

        const beforeFilter = _.pick(filter, '_id', 'priority', 'status', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', '$and', '$or', 'assignedTo', 'createdBy');
        const afterFilter = _.pick(filter, 'position');
        let aggregation;
        let pipeLine = [{
            $match: {
                context: 'inStoreTasks',
            },
        }, {
            $match: beforeFilter,
        }, {
            $lookup: {
                from: 'domains',
                localField: 'country',
                foreignField: '_id',
                as: 'country',
            },
        }, {
            $project: {
                country: {
                    $filter: {
                        input: '$country',
                        as: 'oneItem',
                        cond: {
                            $ne: [
                                '$$oneItem',
                                null,
                            ],
                        },
                    },
                },
                _id: 1,
                retailSegment: 1,
                region: 1,
                subRegion: 1,
                outlet: 1,
                branch: 1,
                editedBy: 1,
                createdBy: 1,
                archived: 1,
                status: 1,
                priority: 1,
                assignedTo: 1,
            },
        }, {
            $lookup: {
                from: 'domains',
                localField: 'region',
                foreignField: '_id',
                as: 'region',
            },
        }, {
            $project: {
                region: {
                    $filter: {
                        input: '$region',
                        as: 'oneItem',
                        cond: {
                            $ne: [
                                '$$oneItem',
                                null,
                            ],
                        },
                    },
                },
                _id: 1,
                country: 1,
                retailSegment: 1,
                subRegion: 1,
                outlet: 1,
                branch: 1,
                editedBy: 1,
                createdBy: 1,
                archived: 1,
                status: 1,
                priority: 1,
                assignedTo: 1,
            },
        }, {
            $lookup: {
                from: 'domains',
                localField: 'subRegion',
                foreignField: '_id',
                as: 'subRegion',
            },
        }, {
            $project: {
                subRegion: {
                    $filter: {
                        input: '$subRegion',
                        as: 'oneItem',
                        cond: {
                            $ne: [
                                '$$oneItem',
                                null,
                            ],
                        },
                    },
                },
                _id: 1,
                country: 1,
                retailSegment: 1,
                region: 1,
                outlet: 1,
                branch: 1,
                editedBy: 1,
                createdBy: 1,
                archived: 1,
                status: 1,
                priority: 1,
                assignedTo: 1,
            },
        }, {
            $lookup: {
                from: 'retailSegments',
                localField: 'retailSegment',
                foreignField: '_id',
                as: 'retailSegment',
            },
        }, {
            $project: {
                retailSegment: {
                    $filter: {
                        input: '$retailSegment',
                        as: 'oneItem',
                        cond: {
                            $ne: [
                                '$$oneItem',
                                null,
                            ],
                        },
                    },
                },
                _id: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                outlet: 1,
                branch: 1,
                editedBy: 1,
                createdBy: 1,
                archived: 1,
                status: 1,
                priority: 1,
                assignedTo: 1,
            },
        }, {
            $lookup: {
                from: 'outlets',
                localField: 'outlet',
                foreignField: '_id',
                as: 'outlet',
            },
        }, {
            $project: {
                outlet: {
                    $filter: {
                        input: '$outlet',
                        as: 'oneItem',
                        cond: {
                            $ne: [
                                '$$oneItem',
                                null,
                            ],
                        },
                    },
                },
                _id: 1,
                country: 1,
                retailSegment: 1,
                region: 1,
                subRegion: 1,
                branch: 1,
                editedBy: 1,
                createdBy: 1,
                archived: 1,
                status: 1,
                priority: 1,
                assignedTo: 1,
            },
        }, {
            $lookup: {
                from: 'branches',
                localField: 'branch',
                foreignField: '_id',
                as: 'branch',
            },
        }, {
            $project: {
                branch: {
                    $filter: {
                        input: '$branch',
                        as: 'oneItem',
                        cond: {
                            $ne: [
                                '$$oneItem',
                                null,
                            ],
                        },
                    },
                },
                _id: 1,
                country: 1,
                retailSegment: 1,
                region: 1,
                subRegion: 1,
                outlet: 1,
                editedBy: 1,
                createdBy: 1,
                archived: 1,
                status: 1,
                priority: 1,
                assignedTo: 1,
            },
        }, {
            $lookup: {
                from: 'personnels',
                localField: 'createdBy.user',
                foreignField: '_id',
                as: 'createdBy',
            },
        }, {
            $lookup: {
                from: 'personnels',
                localField: 'assignedTo',
                foreignField: '_id',
                as: 'assignedTo',
            },
        }, {
            $addFields: {
                createdBy: {
                    $arrayElemAt: ['$createdBy', 0],
                },

                assignedTo: {
                    $arrayElemAt: ['$assignedTo', 0],
                },

                country: {
                    $arrayElemAt: ['$country', 0],
                },

                region: {
                    $arrayElemAt: ['$region', 0],
                },

                subRegion: {
                    $arrayElemAt: ['$subRegion', 0],
                },

                branch: {
                    $arrayElemAt: ['$branch', 0],
                },

                outlet: {
                    $arrayElemAt: ['$outlet', 0],
                },

                retailSegment: {
                    $arrayElemAt: ['$retailSegment', 0],
                },
            },
        }];

        pipeLine = _.union(pipeLine, domainPileLine({
            filter,
        }));

        pipeLine.push(...[{
            $project: {
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                priority: 1,
                status: 1,
                position: [
                    '$createdBy.position',
                    '$assignedTo.position',
                ],
            },
        }, {
            $match: afterFilter,
        }, {
            $lookup: {
                from: 'positions',
                localField: 'position',
                foreignField: '_id',
                as: 'position',
            },
        }, {
            $group: {
                _id: null,
                count: { $sum: 1 },
                country: {
                    $addToSet: '$country',
                },
                region: {
                    $addToSet: '$region',
                },
                subRegion: {
                    $addToSet: '$subRegion',
                },
                retailSegment: {
                    $addToSet: '$retailSegment',
                },
                outlet: {
                    $addToSet: '$outlet',
                },
                branch: {
                    $addToSet: '$branch',
                },
                priority: {
                    $addToSet: '$priority',
                },
                position: {
                    $addToSet: '$position',
                },
                status: {
                    $addToSet: '$status',
                },
            },
        },
        ]);

        aggregation = ObjectiveModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true,
        };

        aggregation.exec((err, result) => {
            if (err) {
                if (cb && typeof cb === 'function') {
                    return cb(err);
                }
                return next(err);
            }

            result = result[0] || {};

            result = {
                country: result.country || [],
                region: result.region || [],
                subRegion: result.subRegion || [],
                retailSegment: result.retailSegment || [],
                outlet: result.outlet || [],
                branch: result.branch || [],
                position: result.position || [],
                priority: mapFiltersValues(result.priority, CONSTANTS.OBJECTIVES_PRIORITY),
                status: mapFiltersValues(result.status, CONSTANTS.OBJECTIVESTATUSES_FOR_UI),
            };
            if (cb && cb instanceof Function) {
                return cb(null, result);
            }
            redisFilters({
                currentSelected,
                filterExists,
                filtersObject: result,
                personnelId: req.personnelModel._id,
                contentType: CONTENT_TYPES.INSTORETASKS,
            }, (err, response) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    }

    function unionById(arr) {
        return lodash.unionBy(...arr, elem => elem._id && elem._id.toString());
    }

    this.brandingActivityFilters = function (req, res, next) {
        const CONSTANTS = require('../public/js/constants/otherConstants');
        const STATUSES = CONSTANTS.PROMOTION_UI_STATUSES;
        const personnelId = req.personnelModel._id;
        const query = req.query;
        let filter = query.filter || {};
        const currentSelected = query.current;
        const filterExists = Object.keys(filter).length && !(Object.keys(filter).length === 1 && filter.archived);
        const filterMapper = new FilterMapper();

        let aggregation;
        let pipeLine = [];

        let aggregateHelper;

        const $defProjection = {
            _id: 1,
            description: 1,
            displayType: 1,
            dateStart: 1,
            dateEnd: 1,
            attachments: 1,
            category: 1,
            branch: 1,
            country: 1,
            region: 1,
            subRegion: 1,
            retailSegment: 1,
            outlet: 1,
            createdBy: 1,
            editedBy: 1,
            personnel: 1,
            status: 1,
            parent: 1,
            position: 1,
            publisher: 1,
        };

        let positionFilter;

        filter = filterMapper.mapFilter({
            filter,
            personnel: req.personnelModel,
        });

        if (filter.position) {
            positionFilter = { position: filter.position };

            delete filter.position;
        }

        aggregateHelper = new AggregationHelper($defProjection, filter);

        pipeLine.push({
            $match: {
                $or: [
                    {
                        'createdBy.user': personnelId,
                        status: { $in: ['draft', 'expired'] },
                    }, {
                        status: { $nin: ['draft', 'expired'] },
                    },
                ],
            },
        });

        /* pipeLine.push({
         $match : {
         status : {
         $ne : 'expired'
         }
         }
         });*/

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'categories',
            key: 'category',
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'branches',
            key: 'branch',
            addMainProjection: ['retailSegment', 'outlet', 'subRegion'],
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key: 'subRegion',
            addMainProjection: ['parent'],
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key: 'parent',
            as: 'region',
            addMainProjection: ['parent'],
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key: 'parent',
            as: 'country',
        }));

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
            key: 'personnel',
            addMainProjection: ['position'],
            nameFields: ['firstName', 'lastName'],
        }));

        pipeLine.push({
            $lookup: {
                from: 'personnels',
                localField: 'createdBy.user',
                foreignField: '_id',
                as: 'createdBy.user',
            },
        });

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                createdBy: {
                    date: 1,
                    user: { $arrayElemAt: ['$createdBy.user', 0] },
                },
            }),
        });

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                position: {
                    $setUnion: ['$position', ['$createdBy.user.position']],
                },
                publisher: {
                    _id: '$createdBy.user._id',
                    name: {
                        en: { $concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en'] },
                        ar: { $concat: ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar'] },
                    },
                },
            }),
        });

        if (positionFilter) {
            pipeLine.push({
                $match: positionFilter,
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'positions',
            key: 'position',
        }));

        /* pipeLine.push({
         $unwind: {
         path                      : '$country',
         preserveNullAndEmptyArrays: true
         }
         });

         pipeLine.push({
         $unwind: {
         path                      : '$region',
         preserveNullAndEmptyArrays: true
         }
         });

         pipeLine.push({
         $unwind: {
         path                      : '$subRegion',
         preserveNullAndEmptyArrays: true
         }
         });

         pipeLine.push({
         $unwind: {
         path                      : '$retailSegment',
         preserveNullAndEmptyArrays: true
         }
         });

         pipeLine.push({
         $unwind: {
         path                      : '$outlet',
         preserveNullAndEmptyArrays: true
         }
         });

         pipeLine.push({
         $unwind: {
         path                      : '$branch',
         preserveNullAndEmptyArrays: true
         }
         });*/

        pipeLine.push({
            $unwind: {
                path: '$personnel',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeLine.push({
            $unwind: {
                path: '$position',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeLine.push({
            $unwind: {
                path: '$category',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeLine.push({
            $group: {
                _id: null,
                country: { $addToSet: '$country' },
                category: { $addToSet: '$category' },
                personnel: { $addToSet: '$personnel' },
                region: { $addToSet: '$region' },
                subRegion: { $addToSet: '$subRegion' },
                retailSegment: { $addToSet: '$retailSegment' },
                outlet: { $addToSet: '$outlet' },
                branch: { $addToSet: '$branch' },
                publisher: { $addToSet: '$publisher' },
                position: { $addToSet: '$position' },
                status: { $addToSet: '$status' },
            },
        });

        aggregation = MarketingCampaignModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true,
        };

        aggregation.exec((err, result) => {
            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {
                category: result.category || [],
                country: result.country && _.uniq(_.flatten(result.country)) || [],
                region: result.region && _.uniq(_.flatten(result.region)) || [],
                subRegion: result.subRegion && _.uniq(_.flatten(result.subRegion)) || [],
                retailSegment: result.retailSegment && _.uniq(_.flatten(result.retailSegment)) || [],
                outlet: result.outlet && _.uniq(_.flatten(result.outlet)) || [],
                branch: result.branch && _.uniq(_.flatten(result.branch)) || [],
                position: result.position || [],
                publisher: result.publisher || [],
                status: mapFiltersValues(result.status, STATUSES),
                personnel: result.personnel || [],
            };

            Object.keys(result).forEach((key) => {
                if (result[key]) {
                    let i = result[key].length - 1;
                    for (i; i >= 0; i--) {
                        if (!result[key][i] || !result[key][i].name) {
                            result[key].splice(i, 1);
                        }
                    }
                }
            });

            redisFilters({
                currentSelected,
                filterExists,
                filtersObject: result,
                personnelId: req.personnelModel._id,
                contentType: CONTENT_TYPES.MARKETING_CAMPAIGN,
            }, (err, response) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.shelfSharesFilters = function (req, res, next) {
        const query = req.query;
        const filterMapper = new FilterMapper();
        const queryFilter = query.filter || {};

        const currentSelected = query.current;
        const filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);

        const filter = filterMapper.mapFilter({
            filter: queryFilter,
            personnel: req.personnelModel,
        });
        let pipeLine = [];
        let aggregation;
        let personnelFilter;
        let positionFilter;
        let brandFilter;
        let aggregateHelper;
        const $defProjectionExtended = Object.assign({}, $defProjection, {
            brands: 1,
        });

        if (filter.brand) {
            brandFilter = filter.brand;
            delete filter.brand;
        }

        if (filter.personnel) {
            personnelFilter = filter.personnel;
            delete filter.personnel;
        }

        if (filter.position) {
            positionFilter = filter.position;
            delete filter.position;
        }

        aggregateHelper = new AggregationHelper($defProjectionExtended, filter);

        if (personnelFilter) {
            pipeLine.push({
                $match: {
                    'createdBy.user': personnelFilter,
                },
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'categories',
            key: 'category',
            isArray: false,
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key: 'country',
            isArray: false,
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key: 'region',
            isArray: false,
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key: 'subRegion',
            isArray: false,
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'retailSegments',
            key: 'retailSegment',
            isArray: false,
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'outlets',
            key: 'outlet',
            isArray: false,
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'branches',
            key: 'branch',
            isArray: false,
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'createdBy.user',
            addProjection: ['position', 'firstName', 'lastName'],
            isArray: false,
            includeSiblings: {
                createdBy: {
                    date: 1,
                },
            },
        }));

        if (positionFilter) {
            pipeLine.push({
                $match: {
                    'createdBy.user.position': positionFilter,
                },
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'positions',
            key: 'createdBy.user.position',
            isArray: false,
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

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                createdBy: {
                    date: 1,
                    user: {
                        _id: 1,
                        name: {
                            en: { $concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en'] },
                            ar: { $concat: ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar'] },
                        },
                    },
                },
                position: { $arrayElemAt: ['$createdBy.user.position', 0] },
            }),
        });

        pipeLine.push({
            $unwind: {
                path: '$brands',
                preserveNullAndEmptyArrays: true,
            },
        });

        if (brandFilter) {
            pipeLine.push({
                $match: {
                    'brands.brand': brandFilter,
                },
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'brands',
            key: 'brands.brand',
            as: 'brand',
            isArray: false,
        }));

        pipeLine.push({
            $group: {
                _id: null,
                brand: { $addToSet: '$brand' },
                category: { $addToSet: '$category' },
                brands: { $addToSet: '$brands' },
                country: { $addToSet: '$country' },
                region: { $addToSet: '$region' },
                subRegion: { $addToSet: '$subRegion' },
                retailSegment: { $addToSet: '$retailSegment' },
                outlet: { $addToSet: '$outlet' },
                position: { $addToSet: '$position' },
                branch: { $addToSet: '$branch' },
                personnel: { $addToSet: '$createdBy.user' },
            },
        });
        aggregation = ShelfSharesModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true,
        };

        aggregation.exec((err, result) => {
            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {
                category: result.category || [],
                brand: result.brand || [],
                country: result.country || [],
                region: result.region || [],
                subRegion: result.subRegion || [],
                retailSegment: result.retailSegment || [],
                outlet: result.outlet || [],
                branch: result.branch || [],
                position: result.position || [],
                personnel: result.personnel || [],
            };

            redisFilters({
                currentSelected,
                filterExists,
                filtersObject: result,
                personnelId: req.personnelModel._id,
                contentType: CONTENT_TYPES.SHELFSHARES,
            }, (err, response) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.priceSurveyFilters = function (req, res, next) {
        const _ = require('lodash'); // override _
        const moment = require('moment');
        const locationFilter = require('./../stories/customReports/utils/locationFilter');

        const query = req.query;
        const timeFilter = query.time;
        const user = req.personnelModel;
        const filterMapper = new FilterMapper();
        const filter = filterMapper.mapFilter({
            contentType: CONTENT_TYPES.PRICESURVEY,
            filter: query.filter,
            personnel: req.personnelModel,
        });

        const queryFilter = {};

        [
            CONTENT_TYPES.COUNTRY,
            CONTENT_TYPES.REGION,
            CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT,
            CONTENT_TYPES.OUTLET,
            CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.POSITION,
            CONTENT_TYPES.PERSONNEL,
            'metric',
            'size',
        ].forEach(filterName => {
            if (filter[filterName]) {
                queryFilter[filterName] = filter[filterName].$in;
            }
        });

        const pipeline = [
            {
                $project: {
                    _id: 1,
                    country: 1,
                    region: 1,
                    subRegion: 1,
                    branch: 1,
                    createdAt: '$createdBy.date',
                },
            },
        ];

        const scopeFilter = {};

        locationFilter(pipeline, user, queryFilter, scopeFilter);

        if (timeFilter) {
            pipeline.push({
                $match: {
                    $and: [
                        { createdAt: { $gt: moment(timeFilter.values[0])._d } },
                        { createdAt: { $lt: moment(timeFilter.values[1])._d } },
                    ],
                },
            });
        }

        pipeline.push(...[
            {
                $project: {
                    _id: 1,
                    country: 1,
                },
            },
            {
                $group: {
                    _id: null,
                    country: { $addToSet: '$country' },
                    items: { $push: '$$ROOT._id' },
                },
            },
            {
                $project: {
                    _id: '$items',
                    country: 1,
                },
            },
            {
                $unwind: {
                    path: '$_id',
                },
            },
            {
                $lookup: {
                    from: 'priceSurveys',
                    localField: '_id',
                    foreignField: '_id',
                    as: '_id',
                },
            },
            {
                $project: {
                    _id: false,
                    priceSurvey: {
                        $let: {
                            vars: {
                                priceSurvey: { $arrayElemAt: ['$_id', 0] },
                            },
                            in: {
                                _id: '$$priceSurvey._id',
                                country: '$$priceSurvey.country',
                                region: '$$priceSurvey.region',
                                subRegion: '$$priceSurvey.subRegion',
                                branch: '$$priceSurvey.branch',
                                product: '$$priceSurvey.category',
                                publisher: '$$priceSurvey.createdBy.user',
                                items: '$$priceSurvey.items',
                            },
                        },
                    },
                    country: 1,
                },
            },
        ]);

        if (_.get(queryFilter, `${CONTENT_TYPES.COUNTRY}.length`)) {
            pipeline.push({
                $match: {
                    'priceSurvey.country': {
                        $in: queryFilter[CONTENT_TYPES.COUNTRY],
                    },
                },
            });
        }

        pipeline.push(...[
            {
                $project: {
                    _id: '$priceSurvey._id',
                    country: 1,
                    region: '$priceSurvey.region',
                    subRegion: '$priceSurvey.subRegion',
                    branch: '$priceSurvey.branch',
                    product: '$priceSurvey.product',
                    publisher: '$priceSurvey.publisher',
                    items: '$priceSurvey.items',
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'country',
                    foreignField: '_id',
                    as: 'country',
                },
            },
            {
                $addFields: {
                    country: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$country',
                                    as: 'country',
                                    cond: {
                                        $eq: ['$$country.archived', false],
                                    },
                                },
                            },
                            as: 'country',
                            in: '$$country._id',
                        },
                    },
                },
            },
        ]);

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'region',
                foreignField: '_id',
                as: 'region',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.COUNTRY}.length`)) {
                $addFields.region = {
                    $let: {
                        vars: {
                            filters: {
                                country: queryFilter[CONTENT_TYPES.COUNTRY],
                            },
                        },
                        in: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$region',
                                        as: 'region',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$region.archived', false] },
                                                { $setIsSubset: [['$$region.parent'], '$$filters.country'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'region',
                                in: '$$region._id',
                            },
                        },
                    },
                };
            } else {
                $addFields.region = {
                    $map: {
                        input: {
                            $filter: {
                                input: '$region',
                                as: 'region',
                                cond: {
                                    $eq: ['$$region.archived', false],
                                },
                            },
                        },
                        as: 'region',
                        in: '$$region._id',
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        if (scopeFilter[CONTENT_TYPES.REGION]) {
            pipeline.push({
                $addFields: {
                    region: {
                        $filter: {
                            input: '$region',
                            as: 'region',
                            cond: {
                                $setIsSubset: [['$$region'], scopeFilter[CONTENT_TYPES.REGION]],
                            },
                        },
                    },
                },
            });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.REGION}.length`)) {
            pipeline.push(...[
                {
                    $addFields: {
                        acceptable: {
                            $let: {
                                vars: {
                                    filters: {
                                        region: queryFilter[CONTENT_TYPES.REGION],
                                    },
                                },
                                in: {
                                    $cond: {
                                        if: {
                                            $gt: [{
                                                $size: {
                                                    $filter: {
                                                        input: '$region',
                                                        as: 'region',
                                                        cond: {
                                                            $setIsSubset: [['$$region'], '$$filters.region'],
                                                        },
                                                    },
                                                },
                                            }, 0],
                                        },
                                        then: true,
                                        else: false,
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    $match: {
                        acceptable: true,
                    },
                },
            ]);
        }

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegion',
                foreignField: '_id',
                as: 'subRegion',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.REGION}.length`)) {
                $addFields.subRegion = {
                    $let: {
                        vars: {
                            filters: {
                                region: queryFilter[CONTENT_TYPES.REGION],
                            },
                        },
                        in: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$subRegion',
                                        as: 'subRegion',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$subRegion.archived', false] },
                                                { $setIsSubset: [['$$subRegion.parent'], '$$filters.region'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'subRegion',
                                in: '$$subRegion._id',
                            },
                        },
                    },
                };
            } else {
                $addFields.subRegion = {
                    $map: {
                        input: {
                            $filter: {
                                input: '$subRegion',
                                as: 'subRegion',
                                cond: {
                                    $and: [
                                        { $eq: ['$$subRegion.archived', false] },
                                        { $setIsSubset: [['$$subRegion.parent'], '$region'] },
                                    ],
                                },
                            },
                        },
                        as: 'subRegion',
                        in: '$$subRegion._id',
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        if (scopeFilter[CONTENT_TYPES.SUBREGION]) {
            pipeline.push({
                $addFields: {
                    subRegion: {
                        $filter: {
                            input: '$subRegion',
                            as: 'subRegion',
                            cond: {
                                $setIsSubset: [['$$subRegion'], scopeFilter[CONTENT_TYPES.SUBREGION]],
                            },
                        },
                    },
                },
            });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.SUBREGION}.length`)) {
            pipeline.push(...[{
                $addFields: {
                    acceptable: {
                        $let: {
                            vars: {
                                filters: {
                                    subRegion: queryFilter[CONTENT_TYPES.SUBREGION],
                                },
                            },
                            in: {
                                $cond: {
                                    if: {
                                        $gt: [{
                                            $size: {
                                                $filter: {
                                                    input: '$subRegion',
                                                    as: 'subRegion',
                                                    cond: {
                                                        $setIsSubset: [['$$subRegion'], '$$filters.subRegion'],
                                                    },
                                                },
                                            },
                                        }, 0],
                                    },
                                    then: true,
                                    else: false,
                                },
                            },
                        },
                    },
                },
            },
                {
                    $match: {
                        acceptable: true,
                    },
                },
            ]);
        }

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'branch',
                foreignField: '_id',
                as: 'branch',
            },
        });
        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.SUBREGION}.length`)) {
                $addFields.branch = {
                    $let: {
                        vars: {
                            filters: {
                                subRegion: queryFilter[CONTENT_TYPES.SUBREGION],
                            },
                        },
                        in: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$branch',
                                        as: 'branch',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$branch.archived', false] },
                                                { $setIsSubset: [['$$branch.subRegion'], '$$filters.subRegion'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'branch',
                                in: {
                                    _id: '$$branch._id',
                                    retailSegment: '$$branch.retailSegment',
                                    outlet: '$$branch.outlet',
                                },
                            },
                        },
                    },
                };
            } else {
                $addFields.branch = {
                    $map: {
                        input: {
                            $filter: {
                                input: '$branch',
                                as: 'branch',
                                cond: {
                                    $and: [
                                        { $eq: ['$$branch.archived', false] },
                                        { $setIsSubset: [['$$branch.subRegion'], '$subRegion'] },
                                    ],
                                },
                            },
                        },
                        as: 'branch',
                        in: {
                            _id: '$$branch._id',
                            retailSegment: '$$branch.retailSegment',
                            outlet: '$$branch.outlet',
                        },
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        pipeline.push({
            $addFields: {
                retailSegment: {
                    $setUnion: ['$branch.retailSegment', []],
                },
            },
        });

        if (_.get(queryFilter, `${CONTENT_TYPES.RETAILSEGMENT}.length`)) {
            pipeline.push({
                $addFields: {
                    branch: {
                        $let: {
                            vars: {
                                filters: {
                                    retailSegment: queryFilter[CONTENT_TYPES.RETAILSEGMENT],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch',
                                            as: 'branch',
                                            cond: {
                                                $setIsSubset: [['$$branch.retailSegment'], '$$filters.retailSegment'],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: {
                                        _id: '$$branch._id',
                                        retailSegment: '$$branch.retailSegment',
                                        outlet: '$$branch.outlet',
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        pipeline.push({
            $addFields: {
                outlet: {
                    $setUnion: ['$branch.outlet', []],
                },
            },
        });

        if (_.get(queryFilter, `${CONTENT_TYPES.OUTLET}.length`)) {
            pipeline.push({
                $addFields: {
                    branch: {
                        $let: {
                            vars: {
                                filters: {
                                    outlet: queryFilter[CONTENT_TYPES.OUTLET],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch',
                                            as: 'branch',
                                            cond: {
                                                $setIsSubset: [['$$branch.outlet'], '$$filters.outlet'],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: {
                                        _id: '$$branch._id',
                                        retailSegment: '$$branch.retailSegment',
                                        outlet: '$$branch.outlet',
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        pipeline.push({
            $addFields: {
                branch: {
                    $map: {
                        input: '$branch',
                        as: 'branch',
                        in: '$$branch._id',
                    },
                },
            },
        });

        if (_.get(queryFilter, `${CONTENT_TYPES.BRANCH}.length`)) {
            pipeline.push(...[
                {
                    $group: {
                        _id: null,
                        items: { $push: '$$ROOT' },
                    },
                },
                {
                    $project: {
                        _id: false,
                        items: 1,
                        matchedItems: {
                            $let: {
                                vars: {
                                    filters: {
                                        branch: queryFilter[CONTENT_TYPES.BRANCH],
                                    },
                                },
                                in: {
                                    $filter: {
                                        input: '$items',
                                        as: 'item',
                                        cond: {
                                            $gt: [{
                                                $size: {
                                                    $filter: {
                                                        input: '$$item.branch',
                                                        as: 'branch',
                                                        cond: {
                                                            $setIsSubset: [['$$branch'], '$$filters.branch'],
                                                        },
                                                    },
                                                },
                                            }, 0],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                /*
                 * tip: key thing is that if at least one item match condition then it's true condition,
                 * else condition is incorrect and branches with one of provided trade channel or outlet aren't exists.
                 */
                {
                    $project: {
                        items: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: '$matchedItems',
                                    }, 0],
                                },
                                then: '$matchedItems',
                                else: '$items',
                            },
                        },
                    },
                },
                {
                    $unwind: {
                        path: '$items',
                    },
                },
                {
                    $replaceRoot: {
                        newRoot: '$items',
                    },
                },
            ]);
        }

        pipeline.push(...[
            {
                $project: {
                    _id: 1,
                    country: 1,
                    region: { $arrayElemAt: ['$region', 0] },
                    subRegion: { $arrayElemAt: ['$subRegion', 0] },
                    branch: { $arrayElemAt: ['$branch', 0] },
                    retailSegment: { $arrayElemAt: ['$retailSegment', 0] },
                    outlet: { $arrayElemAt: ['$outlet', 0] },
                    product: 1,
                    items: 1,
                    publisher: 1,
                },
            },
            {
                $unwind: '$items',
            },
            {
                $group: {
                    _id: null,
                    country: { $first: '$country' },
                    region: { $addToSet: '$region' },
                    subRegion: { $addToSet: '$subRegion' },
                    branch: { $addToSet: '$branch' },
                    retailSegment: { $addToSet: '$retailSegment' },
                    outlet: { $addToSet: '$outlet' },
                    products: { $addToSet: '$product' },
                    sizes: { $addToSet: '$sizes' },
                    metrics: { $addToSet: '$metrics' },
                    publishers: { $addToSet: '$publisher' },
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'country',
                    foreignField: '_id',
                    as: 'country',
                },
            },
            {
                $addFields: {
                    country: {
                        $map: {
                            input: '$country',
                            as: 'country',
                            in: {
                                _id: '$$country._id',
                                name: '$$country.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'products',
                    foreignField: '_id',
                    as: 'products',
                },
            },
            {
                $addFields: {
                    products: {
                        $map: {
                            input: '$products',
                            as: 'product',
                            in: {
                                _id: '$$product._id',
                                name: '$$product.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'personnels',
                    localField: 'publishers',
                    foreignField: '_id',
                    as: 'publishers',
                },
            },
            {
                $addFields: {
                    publishers: {
                        $filter: {
                            input: {
                                $map: {
                                    input: '$publishers',
                                    as: 'publisher',
                                    in: {
                                        _id: '$$publisher._id',
                                        name: {
                                            en: { $concat: ['$$publisher.firstName.en', ' ', '$$publisher.lastName.en'] },
                                            ar: { $concat: ['$$publisher.firstName.ar', ' ', '$$publisher.lastName.ar'] },
                                        },
                                        position: '$$publisher.position',
                                    },
                                },
                            },
                            as: 'publisher',
                            cond: {
                                $ne: ['$$publisher.position', null],
                            },
                        },
                    },
                },
            },
            {
                $addFields: {
                    publishersPosition: {
                        $setUnion: [{
                            $map: {
                                input: '$publishers',
                                as: 'publisher',
                                in: '$$publisher.position',
                            },
                        }, []],
                    },
                },
            },
        ]);

        if (_.get(queryFilter, `${CONTENT_TYPES.POSITION}.length`)) {
            pipeline.push({
                $addFields: {
                    recipients: {
                        $filter: {
                            input: '$publisher',
                            as: 'publisher',
                            cond: {
                                $setIsSubset: [['$$publisher.position'], queryFilter[CONTENT_TYPES.POSITION]],
                            },
                        },
                    },
                },
            });
        }

        pipeline.push(...[
            {
                $lookup: {
                    from: 'positions',
                    localField: 'publishersPosition',
                    foreignField: '_id',
                    as: 'publishersPosition',
                },
            },
            {
                $addFields: {
                    publishers: {
                        $map: {
                            input: '$publishers',
                            as: 'publisher',
                            in: {
                                _id: '$$publisher._id',
                                name: '$$publisher.name',
                            },
                        },
                    },
                    publishersPosition: {
                        $map: {
                            input: '$publishersPosition',
                            as: 'position',
                            in: {
                                _id: '$$position._id',
                                name: '$$position.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'region',
                    foreignField: '_id',
                    as: 'region',
                },
            },
            {
                $addFields: {
                    region: {
                        $map: {
                            input: '$region',
                            as: 'region',
                            in: {
                                _id: '$$region._id',
                                name: '$$region.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'subRegion',
                    foreignField: '_id',
                    as: 'subRegion',
                },
            },
            {
                $addFields: {
                    subRegion: {
                        $map: {
                            input: '$subRegion',
                            as: 'subRegion',
                            in: {
                                _id: '$$subRegion._id',
                                name: '$$subRegion.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'retailSegments',
                    localField: 'retailSegment',
                    foreignField: '_id',
                    as: 'retailSegment',
                },
            },
            {
                $addFields: {
                    retailSegment: {
                        $map: {
                            input: '$retailSegment',
                            as: 'retailSegment',
                            in: {
                                _id: '$$retailSegment._id',
                                name: '$$retailSegment.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'outlets',
                    localField: 'outlet',
                    foreignField: '_id',
                    as: 'outlet',
                },
            },
            {
                $addFields: {
                    outlet: {
                        $map: {
                            input: '$outlet',
                            as: 'outlet',
                            in: {
                                _id: '$$outlet._id',
                                name: '$$outlet.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'branches',
                    localField: 'branch',
                    foreignField: '_id',
                    as: 'branch',
                },
            },
            {
                $addFields: {
                    branch: {
                        $map: {
                            input: '$branch',
                            as: 'branch',
                            in: {
                                _id: '$$branch._id',
                                name: '$$branch.name',
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: false,
                    country: 1,
                    region: 1,
                    sizes: 1,
                    metrics: 1,
                    subRegion: 1,
                    branch: 1,
                    outlet: 1,
                    retailSegment: 1,
                    category: '$products',
                    position: '$publishersPosition',
                    personnel: '$publishers',
                    translated: [],
                },
            },
        ]);

        async.waterfall([

            (cb) => {
                PriceSurveyModel.aggregate(pipeline)
                    .allowDiskUse(true)
                    .exec(cb);
            },

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            const body = result[0];

            res.status(200).send(body);
        });
    };

    this.itemsAndPricesFilters = function (req, res, next) {
        const query = req.query;
        const queryFilter = query.filter || {};

        const currentSelected = query.current;
        const filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);

        const filterMapper = new FilterMapper();
        const filter = filterMapper.mapFilter({
            filter: queryFilter,
            personnel: req.personnelModel,
        });

        const aggregateHelper = new AggregationHelper($defProjection, filter);

        const beforeFilter = _.pick(filter, 'country', 'location', 'category', 'variant', 'archived');
        const afterFilter = _.pick(filter, 'origin');
        let pipeline = [];
        let aggregation;

        pipeline.push({
            $match: beforeFilter,
        });

        pipeline = _.union(pipeline, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key: 'country',
            as: 'country',
            isArray: false,
        }));

        pipeline = _.union(pipeline, aggregateHelper.aggregationPartMaker({
            from: 'categories',
            key: 'category',
            as: 'category',
            isArray: false,
        }));

        pipeline = _.union(pipeline, aggregateHelper.aggregationPartMaker({
            from: 'variants',
            key: 'variant',
            as: 'variant',
            isArray: false,
        }));

        pipeline.push({
            $unwind: {
                path: '$location',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeline = _.union(pipeline, aggregateHelper.aggregationPartMaker({
            from: 'outlets',
            key: 'location.outlet',
            as: 'outlet',
            isArray: false,
        }));

        pipeline = _.union(pipeline, aggregateHelper.aggregationPartMaker({
            from: 'retailSegments',
            key: 'location.retailSegment',
            as: 'retailSegment',
            isArray: false,
        }));

        pipeline.push({
            $match: afterFilter,
        });

        pipeline.push({
            $unwind: {
                path: '$origin',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeline = _.union(pipeline, aggregateHelper.aggregationPartMaker({
            from: 'origins',
            key: 'origin',
            as: 'origin',
            isArray: false,
        }));

        pipeline.push({
            $group: {
                _id: null,
                country: { $addToSet: '$country' },
                retailSegment: { $addToSet: '$retailSegment' },
                outlet: { $addToSet: '$outlet' },
                category: { $addToSet: '$category' },
                variant: { $addToSet: '$variant' },
                origin: { $addToSet: '$origin' },
            },
        });

        aggregation = ItemModel.aggregate(pipeline);

        aggregation.options = {
            allowDiskUse: true,
        };

        aggregation.exec((err, result) => {
            let response;

            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {
                country: result.country || [],
                retailSegment: result.retailSegment || [],
                outlet: result.outlet || [],
                category: result.category || [],
                variant: result.variant || [],
                origin: result.origin || [],
            };

            redisFilters({
                currentSelected,
                filterExists,
                filtersObject: result,
                personnelId: req.personnelModel._id,
                contentType: CONTENT_TYPES.ITEM,
            }, (err, response) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.itemsToOutletCountry = function (req, res, next) {
        const personnel = req.personnelModel;
        let pipeLine = [];
        const aggregateHelper = new AggregationHelper($defProjection);
        let aggregation;

        if (personnel.country.length) {
            pipeLine.push({
                $match: {
                    country: {
                        $in: personnel.country,
                    },
                },
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key: 'country',
            isArray: false,
        }));

        pipeLine.push({
            $project: {
                _id: '$country._id',
                name: '$country.name',
            },
        });

        pipeLine.push({
            $group: {
                _id: '$_id',
                name: { $first: '$name' },
            },
        });

        aggregation = ItemModel.aggregate(pipeLine);
        aggregation.options = {
            allowDiskUse: true,
        };
        aggregation.exec((err, result) => {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });
    };

    this.activityListFilters = require('./../stories/activityList/routes/filters');

    this.branchFilters = function (req, res, next) {
        const query = req.query;
        const queryFilter = query.filter || {};
        const pipeLine = [];

        const filterMapper = new FilterMapper();

        const filter = filterMapper.mapFilter({
            filter: queryFilter,
            personnel: req.personnelModel,
        });

        const beforeFilter = _.pick(filter, 'subRegion', 'retailSegment', 'outlet');

        // match by 'subRegion', 'retailSegment', 'outlet'
        if (Object.keys(beforeFilter).length) {
            pipeLine.push({
                $match: beforeFilter,
            });
        }

        // subRegion pipelines START
        pipeLine.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegion',
                foreignField: '_id',
                as: 'subRegion',
            },
        }, {
            $unwind: {
                path: '$subRegion',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $project: {
                subRegion: {
                    _id: 1,
                    name: 1,
                },
                region: '$subRegion.parent',
                _id: 1,
                name: 1,
                retailSegment: 1,
                outlet: 1,
            },
        });
        // subRegion pipelines END

        // region pipelines START
        if (filter.region) {
            pipeLine.push({
                $match: {
                    region: filter.region,
                },
            });
        }

        pipeLine.push({
            $lookup: {
                from: 'domains',
                localField: 'region',
                foreignField: '_id',
                as: 'region',
            },
        }, {
            $unwind: {
                path: '$region',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $project: {
                region: {
                    _id: 1,
                    name: 1,
                },
                country: '$region.parent',
                _id: 1,
                name: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
            },
        });
        // region pipelines END

        // country pipelines START
        if (filter.country) {
            pipeLine.push({
                $match: {
                    country: filter.country,
                },
            });
        }

        pipeLine.push({
            $lookup: {
                from: 'domains',
                localField: 'country',
                foreignField: '_id',
                as: 'country',
            },
        }, {
            $unwind: {
                path: '$country',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $project: {
                country: {
                    _id: 1,
                    name: 1,
                },
                _id: 1,
                name: 1,
                subRegion: 1,
                region: 1,
                retailSegment: 1,
                outlet: 1,
            },
        });
        // country pipelines END

        // end pipelines - retailSegment, outlet
        pipeLine.push({
            $lookup: {
                from: 'retailSegments',
                localField: 'retailSegment',
                foreignField: '_id',
                as: 'retailSegment',
            },
        }, {
            $unwind: {
                path: '$retailSegment',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from: 'outlets',
                localField: 'outlet',
                foreignField: '_id',
                as: 'outlet',
            },
        }, {
            $unwind: {
                path: '$outlet',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $project: {
                retailSegment: {
                    _id: 1,
                    name: 1,
                },
                outlet: {
                    _id: 1,
                    name: 1,
                },
                country: 1,
                region: 1,
                subRegion: 1,
                branch: {
                    _id: '$_id',
                    name: '$name',
                },
            },
        });

        // group all data ito one document
        pipeLine.push({
            $group: {
                _id: null,
                branch: { $addToSet: '$branch' },
                country: { $addToSet: '$country' },
                region: { $addToSet: '$region' },
                subRegion: { $addToSet: '$subRegion' },
                retailSegment: { $addToSet: '$retailSegment' },
                outlet: { $addToSet: '$outlet' },
            },
        });

        BranchModel.aggregate(pipeLine).allowDiskUse(true).exec((err, result) => {
            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {
                country: result.country || [],
                region: result.region || [],
                subRegion: result.subRegion || [],
                branch: result.branch || [],
                retailSegment: result.retailSegment || [],
                outlet: result.outlet || [],
            };

            res.status(200).send(result);
        });
    };

    this.questionnary = function (req, res, next) {
        const personnelId = req.personnelModel._id;
        const CONSTANTS = require('../public/js/constants/otherConstants');
        const query = req.query;
        const filterMapper = new FilterMapper();
        const personnel = req.personnelModel;
        const locations = ['country', 'region', 'subRegion', 'branch'];
        const filter = filterMapper.mapFilter({
            filter: query.filter,
        });
        const pipeLine = [];

        pipeLine.push({
            $match: {
                $and: [
                    {
                        $or: [
                            {
                                'createdBy.user': personnelId,
                                status: {
                                    $in: ['draft', 'expired'],
                                },
                            },
                            {
                                status: {
                                    $nin: ['draft', 'expired'],
                                },
                            },
                        ],
                    },
                ],
            },
        });

        if (filter.publisher) {
            pipeLine.push({
                $match: {
                    'createdBy.user': filter.publisher,
                },
            });
        }

        if (req.session.level === ACL_CONSTANTS.AREA_IN_CHARGE) {
            locations.pop();
        }

        const $locationMatch = {
            $and: [],
        };

        locations.forEach((location) => {
            if ((filter[location] && filter[location].$in && filter[location].$in.length) || (personnel[location] && personnel[location].length)) {
                $locationMatch.$and.push({
                    $or: [
                        {
                            [location]: { $in: filter[location] && filter[location].$in || personnel[location] },
                        },
                        {
                            [location]: { $eq: [] },
                        },
                        {
                            [location]: { $eq: null },
                        },
                        {
                            'createdBy.user': { $eq: personnelId },
                        },
                        {
                            personnels: personnel._id,
                        },
                    ],
                });
            }
        });

        if ($locationMatch.$and.length) {
            pipeLine.push({
                $match: $locationMatch,
            });
        }

        pipeLine.push({
            $lookup: {
                from: 'personnels',
                localField: 'personnels',
                foreignField: '_id',
                as: 'personnels',
            },
        });

        pipeLine.push({
            $lookup: {
                from: 'personnels',
                localField: 'createdBy.user',
                foreignField: '_id',
                as: 'createdBy.user',
            },
        });

        pipeLine.push({
            $lookup: {
                from: 'domains',
                localField: 'country',
                foreignField: '_id',
                as: 'country',
            },
        });

        pipeLine.push({
            $lookup: {
                from: 'domains',
                localField: 'region',
                foreignField: '_id',
                as: 'region',
            },
        });

        pipeLine.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegion',
                foreignField: '_id',
                as: 'subRegion',
            },
        });

        pipeLine.push({
            $lookup: {
                from: 'branches',
                localField: 'branch',
                foreignField: '_id',
                as: 'branch',
            },
        });

        pipeLine.push({
            $project: {
                title: 1,
                dueDate: 1,
                status: 1,
                location: 1,
                country: {
                    _id: 1,
                    name: 1,
                },
                region: {
                    _id: 1,
                    name: 1,
                    parent: 1,
                },
                subRegion: {
                    _id: 1,
                    name: 1,
                    parent: 1,
                },
                retailSegment: 1,
                outlet: 1,
                branch: {
                    _id: 1,
                    name: 1,
                    subRegion: 1,
                    outlet: 1,
                    retailSegment: 1,
                },
                position: { $concatArrays: ['$createdBy.user.position', '$personnels.position'] },
                personnels: {
                    $map: {
                        input: '$personnels',
                        as: 'item',
                        in: {
                            _id: '$$item._id',
                            firstName: '$$item.firstName',
                            lastName: '$$item.lastName',
                            position: '$$item.position',
                            name: {
                                ar: {
                                    $concat: ['$$item.firstName.ar', ' ', '$$item.lastName.ar'],
                                },
                                en: {
                                    $concat: ['$$item.firstName.en', ' ', '$$item.lastName.en'],
                                },
                            },
                        },
                    },
                },
                countAll: 1,
                countBranches: 1,
                countAnswered: 1,
                questions: 1,
                createdBy: {
                    date: 1,
                    user: {
                        $let: {
                            vars: {
                                personnel: {
                                    $arrayElemAt: ['$createdBy.user', 0],
                                },
                            },
                            in: {
                                _id: '$$personnel._id',
                                firstName: '$$personnel.firstName',
                                lastName: '$$personnel.lastName',
                                position: '$$personnel.position',
                                name: {
                                    ar: {
                                        $concat: ['$$personnel.firstName.ar', ' ', '$$personnel.lastName.ar'],
                                    },
                                    en: {
                                        $concat: ['$$personnel.firstName.en', ' ', '$$personnel.lastName.en'],
                                    },
                                },
                            },
                        },
                    },
                },
                editedBy: 1,
            },
        });

        if (filter.position) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'createdBy.user.position': filter.position,
                        },
                        {
                            'personnels.position': filter.position,
                        },
                    ],
                },
            });
        }

        pipeLine.push({
            $lookup: {
                from: 'positions',
                localField: 'position',
                foreignField: '_id',
                as: 'position',
            },
        });

        if (filter.outlet) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            outlet: filter.outlet,
                        },
                        {
                            outlet: { $eq: [] },
                        },
                        {
                            outlet: { $eq: null },
                        },
                        {
                            'createdBy.user': { $eq: personnelId },
                        },
                        {
                            personnels: personnel._id,
                        },
                    ],
                },
            });
        }

        if (filter.retailSegment) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            retailSegment: filter.retailSegment,
                        },
                        {
                            retailSegment: { $eq: [] },
                        },
                        {
                            retailSegment: { $eq: null },
                        },
                        {
                            'createdBy.user': { $eq: personnelId },
                        },
                        {
                            personnels: personnel._id,
                        },
                    ],
                },
            });
        }

        pipeLine.push({
            $lookup: {
                from: 'outlets',
                localField: 'outlet',
                foreignField: '_id',
                as: 'outlet',
            },
        });

        pipeLine.push({
            $lookup: {
                from: 'retailSegments',
                localField: 'retailSegment',
                foreignField: '_id',
                as: 'retailSegment',
            },
        });

        pipeLine.push({
            $project: {
                title: 1,
                dueDate: 1,
                status: 1,
                location: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: {
                    _id: 1,
                    name: 1,
                    subRegions: 1,
                },
                outlet: {
                    _id: 1,
                    name: 1,
                    retailSegments: 1,
                    subRegions: 1,
                },
                branch: 1,
                position: 1,
                personnels: 1,
                countAll: 1,
                countBranches: 1,
                countAnswered: 1,
                questions: 1,
                createdBy: 1,
                editedBy: 1,
                publisher: {
                    _id: '$createdBy.user._id',
                    position: '$createdBy.user.position',
                    name: {
                        en: { $concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en'] },
                        ar: { $concat: ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar'] },
                    },
                },
            },
        });

        pipeLine.push({
            $group: {
                _id: null,
                personnel: { $addToSet: '$personnels' },
                country: { $addToSet: '$country' },
                region: { $addToSet: '$region' },
                subRegion: { $addToSet: '$subRegion' },
                retailSegment: { $addToSet: '$retailSegment' },
                outlet: { $addToSet: '$outlet' },
                branch: { $addToSet: '$branch' },
                position: { $addToSet: '$position' },
                publisher: { $addToSet: '$publisher' },
                status: { $addToSet: '$status' },
            },
        });

        const aggregation = QuestionnaryModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true,
        };

        aggregation.exec((err, response) => {
            let result;
            if (err) {
                return next(err);
            }

            result = response[0] || {};

            result = {
                country: result.country && _.flatten(result.country) || [],
                region: result.region && _.flatten(result.region) || [],
                subRegion: result.subRegion && _.flatten(result.subRegion) || [],
                retailSegment: result.retailSegment && _.flatten(result.retailSegment) || [],
                outlet: result.outlet && _.flatten(result.outlet) || [],
                branch: result.branch && _.flatten(result.branch) || [],
                publisher: result.publisher || [],
                position: result.position && _.flatten(result.position) || [],
                personnel: result.personnel && _.flatten(result.personnel) || [],
                status: mapFiltersValues(result.status, CONSTANTS.CONTRACTS_UI_STATUSES),
            };

            res.status(200).send(result);
        });
    };

    this.createQuestionnary = function (req, res, next) {
        const _ = require('lodash'); // override _
        const locationFilter = require('./../stories/customReports/utils/locationFilter');

        const query = req.query;
        const user = req.personnelModel;
        const filterMapper = new FilterMapper();
        const filter = filterMapper.mapFilter({
            contentType: CONTENT_TYPES.PERSONNEL,
            filter: query.filter,
            personnel: req.personnelModel,
        });

        const queryFilter = {};

        [
            CONTENT_TYPES.COUNTRY,
            CONTENT_TYPES.REGION,
            CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT,
            CONTENT_TYPES.OUTLET,
            CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.POSITION,
        ].forEach(filterName => {
            if (filter[filterName]) {
                queryFilter[filterName] = filter[filterName].$in;
            }
        });

        const pipeline = [];

        const scopeFilter = {};

        locationFilter(pipeline, user, queryFilter, scopeFilter);

        pipeline.push(...[
            {
                $project: {
                    _id: 1,
                    country: 1,
                    archived: 1,
                },
            },
            {
                $match: {
                    archived: false,
                },
            },
            {
                $project: {
                    _id: 1,
                    country: {
                        $ifNull: ['$country', []],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    country: { $push: '$country' },
                    items: { $push: '$$ROOT._id' },
                },
            },
            {
                $project: {
                    _id: '$items',
                    country: {
                        $reduce: {
                            input: '$country',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                },
            },
            {
                $unwind: {
                    path: '$_id',
                },
            },
            {
                $lookup: {
                    from: 'personnels',
                    localField: '_id',
                    foreignField: '_id',
                    as: '_id',
                },
            },
            {
                $project: {
                    _id: false,
                    employee: {
                        $let: {
                            vars: {
                                employee: { $arrayElemAt: ['$_id', 0] },
                            },
                            in: {
                                _id: '$$employee._id',
                                name: {
                                    en: {
                                        $concat: ['$$employee.firstName.en', ' ', '$$employee.lastName.en'],
                                    },
                                    ar: {
                                        $concat: ['$$employee.firstName.ar', ' ', '$$employee.lastName.ar'],
                                    },
                                },
                                country: '$$employee.country',
                                region: '$$employee.region',
                                subRegion: '$$employee.subRegion',
                                branch: '$$employee.branch',
                                position: '$$employee.position',
                            },
                        },
                    },
                    country: 1,
                },
            },
        ]);

        if (_.get(queryFilter, `${CONTENT_TYPES.COUNTRY}.length`)) {
            pipeline.push({
                $match: {
                    'employee.country': {
                        $in: queryFilter[CONTENT_TYPES.COUNTRY],
                    },
                },
            });
        }

        pipeline.push(...[
            {
                $project: {
                    _id: '$employee._id',
                    name: '$employee.name',
                    country: { $ifNull: ['$country', []] },
                    region: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$employee.region', []] } }, 0] },
                            then: { selected: '$employee.region' },
                            else: { all: 'region' },
                        },
                    },
                    subRegion: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$employee.subRegion', []] } }, 0] },
                            then: { selected: '$employee.subRegion' },
                            else: { all: 'subRegion' },
                        },
                    },
                    branch: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$employee.branch', []] } }, 0] },
                            then: { selected: '$employee.branch' },
                            else: { all: 'branch' },
                        },
                    },
                    position: '$employee.position',
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'country',
                    foreignField: '_id',
                    as: 'country',
                },
            },
            {
                $addFields: {
                    country: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$country',
                                    as: 'country',
                                    cond: {
                                        $eq: ['$$country.archived', false],
                                    },
                                },
                            },
                            as: 'country',
                            in: '$$country._id',
                        },
                    },
                },
            },
        ]);

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'region.selected',
                foreignField: '_id',
                as: 'region.selected',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.COUNTRY}.length`)) {
                $addFields['region.selected'] = {
                    $let: {
                        vars: {
                            filters: {
                                country: queryFilter[CONTENT_TYPES.COUNTRY],
                            },
                        },
                        in: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$region.selected',
                                        as: 'region',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$region.archived', false] },
                                                { $setIsSubset: [['$$region.parent'], '$$filters.country'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'region',
                                in: '$$region._id',
                            },
                        },
                    },
                };
            } else {
                $addFields['region.selected'] = {
                    $map: {
                        input: {
                            $filter: {
                                input: '$region.selected',
                                as: 'region',
                                cond: {
                                    $eq: ['$$region.archived', false],
                                },
                            },
                        },
                        as: 'region',
                        in: '$$region._id',
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'region.all',
                foreignField: 'type',
                as: 'region.all',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.COUNTRY}.length`)) {
                $addFields.region = {
                    $let: {
                        vars: {
                            filters: {
                                country: queryFilter[CONTENT_TYPES.COUNTRY],
                            },
                        },
                        in: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: {
                                            $ifNull: ['$region.selected', []],
                                        },
                                    }, 0],
                                },
                                then: '$region.selected',
                                else: {
                                    $map: {
                                        input: {
                                            $filter: {
                                                input: '$region.all',
                                                as: 'region',
                                                cond: {
                                                    $and: [
                                                        { $eq: ['$$region.archived', false] },
                                                        { $setIsSubset: [['$$region.parent'], '$$filters.country'] },
                                                    ],
                                                },
                                            },
                                        },
                                        as: 'region',
                                        in: '$$region._id',
                                    },
                                },
                            },
                        },
                    },
                };
            } else {
                $addFields.region = {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: {
                                    $ifNull: ['$region.selected', []],
                                },
                            }, 0],
                        },
                        then: '$region.selected',
                        else: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$region.all',
                                        as: 'region',
                                        cond: {
                                            $eq: ['$$region.archived', false],
                                        },
                                    },
                                },
                                as: 'region',
                                in: '$$region._id',
                            },
                        },
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        if (scopeFilter[CONTENT_TYPES.REGION]) {
            pipeline.push({
                $addFields: {
                    region: {
                        $filter: {
                            input: '$region',
                            as: 'region',
                            cond: {
                                $setIsSubset: [['$$region'], scopeFilter[CONTENT_TYPES.REGION]],
                            },
                        },
                    },
                },
            });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.REGION}.length`)) {
            pipeline.push(...[
                {
                    $addFields: {
                        acceptable: {
                            $let: {
                                vars: {
                                    filters: {
                                        region: queryFilter[CONTENT_TYPES.REGION],
                                    },
                                },
                                in: {
                                    $cond: {
                                        if: {
                                            $gt: [{
                                                $size: {
                                                    $filter: {
                                                        input: '$region',
                                                        as: 'region',
                                                        cond: {
                                                            $setIsSubset: [['$$region'], '$$filters.region'],
                                                        },
                                                    },
                                                },
                                            }, 0],
                                        },
                                        then: true,
                                        else: false,
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    $match: {
                        acceptable: true,
                    },
                },
            ]);
        }

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegion.selected',
                foreignField: '_id',
                as: 'subRegion.selected',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.REGION}.length`)) {
                $addFields['subRegion.selected'] = {
                    $let: {
                        vars: {
                            filters: {
                                region: queryFilter[CONTENT_TYPES.REGION],
                            },
                        },
                        in: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$subRegion.selected',
                                        as: 'subRegion',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$subRegion.archived', false] },
                                                { $setIsSubset: [['$$subRegion.parent'], '$$filters.region'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'subRegion',
                                in: '$$subRegion._id',
                            },
                        },
                    },
                };
            } else {
                $addFields['subRegion.selected'] = {
                    $map: {
                        input: {
                            $filter: {
                                input: '$subRegion.selected',
                                as: 'subRegion',
                                cond: {
                                    $and: [
                                        { $eq: ['$$subRegion.archived', false] },
                                        { $setIsSubset: [['$$subRegion.parent'], '$region'] },
                                    ],
                                },
                            },
                        },
                        as: 'subRegion',
                        in: '$$subRegion._id',
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegion.all',
                foreignField: 'type',
                as: 'subRegion.all',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.REGION}.length`)) {
                $addFields.subRegion = {
                    $let: {
                        vars: {
                            filters: {
                                region: queryFilter[CONTENT_TYPES.REGION],
                            },
                        },
                        in: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: {
                                            $ifNull: ['$subRegion.selected', []],
                                        },
                                    }, 0],
                                },
                                then: '$subRegion.selected',
                                else: {
                                    $map: {
                                        input: {
                                            $filter: {
                                                input: '$subRegion.all',
                                                as: 'subRegion',
                                                cond: {
                                                    $and: [
                                                        { $eq: ['$$subRegion.archived', false] },
                                                        { $setIsSubset: [['$$subRegion.parent'], '$$filters.region'] },
                                                    ],
                                                },
                                            },
                                        },
                                        as: 'subRegion',
                                        in: '$$subRegion._id',
                                    },
                                },
                            },
                        },
                    },
                };
            } else {
                $addFields.subRegion = {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: {
                                    $ifNull: ['$subRegion.selected', []],
                                },
                            }, 0],
                        },
                        then: '$subRegion.selected',
                        else: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$subRegion.all',
                                        as: 'subRegion',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$subRegion.archived', false] },
                                                { $setIsSubset: [['$$subRegion.parent'], '$region'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'subRegion',
                                in: '$$subRegion._id',
                            },
                        },
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        if (scopeFilter[CONTENT_TYPES.SUBREGION]) {
            pipeline.push({
                $addFields: {
                    subRegion: {
                        $filter: {
                            input: '$subRegion',
                            as: 'subRegion',
                            cond: {
                                $setIsSubset: [['$$subRegion'], scopeFilter[CONTENT_TYPES.SUBREGION]],
                            },
                        },
                    },
                },
            });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.SUBREGION}.length`)) {
            pipeline.push(...[{
                $addFields: {
                    acceptable: {
                        $let: {
                            vars: {
                                filters: {
                                    subRegion: queryFilter[CONTENT_TYPES.SUBREGION],
                                },
                            },
                            in: {
                                $cond: {
                                    if: {
                                        $gt: [{
                                            $size: {
                                                $filter: {
                                                    input: '$subRegion',
                                                    as: 'subRegion',
                                                    cond: {
                                                        $setIsSubset: [['$$subRegion'], '$$filters.subRegion'],
                                                    },
                                                },
                                            },
                                        }, 0],
                                    },
                                    then: true,
                                    else: false,
                                },
                            },
                        },
                    },
                },
            },
                {
                    $match: {
                        acceptable: true,
                    },
                },
            ]);
        }

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'branch.selected',
                foreignField: '_id',
                as: 'branch.selected',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.SUBREGION}.length`)) {
                $addFields['branch.selected'] = {
                    $let: {
                        vars: {
                            filters: {
                                subRegion: queryFilter[CONTENT_TYPES.SUBREGION],
                            },
                        },
                        in: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$branch.selected',
                                        as: 'branch',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$branch.archived', false] },
                                                { $setIsSubset: [['$$branch.subRegion'], '$$filters.subRegion'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'branch',
                                in: {
                                    _id: '$$branch._id',
                                    retailSegment: '$$branch.retailSegment',
                                    outlet: '$$branch.outlet',
                                },
                            },
                        },
                    },
                };
            } else {
                $addFields['branch.selected'] = {
                    $map: {
                        input: {
                            $filter: {
                                input: '$branch.selected',
                                as: 'branch',
                                cond: {
                                    $and: [
                                        { $eq: ['$$branch.archived', false] },
                                        { $setIsSubset: [['$$branch.subRegion'], '$subRegion'] },
                                    ],
                                },
                            },
                        },
                        as: 'branch',
                        in: {
                            _id: '$$branch._id',
                            retailSegment: '$$branch.retailSegment',
                            outlet: '$$branch.outlet',
                        },
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        pipeline.push({
            $addFields: {
                retailSegment: {
                    $setUnion: ['$branch.selected.retailSegment', []],
                },
            },
        });

        if (_.get(queryFilter, `${CONTENT_TYPES.RETAILSEGMENT}.length`)) {
            pipeline.push({
                $addFields: {
                    'branch.selected': {
                        $let: {
                            vars: {
                                filters: {
                                    retailSegment: queryFilter[CONTENT_TYPES.RETAILSEGMENT],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch.selected',
                                            as: 'branch',
                                            cond: {
                                                $setIsSubset: [['$$branch.retailSegment'], '$$filters.retailSegment'],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: {
                                        _id: '$$branch._id',
                                        retailSegment: '$$branch.retailSegment',
                                        outlet: '$$branch.outlet',
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        pipeline.push({
            $addFields: {
                outlet: {
                    $setUnion: ['$branch.selected.outlet', []],
                },
            },
        });

        if (_.get(queryFilter, `${CONTENT_TYPES.OUTLET}.length`)) {
            pipeline.push({
                $addFields: {
                    'branch.selected': {
                        $let: {
                            vars: {
                                filters: {
                                    outlet: queryFilter[CONTENT_TYPES.OUTLET],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch.selected',
                                            as: 'branch',
                                            cond: {
                                                $setIsSubset: [['$$branch.outlet'], '$$filters.outlet'],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: {
                                        _id: '$$branch._id',
                                        retailSegment: '$$branch.retailSegment',
                                        outlet: '$$branch.outlet',
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'subRegion',
                foreignField: 'subRegion',
                as: 'branch.all',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.SUBREGION}.length`)) {
                $addFields.branch = {
                    $let: {
                        vars: {
                            filters: {
                                subRegion: queryFilter[CONTENT_TYPES.SUBREGION],
                            },
                        },
                        in: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: {
                                            $ifNull: ['$branch.selected', []],
                                        },
                                    }, 0],
                                },
                                then: '$branch.selected',
                                else: {
                                    $map: {
                                        input: {
                                            $filter: {
                                                input: '$branch.all',
                                                as: 'branch',
                                                cond: {
                                                    $and: [
                                                        { $eq: ['$$branch.archived', false] },
                                                        { $setIsSubset: [['$$branch.subRegion'], '$$filters.subRegion'] },
                                                    ],
                                                },
                                            },
                                        },
                                        as: 'branch',
                                        in: {
                                            _id: '$$branch._id',
                                            retailSegment: '$$branch.retailSegment',
                                            outlet: '$$branch.outlet',
                                        },
                                    },
                                },
                            },
                        },
                    },
                };
            } else {
                $addFields.branch = {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: {
                                    $ifNull: ['$branch.selected', []],
                                },
                            }, 0],
                        },
                        then: '$branch.selected',
                        else: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$branch.all',
                                        as: 'branch',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$branch.archived', false] },
                                                { $setIsSubset: [['$$branch.subRegion'], '$subRegion'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'branch',
                                in: {
                                    _id: '$$branch._id',
                                    retailSegment: '$$branch.retailSegment',
                                    outlet: '$$branch.outlet',
                                },
                            },
                        },
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        pipeline.push({
            $addFields: {
                retailSegment: {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: '$retailSegment',
                            }, 0],
                        },
                        then: '$retailSegment',
                        else: {
                            $setUnion: ['$branch.retailSegment', []],
                        },
                    },
                },
            },
        });

        if (_.get(queryFilter, `${CONTENT_TYPES.RETAILSEGMENT}.length`)) {
            pipeline.push({
                $addFields: {
                    branch: {
                        $let: {
                            vars: {
                                filters: {
                                    retailSegment: queryFilter[CONTENT_TYPES.RETAILSEGMENT],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch',
                                            as: 'branch',
                                            cond: {
                                                $setIsSubset: [['$$branch.retailSegment'], '$$filters.retailSegment'],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: {
                                        _id: '$$branch._id',
                                        retailSegment: '$$branch.retailSegment',
                                        outlet: '$$branch.outlet',
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        pipeline.push({
            $addFields: {
                outlet: {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: '$outlet',
                            }, 0],
                        },
                        then: '$outlet',
                        else: {
                            $setUnion: ['$branch.outlet', []],
                        },
                    },
                },
            },
        });

        if (_.get(queryFilter, `${CONTENT_TYPES.OUTLET}.length`)) {
            pipeline.push({
                $addFields: {
                    branch: {
                        $let: {
                            vars: {
                                filters: {
                                    outlet: queryFilter[CONTENT_TYPES.OUTLET],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch',
                                            as: 'branch',
                                            cond: {
                                                $setIsSubset: [['$$branch.outlet'], '$$filters.outlet'],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: {
                                        _id: '$$branch._id',
                                        retailSegment: '$$branch.retailSegment',
                                        outlet: '$$branch.outlet',
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        pipeline.push({
            $addFields: {
                branch: {
                    $map: {
                        input: '$branch',
                        as: 'branch',
                        in: '$$branch._id',
                    },
                },
            },
        });

        if (_.get(queryFilter, `${CONTENT_TYPES.BRANCH}.length`)) {
            pipeline.push(...[
                {
                    $group: {
                        _id: null,
                        items: { $push: '$$ROOT' },
                    },
                },
                {
                    $project: {
                        _id: false,
                        items: 1,
                        matchedItems: {
                            $let: {
                                vars: {
                                    filters: {
                                        branch: queryFilter[CONTENT_TYPES.BRANCH],
                                    },
                                },
                                in: {
                                    $filter: {
                                        input: '$items',
                                        as: 'item',
                                        cond: {
                                            $gt: [{
                                                $size: {
                                                    $filter: {
                                                        input: '$$item.branch',
                                                        as: 'branch',
                                                        cond: {
                                                            $setIsSubset: [['$$branch'], '$$filters.branch'],
                                                        },
                                                    },
                                                },
                                            }, 0],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                /*
                 * tip: key thing is that if at least one item match condition then it's true condition,
                 * else condition is incorrect and branches with one of provided trade channel or outlet aren't exists.
                 */
                {
                    $project: {
                        items: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: '$matchedItems',
                                    }, 0],
                                },
                                then: '$matchedItems',
                                else: '$items',
                            },
                        },
                    },
                },
                {
                    $unwind: {
                        path: '$items',
                    },
                },
                {
                    $replaceRoot: {
                        newRoot: '$items',
                    },
                },
            ]);
        }

        pipeline.push(...[
            {
                $project: {
                    _id: 1,
                    name: 1,
                    country: 1,
                    region: 1,
                    subRegion: 1,
                    branch: 1,
                    retailSegment: 1,
                    outlet: 1,
                    position: 1,
                },
            },
            {
                $group: {
                    _id: null,
                    personnel: {
                        $push: {
                            name: '$name',
                            position: '$position',
                        },
                    },
                    country: { $first: '$country' },
                    region: { $push: '$region' },
                    subRegion: { $push: '$subRegion' },
                    branch: { $push: '$branch' },
                    retailSegment: { $push: '$retailSegment' },
                    outlet: { $push: '$outlet' },
                    position: { $addToSet: '$position' },
                },
            },
            {
                $project: {
                    _id: false,
                    personnel: {
                        $let: {
                            vars: {
                                filters: {
                                    position: {
                                        $ifNull: [queryFilter[CONTENT_TYPES.POSITION], []],
                                    },
                                },
                            },
                            in: {
                                $cond: {
                                    if: {
                                        $gt: [{
                                            $size: '$$filters.position',
                                        }, 0],
                                    },
                                    then: {
                                        $let: {
                                            vars: {
                                                matches: {
                                                    $filter: {
                                                        input: '$personnel',
                                                        as: 'this',
                                                        cond: { $setIsSubset: [['$$this.position'], '$$filters.position'] },
                                                    },
                                                },
                                            },
                                            in: {
                                                $map: {
                                                    input: '$$matches',
                                                    as: 'this',
                                                    in: {
                                                        _id: '$$this._id',
                                                        name: '$$this.name',
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    else: {
                                        $map: {
                                            input: '$personnel',
                                            as: 'this',
                                            in: {
                                                _id: '$$this._id',
                                                name: '$$this.name',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    country: 1,
                    region: {
                        $reduce: {
                            input: '$region',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                    subRegion: {
                        $reduce: {
                            input: '$subRegion',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                    branch: {
                        $reduce: {
                            input: '$branch',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                    retailSegment: {
                        $reduce: {
                            input: '$retailSegment',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                    outlet: {
                        $reduce: {
                            input: '$outlet',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                    position: 1,
                },
            },
        ]);

        pipeline.push(...[
            {
                $lookup: {
                    from: 'domains',
                    localField: 'country',
                    foreignField: '_id',
                    as: 'country',
                },
            },
            {
                $addFields: {
                    country: {
                        $map: {
                            input: '$country',
                            as: 'country',
                            in: {
                                _id: '$$country._id',
                                name: '$$country.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'positions',
                    localField: 'position',
                    foreignField: '_id',
                    as: 'position',
                },
            },
            {
                $addFields: {
                    position: {
                        $map: {
                            input: '$position',
                            as: 'position',
                            in: {
                                _id: '$$position._id',
                                name: '$$position.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'region',
                    foreignField: '_id',
                    as: 'region',
                },
            },
            {
                $addFields: {
                    region: {
                        $map: {
                            input: '$region',
                            as: 'region',
                            in: {
                                _id: '$$region._id',
                                name: '$$region.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'subRegion',
                    foreignField: '_id',
                    as: 'subRegion',
                },
            },
            {
                $addFields: {
                    subRegion: {
                        $map: {
                            input: '$subRegion',
                            as: 'subRegion',
                            in: {
                                _id: '$$subRegion._id',
                                name: '$$subRegion.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'retailSegments',
                    localField: 'retailSegment',
                    foreignField: '_id',
                    as: 'retailSegment',
                },
            },
            {
                $addFields: {
                    retailSegment: {
                        $map: {
                            input: '$retailSegment',
                            as: 'retailSegment',
                            in: {
                                _id: '$$retailSegment._id',
                                name: '$$retailSegment.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'outlets',
                    localField: 'outlet',
                    foreignField: '_id',
                    as: 'outlet',
                },
            },
            {
                $addFields: {
                    outlet: {
                        $map: {
                            input: '$outlet',
                            as: 'outlet',
                            in: {
                                _id: '$$outlet._id',
                                name: '$$outlet.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'branches',
                    localField: 'branch',
                    foreignField: '_id',
                    as: 'branch',
                },
            },
            {
                $addFields: {
                    branch: {
                        $map: {
                            input: '$branch',
                            as: 'branch',
                            in: {
                                _id: '$$branch._id',
                                name: '$$branch.name',
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: false,
                    country: 1,
                    region: 1,
                    subRegion: 1,
                    branch: 1,
                    outlet: 1,
                    retailSegment: 1,
                    position: 1,
                    personnel: 1,
                },
            },
        ]);

        async.waterfall([

            (cb) => {
                PersonnelModel.aggregate(pipeline)
                    .allowDiskUse(true)
                    .exec(cb);
            },

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            const body = result[0];

            res.status(200).send(body);
        });
    };

    this.planogramFilters = function (req, res, next) {
        const query = req.query;
        const queryFilter = query.filter || {};

        const filterMapper = new FilterMapper();

        const currentSelected = query.current;
        const filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        const filter = filterMapper.mapFilter({
            filter: queryFilter,
            personnel: req.personnelModel,
        });

        let aggregateHelper;

        let aggregation;
        let pipeLine = [];
        // delete filter.configuration;
        delete filter.region;
        delete filter.subRegion;
        delete filter.outlet;

        if (filter.configuration) {
            filter['configuration._id'] = filter.configuration;
            delete filter.configuration;
        }

        aggregateHelper = new AggregationHelper($defProjection, filter);

        pipeLine.push({
            $match: filter,
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key: 'country',
            as: 'country',
            isArray: false,
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'categories',
            key: 'product',
            as: 'product',
            isArray: false,
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'retailSegments',
            key: 'retailSegment',
            isArray: true,
        }));

        pipeLine.push({
            $unwind: {
                path: '$retailSegment',
            },
        });

        pipeLine.push({
            $project: {
                country: 1,
                retailSegment: 1,
                product: 1,
                configuration: {
                    name: { en: '$configuration.name' },
                    _id: 1,
                },
                displayType: 1,
            },
        });

        pipeLine.push({
            $group: {
                _id: null,
                country: { $addToSet: '$country' },
                retailSegment: { $addToSet: '$retailSegment' },
                product: { $addToSet: '$product' },
                configuration: { $push: '$configuration' },
                displayType: { $addToSet: '$displayType' },
            },
        });

        pipeLine.push({
            $project: {
                country: 1,
                retailSegment: 1,
                product: 1,
                configuration: 1,
                displayType: {
                    $filter: {
                        input: '$displayType',
                        as: 'el',
                        cond: { $and: [{ $ne: ['$$el._id', null] }, { $ne: ['$$el._id', ''] }] },
                    },
                },
            },
        });

        aggregation = PlanogramModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true,
        };

        aggregation.exec((err, result) => {
            let otherDisplayType;

            if (err) {
                return next(err);
            }

            result = result[0] || {};

            otherDisplayType = _.findWhere(result.displayType, { _id: 'otherId' });

            result = {
                country: result.country || [],
                retailSegment: result.retailSegment || [],
                product: result.product || [],
                configuration: result.configuration || [],
                displayType: result.displayType || [],
            };

            if (otherDisplayType) {
                otherDisplayType.name = {
                    en: 'Other',
                    ar: '??????',
                };
            }

            redisFilters({
                currentSelected,
                filterExists,
                filtersObject: result,
                personnelId: req.personnelModel._id,
                contentType: CONTENT_TYPES.NOTIFICATIONS,
            }, (err, response) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.competitorsListFilters = require('./../stories/competitorItem/routes/filters');

    this.selectItemsLocationFilters = function (req, res, next) {
        let pipeLine = [];
        const $defProjection = {
            _id: 1,
            name: 1,
            subRegions: 1,
            retailSegments: 1,
            country: 1,
            region: 1,
            outlet: {
                _id: '$_id',
                name: '$name',
            },
        };
        const aggregateHelper = new AggregationHelper($defProjection);

        let aggregation;

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'retailSegments',
            key: 'retailSegments',
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key: 'subRegions',
            addMainProjection: 'parent',
        }));

        pipeLine.push({
            $unwind: {
                path: '$parent',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeLine.push({
            $lookup: {
                from: 'domains',
                localField: 'parent',
                foreignField: '_id',
                as: 'region',
            },
        });

        pipeLine.push({
            $unwind: {
                path: '$region',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeLine.push({
            $lookup: {
                from: 'domains',
                localField: 'region.parent',
                foreignField: '_id',
                as: 'country',
            },
        });

        pipeLine.push({
            $project: {
                _id: 1,
                name: 1,
                country: 1,
                region: 1,
                outlet: 1,
                subRegion: '$subRegions',
                retailSegment: '$retailSegments',
            },
        });

        aggregation = OutletModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true,
        };

        aggregation.exec((err, result) => {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });
    };

    this.personnelFilters = function (req, res, next) {
        const _ = require('lodash'); // override _
        const STATUSES = require('../public/js/constants/personnelStatuses');
        const locationFilter = require('./../stories/customReports/utils/locationFilter');

        const query = req.query;
        const user = req.personnelModel;
        const filterMapper = new FilterMapper();
        const filter = filterMapper.mapFilter({
            contentType: CONTENT_TYPES.PERSONNEL,
            filter: query.filter,
            personnel: req.personnelModel,
        });

        const queryFilter = {};

        [
            CONTENT_TYPES.COUNTRY,
            CONTENT_TYPES.REGION,
            CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT,
            CONTENT_TYPES.OUTLET,
            CONTENT_TYPES.BRANCH,
        ].forEach(filterName => {
            if (filter[filterName]) {
                queryFilter[filterName] = filter[filterName].$in;
            }
        });

        if (query.filter.archived) {
            queryFilter.archived = query.filter.archived.values[0];
        }

        const pipeline = [];

        const scopeFilter = {};

        locationFilter(pipeline, user, queryFilter, scopeFilter);

        pipeline.push({
            $project: {
                _id: 1,
                country: 1,
                archived: 1,
            },
        });

        if (queryFilter.hasOwnProperty('archived')) {
            pipeline.push({
                $match: {
                    archived: queryFilter.archived,
                },
            });
        }

        pipeline.push(...[
            {
                $project: {
                    _id: 1,
                    country: {
                        $ifNull: ['$country', []],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    country: { $push: '$country' },
                    items: { $push: '$$ROOT._id' },
                },
            },
            {
                $project: {
                    _id: '$items',
                    country: {
                        $reduce: {
                            input: '$country',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                },
            },
            {
                $unwind: {
                    path: '$_id',
                },
            },
            {
                $lookup: {
                    from: 'personnels',
                    localField: '_id',
                    foreignField: '_id',
                    as: '_id',
                },
            },
            {
                $project: {
                    _id: false,
                    employee: {
                        $let: {
                            vars: {
                                employee: { $arrayElemAt: ['$_id', 0] },
                            },
                            in: {
                                _id: '$$employee._id',
                                country: '$$employee.country',
                                region: '$$employee.region',
                                subRegion: '$$employee.subRegion',
                                branch: '$$employee.branch',
                                status: '$$employee.status',
                                position: '$$employee.position',
                            },
                        },
                    },
                    country: 1,
                },
            },
        ]);

        if (_.get(queryFilter, `${CONTENT_TYPES.COUNTRY}.length`)) {
            pipeline.push({
                $match: {
                    'employee.country': {
                        $in: queryFilter[CONTENT_TYPES.COUNTRY],
                    },
                },
            });
        }

        pipeline.push(...[
            {
                $project: {
                    _id: '$employee._id',
                    country: { $ifNull: ['$country', []] },
                    region: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$employee.region', []] } }, 0] },
                            then: { selected: '$employee.region' },
                            else: { all: 'region' },
                        },
                    },
                    subRegion: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$employee.subRegion', []] } }, 0] },
                            then: { selected: '$employee.subRegion' },
                            else: { all: 'subRegion' },
                        },
                    },
                    branch: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$employee.branch', []] } }, 0] },
                            then: { selected: '$employee.branch' },
                            else: { all: 'branch' },
                        },
                    },
                    status: '$employee.status',
                    position: '$employee.position',
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'country',
                    foreignField: '_id',
                    as: 'country',
                },
            },
            {
                $addFields: {
                    country: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$country',
                                    as: 'country',
                                    cond: {
                                        $eq: ['$$country.archived', false],
                                    },
                                },
                            },
                            as: 'country',
                            in: '$$country._id',
                        },
                    },
                },
            },
        ]);

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'region.selected',
                foreignField: '_id',
                as: 'region.selected',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.COUNTRY}.length`)) {
                $addFields['region.selected'] = {
                    $let: {
                        vars: {
                            filters: {
                                country: queryFilter[CONTENT_TYPES.COUNTRY],
                            },
                        },
                        in: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$region.selected',
                                        as: 'region',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$region.archived', false] },
                                                { $setIsSubset: [['$$region.parent'], '$$filters.country'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'region',
                                in: '$$region._id',
                            },
                        },
                    },
                };
            } else {
                $addFields['region.selected'] = {
                    $map: {
                        input: {
                            $filter: {
                                input: '$region.selected',
                                as: 'region',
                                cond: {
                                    $eq: ['$$region.archived', false],
                                },
                            },
                        },
                        as: 'region',
                        in: '$$region._id',
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'region.all',
                foreignField: 'type',
                as: 'region.all',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.COUNTRY}.length`)) {
                $addFields.region = {
                    $let: {
                        vars: {
                            filters: {
                                country: queryFilter[CONTENT_TYPES.COUNTRY],
                            },
                        },
                        in: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: {
                                            $ifNull: ['$region.selected', []],
                                        },
                                    }, 0],
                                },
                                then: '$region.selected',
                                else: {
                                    $map: {
                                        input: {
                                            $filter: {
                                                input: '$region.all',
                                                as: 'region',
                                                cond: {
                                                    $and: [
                                                        { $eq: ['$$region.archived', false] },
                                                        { $setIsSubset: [['$$region.parent'], '$$filters.country'] },
                                                    ],
                                                },
                                            },
                                        },
                                        as: 'region',
                                        in: '$$region._id',
                                    },
                                },
                            },
                        },
                    },
                };
            } else {
                $addFields.region = {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: {
                                    $ifNull: ['$region.selected', []],
                                },
                            }, 0],
                        },
                        then: '$region.selected',
                        else: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$region.all',
                                        as: 'region',
                                        cond: {
                                            $eq: ['$$region.archived', false],
                                        },
                                    },
                                },
                                as: 'region',
                                in: '$$region._id',
                            },
                        },
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        if (scopeFilter[CONTENT_TYPES.REGION]) {
            pipeline.push({
                $addFields: {
                    region: {
                        $filter: {
                            input: '$region',
                            as: 'region',
                            cond: {
                                $setIsSubset: [['$$region'], scopeFilter[CONTENT_TYPES.REGION]],
                            },
                        },
                    },
                },
            });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.REGION}.length`)) {
            pipeline.push(...[
                {
                    $addFields: {
                        acceptable: {
                            $let: {
                                vars: {
                                    filters: {
                                        region: queryFilter[CONTENT_TYPES.REGION],
                                    },
                                },
                                in: {
                                    $cond: {
                                        if: {
                                            $gt: [{
                                                $size: {
                                                    $filter: {
                                                        input: '$region',
                                                        as: 'region',
                                                        cond: {
                                                            $setIsSubset: [['$$region'], '$$filters.region'],
                                                        },
                                                    },
                                                },
                                            }, 0],
                                        },
                                        then: true,
                                        else: false,
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    $match: {
                        acceptable: true,
                    },
                },
            ]);
        }

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegion.selected',
                foreignField: '_id',
                as: 'subRegion.selected',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.REGION}.length`)) {
                $addFields['subRegion.selected'] = {
                    $let: {
                        vars: {
                            filters: {
                                region: queryFilter[CONTENT_TYPES.REGION],
                            },
                        },
                        in: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$subRegion.selected',
                                        as: 'subRegion',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$subRegion.archived', false] },
                                                { $setIsSubset: [['$$subRegion.parent'], '$$filters.region'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'subRegion',
                                in: '$$subRegion._id',
                            },
                        },
                    },
                };
            } else {
                $addFields['subRegion.selected'] = {
                    $map: {
                        input: {
                            $filter: {
                                input: '$subRegion.selected',
                                as: 'subRegion',
                                cond: {
                                    $and: [
                                        { $eq: ['$$subRegion.archived', false] },
                                        { $setIsSubset: [['$$subRegion.parent'], '$region'] },
                                    ],
                                },
                            },
                        },
                        as: 'subRegion',
                        in: '$$subRegion._id',
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegion.all',
                foreignField: 'type',
                as: 'subRegion.all',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.REGION}.length`)) {
                $addFields.subRegion = {
                    $let: {
                        vars: {
                            filters: {
                                region: queryFilter[CONTENT_TYPES.REGION],
                            },
                        },
                        in: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: {
                                            $ifNull: ['$subRegion.selected', []],
                                        },
                                    }, 0],
                                },
                                then: '$subRegion.selected',
                                else: {
                                    $map: {
                                        input: {
                                            $filter: {
                                                input: '$subRegion.all',
                                                as: 'subRegion',
                                                cond: {
                                                    $and: [
                                                        { $eq: ['$$subRegion.archived', false] },
                                                        { $setIsSubset: [['$$subRegion.parent'], '$$filters.region'] },
                                                    ],
                                                },
                                            },
                                        },
                                        as: 'subRegion',
                                        in: '$$subRegion._id',
                                    },
                                },
                            },
                        },
                    },
                };
            } else {
                $addFields.subRegion = {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: {
                                    $ifNull: ['$subRegion.selected', []],
                                },
                            }, 0],
                        },
                        then: '$subRegion.selected',
                        else: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$subRegion.all',
                                        as: 'subRegion',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$subRegion.archived', false] },
                                                { $setIsSubset: [['$$subRegion.parent'], '$region'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'subRegion',
                                in: '$$subRegion._id',
                            },
                        },
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        if (scopeFilter[CONTENT_TYPES.SUBREGION]) {
            pipeline.push({
                $addFields: {
                    subRegion: {
                        $filter: {
                            input: '$subRegion',
                            as: 'subRegion',
                            cond: {
                                $setIsSubset: [['$$subRegion'], scopeFilter[CONTENT_TYPES.SUBREGION]],
                            },
                        },
                    },
                },
            });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.SUBREGION}.length`)) {
            pipeline.push(...[{
                $addFields: {
                    acceptable: {
                        $let: {
                            vars: {
                                filters: {
                                    subRegion: queryFilter[CONTENT_TYPES.SUBREGION],
                                },
                            },
                            in: {
                                $cond: {
                                    if: {
                                        $gt: [{
                                            $size: {
                                                $filter: {
                                                    input: '$subRegion',
                                                    as: 'subRegion',
                                                    cond: {
                                                        $setIsSubset: [['$$subRegion'], '$$filters.subRegion'],
                                                    },
                                                },
                                            },
                                        }, 0],
                                    },
                                    then: true,
                                    else: false,
                                },
                            },
                        },
                    },
                },
            },
                {
                    $match: {
                        acceptable: true,
                    },
                },
            ]);
        }

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'branch.selected',
                foreignField: '_id',
                as: 'branch.selected',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.SUBREGION}.length`)) {
                $addFields['branch.selected'] = {
                    $let: {
                        vars: {
                            filters: {
                                subRegion: queryFilter[CONTENT_TYPES.SUBREGION],
                            },
                        },
                        in: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$branch.selected',
                                        as: 'branch',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$branch.archived', false] },
                                                { $setIsSubset: [['$$branch.subRegion'], '$$filters.subRegion'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'branch',
                                in: {
                                    _id: '$$branch._id',
                                    retailSegment: '$$branch.retailSegment',
                                    outlet: '$$branch.outlet',
                                },
                            },
                        },
                    },
                };
            } else {
                $addFields['branch.selected'] = {
                    $map: {
                        input: {
                            $filter: {
                                input: '$branch.selected',
                                as: 'branch',
                                cond: {
                                    $and: [
                                        { $eq: ['$$branch.archived', false] },
                                        { $setIsSubset: [['$$branch.subRegion'], '$subRegion'] },
                                    ],
                                },
                            },
                        },
                        as: 'branch',
                        in: {
                            _id: '$$branch._id',
                            retailSegment: '$$branch.retailSegment',
                            outlet: '$$branch.outlet',
                        },
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        pipeline.push({
            $addFields: {
                retailSegment: {
                    $setUnion: ['$branch.selected.retailSegment', []],
                },
            },
        });

        if (_.get(queryFilter, `${CONTENT_TYPES.RETAILSEGMENT}.length`)) {
            pipeline.push({
                $addFields: {
                    'branch.selected': {
                        $let: {
                            vars: {
                                filters: {
                                    retailSegment: queryFilter[CONTENT_TYPES.RETAILSEGMENT],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch.selected',
                                            as: 'branch',
                                            cond: {
                                                $setIsSubset: [['$$branch.retailSegment'], '$$filters.retailSegment'],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: {
                                        _id: '$$branch._id',
                                        retailSegment: '$$branch.retailSegment',
                                        outlet: '$$branch.outlet',
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        pipeline.push({
            $addFields: {
                outlet: {
                    $setUnion: ['$branch.selected.outlet', []],
                },
            },
        });

        if (_.get(queryFilter, `${CONTENT_TYPES.OUTLET}.length`)) {
            pipeline.push({
                $addFields: {
                    'branch.selected': {
                        $let: {
                            vars: {
                                filters: {
                                    outlet: queryFilter[CONTENT_TYPES.OUTLET],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch.selected',
                                            as: 'branch',
                                            cond: {
                                                $setIsSubset: [['$$branch.outlet'], '$$filters.outlet'],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: {
                                        _id: '$$branch._id',
                                        retailSegment: '$$branch.retailSegment',
                                        outlet: '$$branch.outlet',
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'subRegion',
                foreignField: 'subRegion',
                as: 'branch.all',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.SUBREGION}.length`)) {
                $addFields.branch = {
                    $let: {
                        vars: {
                            filters: {
                                subRegion: queryFilter[CONTENT_TYPES.SUBREGION],
                            },
                        },
                        in: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: {
                                            $ifNull: ['$branch.selected', []],
                                        },
                                    }, 0],
                                },
                                then: '$branch.selected',
                                else: {
                                    $map: {
                                        input: {
                                            $filter: {
                                                input: '$branch.all',
                                                as: 'branch',
                                                cond: {
                                                    $and: [
                                                        { $eq: ['$$branch.archived', false] },
                                                        { $setIsSubset: [['$$branch.subRegion'], '$$filters.subRegion'] },
                                                    ],
                                                },
                                            },
                                        },
                                        as: 'branch',
                                        in: {
                                            _id: '$$branch._id',
                                            retailSegment: '$$branch.retailSegment',
                                            outlet: '$$branch.outlet',
                                        },
                                    },
                                },
                            },
                        },
                    },
                };
            } else {
                $addFields.branch = {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: {
                                    $ifNull: ['$branch.selected', []],
                                },
                            }, 0],
                        },
                        then: '$branch.selected',
                        else: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$branch.all',
                                        as: 'branch',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$branch.archived', false] },
                                                { $setIsSubset: [['$$branch.subRegion'], '$subRegion'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'branch',
                                in: {
                                    _id: '$$branch._id',
                                    retailSegment: '$$branch.retailSegment',
                                    outlet: '$$branch.outlet',
                                },
                            },
                        },
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        pipeline.push({
            $addFields: {
                retailSegment: {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: '$retailSegment',
                            }, 0],
                        },
                        then: '$retailSegment',
                        else: {
                            $setUnion: ['$branch.retailSegment', []],
                        },
                    },
                },
            },
        });

        if (_.get(queryFilter, `${CONTENT_TYPES.RETAILSEGMENT}.length`)) {
            pipeline.push({
                $addFields: {
                    branch: {
                        $let: {
                            vars: {
                                filters: {
                                    retailSegment: queryFilter[CONTENT_TYPES.RETAILSEGMENT],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch',
                                            as: 'branch',
                                            cond: {
                                                $setIsSubset: [['$$branch.retailSegment'], '$$filters.retailSegment'],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: {
                                        _id: '$$branch._id',
                                        retailSegment: '$$branch.retailSegment',
                                        outlet: '$$branch.outlet',
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        pipeline.push({
            $addFields: {
                outlet: {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: '$outlet',
                            }, 0],
                        },
                        then: '$outlet',
                        else: {
                            $setUnion: ['$branch.outlet', []],
                        },
                    },
                },
            },
        });

        if (_.get(queryFilter, `${CONTENT_TYPES.OUTLET}.length`)) {
            pipeline.push({
                $addFields: {
                    branch: {
                        $let: {
                            vars: {
                                filters: {
                                    outlet: queryFilter[CONTENT_TYPES.OUTLET],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch',
                                            as: 'branch',
                                            cond: {
                                                $setIsSubset: [['$$branch.outlet'], '$$filters.outlet'],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: {
                                        _id: '$$branch._id',
                                        retailSegment: '$$branch.retailSegment',
                                        outlet: '$$branch.outlet',
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        pipeline.push({
            $addFields: {
                branch: {
                    $map: {
                        input: '$branch',
                        as: 'branch',
                        in: '$$branch._id',
                    },
                },
            },
        });

        if (_.get(queryFilter, `${CONTENT_TYPES.BRANCH}.length`)) {
            pipeline.push(...[
                {
                    $group: {
                        _id: null,
                        items: { $push: '$$ROOT' },
                    },
                },
                {
                    $project: {
                        _id: false,
                        items: 1,
                        matchedItems: {
                            $let: {
                                vars: {
                                    filters: {
                                        branch: queryFilter[CONTENT_TYPES.BRANCH],
                                    },
                                },
                                in: {
                                    $filter: {
                                        input: '$items',
                                        as: 'item',
                                        cond: {
                                            $gt: [{
                                                $size: {
                                                    $filter: {
                                                        input: '$$item.branch',
                                                        as: 'branch',
                                                        cond: {
                                                            $setIsSubset: [['$$branch'], '$$filters.branch'],
                                                        },
                                                    },
                                                },
                                            }, 0],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                /*
                 * tip: key thing is that if at least one item match condition then it's true condition,
                 * else condition is incorrect and branches with one of provided trade channel or outlet aren't exists.
                 */
                {
                    $project: {
                        items: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: '$matchedItems',
                                    }, 0],
                                },
                                then: '$matchedItems',
                                else: '$items',
                            },
                        },
                    },
                },
                {
                    $unwind: {
                        path: '$items',
                    },
                },
                {
                    $replaceRoot: {
                        newRoot: '$items',
                    },
                },
            ]);
        }

        pipeline.push(...[
            {
                $project: {
                    _id: 1,
                    country: 1,
                    region: 1,
                    subRegion: 1,
                    branch: 1,
                    retailSegment: 1,
                    outlet: 1,
                    status: 1,
                    position: 1,
                },
            },
            {
                $group: {
                    _id: null,
                    country: { $first: '$country' },
                    region: { $push: '$region' },
                    subRegion: { $push: '$subRegion' },
                    branch: { $push: '$branch' },
                    retailSegment: { $push: '$retailSegment' },
                    outlet: { $push: '$outlet' },
                    status: { $addToSet: '$status' },
                    position: { $addToSet: '$position' },
                },
            },
            {
                $project: {
                    _id: false,
                    country: 1,
                    region: {
                        $reduce: {
                            input: '$region',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                    subRegion: {
                        $reduce: {
                            input: '$subRegion',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                    branch: {
                        $reduce: {
                            input: '$branch',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                    retailSegment: {
                        $reduce: {
                            input: '$retailSegment',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                    outlet: {
                        $reduce: {
                            input: '$outlet',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                    status: 1,
                    position: 1,
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'country',
                    foreignField: '_id',
                    as: 'country',
                },
            },
            {
                $addFields: {
                    country: {
                        $map: {
                            input: '$country',
                            as: 'country',
                            in: {
                                _id: '$$country._id',
                                name: '$$country.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'positions',
                    localField: 'position',
                    foreignField: '_id',
                    as: 'position',
                },
            },
            {
                $addFields: {
                    position: {
                        $map: {
                            input: '$position',
                            as: 'position',
                            in: {
                                _id: '$$position._id',
                                name: '$$position.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'region',
                    foreignField: '_id',
                    as: 'region',
                },
            },
            {
                $addFields: {
                    region: {
                        $map: {
                            input: '$region',
                            as: 'region',
                            in: {
                                _id: '$$region._id',
                                name: '$$region.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'subRegion',
                    foreignField: '_id',
                    as: 'subRegion',
                },
            },
            {
                $addFields: {
                    subRegion: {
                        $map: {
                            input: '$subRegion',
                            as: 'subRegion',
                            in: {
                                _id: '$$subRegion._id',
                                name: '$$subRegion.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'retailSegments',
                    localField: 'retailSegment',
                    foreignField: '_id',
                    as: 'retailSegment',
                },
            },
            {
                $addFields: {
                    retailSegment: {
                        $map: {
                            input: '$retailSegment',
                            as: 'retailSegment',
                            in: {
                                _id: '$$retailSegment._id',
                                name: '$$retailSegment.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'outlets',
                    localField: 'outlet',
                    foreignField: '_id',
                    as: 'outlet',
                },
            },
            {
                $addFields: {
                    outlet: {
                        $map: {
                            input: '$outlet',
                            as: 'outlet',
                            in: {
                                _id: '$$outlet._id',
                                name: '$$outlet.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'branches',
                    localField: 'branch',
                    foreignField: '_id',
                    as: 'branch',
                },
            },
            {
                $addFields: {
                    branch: {
                        $map: {
                            input: '$branch',
                            as: 'branch',
                            in: {
                                _id: '$$branch._id',
                                name: '$$branch.name',
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: false,
                    country: 1,
                    region: 1,
                    subRegion: 1,
                    branch: 1,
                    outlet: 1,
                    retailSegment: 1,
                    position: 1,
                    status: 1,
                    translated: [],
                },
            },
        ]);

        async.waterfall([

            (cb) => {
                PersonnelModel.aggregate(pipeline)
                    .allowDiskUse(true)
                    .exec(cb);
            },

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            const body = result[0];

            body.status = mapFiltersValues(body.status, STATUSES);

            res.status(200).send(body);
        });
    };

    this.notificationCreateFilters = function (req, res, next) {
        const query = req.query;
        const filterMapper = new FilterMapper();
        const filter = filterMapper.mapFilter({
            filter: query.filter,
            personnel: req.personnelModel,
        });
        const mainFilter = _.pick(filter, 'country', 'region', 'subRegion', 'branch', 'position');
        const retailSegmentOutletFilter = _.pick(filter, 'retailSegment', 'outlet');
        let aggregation;
        let pipeLine = [];

        const $defProjection = {
            _id: 1,
            country: 1,
            region: 1,
            subRegion: 1,
            retailSegment: 1,
            outlet: 1,
            branch: 1,
            position: 1,
            personnel: 1,
        };

        const aggregateHelper = new AggregationHelper($defProjection);

        if (!_.isEmpty(mainFilter)) {
            pipeLine.push({
                $match: mainFilter,
            });
        }

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                personnel: {
                    _id: '$_id',
                    name: {
                        en: {
                            $concat: ['$firstName.en', ' ', '$lastName.en'],
                        },
                        ar: {
                            $concat: ['$firstName.ar', ' ', '$lastName.ar'],
                        },
                    },
                },
            }),
        });

        pipeLine.push({
            $unwind: {
                path: '$branch',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'branches',
            key: 'branch',
            isArray: false,
            addProjection: ['id', 'name', 'retailSegment', 'outlet', 'subRegion'],
        }));

        if (filter.subRegion) {
            pipeLine.push({
                $match: {
                    $or: [
                        { 'branch.subRegion': { $exists: false } },
                        { 'branch.subRegion': filter.subRegion },
                    ],
                },
            });
        }

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                outlet: '$branch.outlet',
                retailSegment: '$branch.retailSegment',
                branch: {
                    _id: 1,
                    name: 1,
                },
            }),
        });

        if (!_.isEmpty(retailSegmentOutletFilter)) {
            pipeLine.push({
                $match: retailSegmentOutletFilter,
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'retailSegments',
            key: 'retailSegment',
            isArray: false,
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'outlets',
            key: 'outlet',
            isArray: false,
        }));

        pipeLine.push({
            $group: aggregateHelper.getGroupObject({
                branch: { $addToSet: '$branch' },
                outlet: { $addToSet: '$outlet' },
                retailSegment: { $addToSet: '$retailSegment' },
            }),
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key: 'country',
        }));

        pipeLine.push({
            $unwind: {
                path: '$region',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key: 'region',
            isArray: false,
            addProjection: ['parent'],
        }));

        if (filter.country) {
            pipeLine.push({
                $match: {
                    $or: [
                        { 'region.parent': { $exists: false } },
                        { 'region.parent': filter.country },
                    ],
                },
            });
        }

        pipeLine.push({
            $group: aggregateHelper.getGroupObject({
                region: {
                    $addToSet: {
                        _id: '$region._id',
                        name: '$region.name',
                    },
                },
            }),
        });

        pipeLine.push({
            $unwind: {
                path: '$subRegion',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key: 'subRegion',
            isArray: false,
            addProjection: ['parent'],
        }));

        if (filter.region) {
            pipeLine.push({
                $match: {
                    $or: [
                        { 'subRegion.parent': { $exists: false } },
                        { 'subRegion.parent': filter.region },
                    ],
                },
            });
        }

        pipeLine.push({
            $group: aggregateHelper.getGroupObject({
                subRegion: {
                    $addToSet: {
                        _id: '$subRegion._id',
                        name: '$subRegion.name',
                    },
                },
            }),
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'positions',
            key: 'position',
            isArray: false,
        }));

        pipeLine.push({
            $group: {
                _id: null,
                country: { $addToSet: '$country' },
                region: { $addToSet: '$region' },
                subRegion: { $addToSet: '$subRegion' },
                retailSegment: { $addToSet: '$retailSegment' },
                outlet: { $addToSet: '$outlet' },
                branch: { $addToSet: '$branch' },
                position: { $addToSet: '$position' },
                personnel: { $addToSet: '$personnel' },
            },
        });

        aggregation = PersonnelModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true,
        };

        aggregation.exec((err, result) => {
            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {
                country: result.country && _.uniq(_.flatten(result.country)) || [],
                region: result.region && _.uniq(_.flatten(result.region)) || [],
                subRegion: result.subRegion && _.uniq(_.flatten(result.subRegion)) || [],
                retailSegment: result.retailSegment && _.uniq(_.flatten(result.retailSegment)) || [],
                outlet: result.outlet && _.uniq(_.flatten(result.outlet)) || [],
                branch: result.branch && _.uniq(_.flatten(result.branch)) || [],
                position: result.position && _.uniq(_.flatten(result.position)) || [],
                personnel: result.personnel && _.uniq(_.flatten(result.personnel)) || [],
            };

            Object.keys(result).forEach((key) => {
                if (result[key]) {
                    let i = result[key].length - 1;
                    for (i; i >= 0; i--) {
                        if (!result[key][i] || !result[key][i].name) {
                            result[key].splice(i, 1);
                        }
                    }
                }
            });

            res.status(200).send(result);
        });
    };

    this.notificationFilters = function (req, res, next) {
        const _ = require('lodash'); // override _
        const moment = require('moment');
        const locationFilter = require('./../stories/customReports/utils/locationFilter');

        const query = req.query;
        const timeFilter = query.time;
        const user = req.personnelModel;
        const filterMapper = new FilterMapper();
        const filter = filterMapper.mapFilter({
            contentType: CONTENT_TYPES.NOTIFICATIONS,
            filter: query.filter,
            personnel: req.personnelModel,
        });

        const queryFilter = {};

        [
            CONTENT_TYPES.COUNTRY,
            CONTENT_TYPES.REGION,
            CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT,
            CONTENT_TYPES.OUTLET,
            CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.POSITION,
            CONTENT_TYPES.PERSONNEL,
        ].forEach(filterName => {
            if (filter[filterName]) {
                queryFilter[filterName] = filter[filterName].$in;
            }
        });

        const pipeline = [];

        const scopeFilter = {};

        locationFilter(pipeline, user, queryFilter, scopeFilter);

        pipeline.push({
            $project: {
                _id: 1,
                country: 1,
                archived: 1,
            },
        });

        if (timeFilter) {
            pipeline.push({
                $match: {
                    $and: [
                        { 'createdBy.date': { $gt: moment(timeFilter.values[0])._d } },
                        { 'createdBy.date': { $lt: moment(timeFilter.values[1])._d } },
                    ],
                },
            });
        }

        pipeline.push(...[
            {
                $project: {
                    _id: 1,
                    country: {
                        $ifNull: ['$country', []],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    country: { $push: '$country' },
                    items: { $push: '$$ROOT._id' },
                },
            },
            {
                $project: {
                    _id: '$items',
                    country: {
                        $reduce: {
                            input: '$country',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                },
            },
        ]);

        if (_.get(queryFilter, `${CONTENT_TYPES.COUNTRY}.length`)) {
            // $filter country as notification has several countries and $match stage use $in operator
            pipeline.push({
                $addFields: {
                    country: {
                        $let: {
                            vars: {
                                filters: {
                                    country: queryFilter[CONTENT_TYPES.COUNTRY],
                                },
                            },
                            in: {
                                $filter: {
                                    input: '$country',
                                    as: 'country',
                                    cond: {
                                        $setIsSubset: [['$$country'], '$$filters.country'],
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        pipeline.push(...[
            {
                $unwind: {
                    path: '$_id',
                },
            },
            {
                $lookup: {
                    from: 'notifications',
                    localField: '_id',
                    foreignField: '_id',
                    as: '_id',
                },
            },
            {
                $project: {
                    _id: false,
                    notification: {
                        $let: {
                            vars: {
                                notification: { $arrayElemAt: ['$_id', 0] },
                            },
                            in: {
                                _id: '$$notification._id',
                                country: '$$notification.country',
                                region: '$$notification.region',
                                subRegion: '$$notification.subRegion',
                                branch: '$$notification.branch',
                                recipients: '$$notification.recipients',
                            },
                        },
                    },
                    country: 1,
                },
            },
        ]);

        if (_.get(queryFilter, `${CONTENT_TYPES.COUNTRY}.length`)) {
            pipeline.push({
                $match: {
                    'notification.country': {
                        $in: queryFilter[CONTENT_TYPES.COUNTRY],
                    },
                },
            });
        }

        pipeline.push(...[
            {
                $project: {
                    _id: '$notification._id',
                    country: { $ifNull: ['$country', []] },
                    region: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$notification.region', []] } }, 0] },
                            then: { selected: '$notification.region' },
                            else: { all: 'region' },
                        },
                    },
                    subRegion: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$notification.subRegion', []] } }, 0] },
                            then: { selected: '$notification.subRegion' },
                            else: { all: 'subRegion' },
                        },
                    },
                    branch: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ['$notification.branch', []] } }, 0] },
                            then: { selected: '$notification.branch' },
                            else: { all: 'branch' },
                        },
                    },
                    recipients: '$notification.recipients',
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'country',
                    foreignField: '_id',
                    as: 'country',
                },
            },
            {
                $addFields: {
                    country: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$country',
                                    as: 'country',
                                    cond: {
                                        $eq: ['$$country.archived', false],
                                    },
                                },
                            },
                            as: 'country',
                            in: '$$country._id',
                        },
                    },
                },
            },
        ]);

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'region.selected',
                foreignField: '_id',
                as: 'region.selected',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.COUNTRY}.length`)) {
                $addFields['region.selected'] = {
                    $let: {
                        vars: {
                            filters: {
                                country: queryFilter[CONTENT_TYPES.COUNTRY],
                            },
                        },
                        in: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$region.selected',
                                        as: 'region',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$region.archived', false] },
                                                { $setIsSubset: [['$$region.parent'], '$$filters.country'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'region',
                                in: '$$region._id',
                            },
                        },
                    },
                };
            } else {
                $addFields['region.selected'] = {
                    $map: {
                        input: {
                            $filter: {
                                input: '$region.selected',
                                as: 'region',
                                cond: {
                                    $eq: ['$$region.archived', false],
                                },
                            },
                        },
                        as: 'region',
                        in: '$$region._id',
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'region.all',
                foreignField: 'type',
                as: 'region.all',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.COUNTRY}.length`)) {
                $addFields.region = {
                    $let: {
                        vars: {
                            filters: {
                                country: queryFilter[CONTENT_TYPES.COUNTRY],
                            },
                        },
                        in: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: {
                                            $ifNull: ['$region.selected', []],
                                        },
                                    }, 0],
                                },
                                then: '$region.selected',
                                else: {
                                    $map: {
                                        input: {
                                            $filter: {
                                                input: '$region.all',
                                                as: 'region',
                                                cond: {
                                                    $and: [
                                                        { $eq: ['$$region.archived', false] },
                                                        { $setIsSubset: [['$$region.parent'], '$$filters.country'] },
                                                    ],
                                                },
                                            },
                                        },
                                        as: 'region',
                                        in: '$$region._id',
                                    },
                                },
                            },
                        },
                    },
                };
            } else {
                $addFields.region = {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: {
                                    $ifNull: ['$region.selected', []],
                                },
                            }, 0],
                        },
                        then: '$region.selected',
                        else: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$region.all',
                                        as: 'region',
                                        cond: {
                                            $eq: ['$$region.archived', false],
                                        },
                                    },
                                },
                                as: 'region',
                                in: '$$region._id',
                            },
                        },
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        if (scopeFilter[CONTENT_TYPES.REGION]) {
            pipeline.push({
                $addFields: {
                    region: {
                        $filter: {
                            input: '$region',
                            as: 'region',
                            cond: {
                                $setIsSubset: [['$$region'], scopeFilter[CONTENT_TYPES.REGION]],
                            },
                        },
                    },
                },
            });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.REGION}.length`)) {
            pipeline.push(...[
                {
                    $addFields: {
                        acceptable: {
                            $let: {
                                vars: {
                                    filters: {
                                        region: queryFilter[CONTENT_TYPES.REGION],
                                    },
                                },
                                in: {
                                    $cond: {
                                        if: {
                                            $gt: [{
                                                $size: {
                                                    $filter: {
                                                        input: '$region',
                                                        as: 'region',
                                                        cond: {
                                                            $setIsSubset: [['$$region'], '$$filters.region'],
                                                        },
                                                    },
                                                },
                                            }, 0],
                                        },
                                        then: true,
                                        else: false,
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    $match: {
                        acceptable: true,
                    },
                },
            ]);
        }

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegion.selected',
                foreignField: '_id',
                as: 'subRegion.selected',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.REGION}.length`)) {
                $addFields['subRegion.selected'] = {
                    $let: {
                        vars: {
                            filters: {
                                region: queryFilter[CONTENT_TYPES.REGION],
                            },
                        },
                        in: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$subRegion.selected',
                                        as: 'subRegion',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$subRegion.archived', false] },
                                                { $setIsSubset: [['$$subRegion.parent'], '$$filters.region'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'subRegion',
                                in: '$$subRegion._id',
                            },
                        },
                    },
                };
            } else {
                $addFields['subRegion.selected'] = {
                    $map: {
                        input: {
                            $filter: {
                                input: '$subRegion.selected',
                                as: 'subRegion',
                                cond: {
                                    $and: [
                                        { $eq: ['$$subRegion.archived', false] },
                                        { $setIsSubset: [['$$subRegion.parent'], '$region'] },
                                    ],
                                },
                            },
                        },
                        as: 'subRegion',
                        in: '$$subRegion._id',
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        pipeline.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegion.all',
                foreignField: 'type',
                as: 'subRegion.all',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.REGION}.length`)) {
                $addFields.subRegion = {
                    $let: {
                        vars: {
                            filters: {
                                region: queryFilter[CONTENT_TYPES.REGION],
                            },
                        },
                        in: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: {
                                            $ifNull: ['$subRegion.selected', []],
                                        },
                                    }, 0],
                                },
                                then: '$subRegion.selected',
                                else: {
                                    $map: {
                                        input: {
                                            $filter: {
                                                input: '$subRegion.all',
                                                as: 'subRegion',
                                                cond: {
                                                    $and: [
                                                        { $eq: ['$$subRegion.archived', false] },
                                                        { $setIsSubset: [['$$subRegion.parent'], '$$filters.region'] },
                                                    ],
                                                },
                                            },
                                        },
                                        as: 'subRegion',
                                        in: '$$subRegion._id',
                                    },
                                },
                            },
                        },
                    },
                };
            } else {
                $addFields.subRegion = {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: {
                                    $ifNull: ['$subRegion.selected', []],
                                },
                            }, 0],
                        },
                        then: '$subRegion.selected',
                        else: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$subRegion.all',
                                        as: 'subRegion',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$subRegion.archived', false] },
                                                { $setIsSubset: [['$$subRegion.parent'], '$region'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'subRegion',
                                in: '$$subRegion._id',
                            },
                        },
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        if (scopeFilter[CONTENT_TYPES.SUBREGION]) {
            pipeline.push({
                $addFields: {
                    subRegion: {
                        $filter: {
                            input: '$subRegion',
                            as: 'subRegion',
                            cond: {
                                $setIsSubset: [['$$subRegion'], scopeFilter[CONTENT_TYPES.SUBREGION]],
                            },
                        },
                    },
                },
            });
        }

        if (_.get(queryFilter, `${CONTENT_TYPES.SUBREGION}.length`)) {
            pipeline.push(...[{
                $addFields: {
                    acceptable: {
                        $let: {
                            vars: {
                                filters: {
                                    subRegion: queryFilter[CONTENT_TYPES.SUBREGION],
                                },
                            },
                            in: {
                                $cond: {
                                    if: {
                                        $gt: [{
                                            $size: {
                                                $filter: {
                                                    input: '$subRegion',
                                                    as: 'subRegion',
                                                    cond: {
                                                        $setIsSubset: [['$$subRegion'], '$$filters.subRegion'],
                                                    },
                                                },
                                            },
                                        }, 0],
                                    },
                                    then: true,
                                    else: false,
                                },
                            },
                        },
                    },
                },
            },
                {
                    $match: {
                        acceptable: true,
                    },
                },
            ]);
        }

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'branch.selected',
                foreignField: '_id',
                as: 'branch.selected',
            },
        });
        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.SUBREGION}.length`)) {
                $addFields['branch.selected'] = {
                    $let: {
                        vars: {
                            filters: {
                                subRegion: queryFilter[CONTENT_TYPES.SUBREGION],
                            },
                        },
                        in: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$branch.selected',
                                        as: 'branch',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$branch.archived', false] },
                                                { $setIsSubset: [['$$branch.subRegion'], '$$filters.subRegion'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'branch',
                                in: {
                                    _id: '$$branch._id',
                                    retailSegment: '$$branch.retailSegment',
                                    outlet: '$$branch.outlet',
                                },
                            },
                        },
                    },
                };
            } else {
                $addFields['branch.selected'] = {
                    $map: {
                        input: {
                            $filter: {
                                input: '$branch.selected',
                                as: 'branch',
                                cond: {
                                    $and: [
                                        { $eq: ['$$branch.archived', false] },
                                        { $setIsSubset: [['$$branch.subRegion'], '$subRegion'] },
                                    ],
                                },
                            },
                        },
                        as: 'branch',
                        in: {
                            _id: '$$branch._id',
                            retailSegment: '$$branch.retailSegment',
                            outlet: '$$branch.outlet',
                        },
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        pipeline.push({
            $addFields: {
                retailSegment: {
                    $setUnion: ['$branch.selected.retailSegment', []],
                },
            },
        });

        if (_.get(queryFilter, `${CONTENT_TYPES.RETAILSEGMENT}.length`)) {
            pipeline.push({
                $addFields: {
                    'branch.selected': {
                        $let: {
                            vars: {
                                filters: {
                                    retailSegment: queryFilter[CONTENT_TYPES.RETAILSEGMENT],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch.selected',
                                            as: 'branch',
                                            cond: {
                                                $setIsSubset: [['$$branch.retailSegment'], '$$filters.retailSegment'],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: {
                                        _id: '$$branch._id',
                                        retailSegment: '$$branch.retailSegment',
                                        outlet: '$$branch.outlet',
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        pipeline.push({
            $addFields: {
                outlet: {
                    $setUnion: ['$branch.selected.outlet', []],
                },
            },
        });

        if (_.get(queryFilter, `${CONTENT_TYPES.OUTLET}.length`)) {
            pipeline.push({
                $addFields: {
                    'branch.selected': {
                        $let: {
                            vars: {
                                filters: {
                                    outlet: queryFilter[CONTENT_TYPES.OUTLET],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch.selected',
                                            as: 'branch',
                                            cond: {
                                                $setIsSubset: [['$$branch.outlet'], '$$filters.outlet'],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: {
                                        _id: '$$branch._id',
                                        retailSegment: '$$branch.retailSegment',
                                        outlet: '$$branch.outlet',
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        pipeline.push({
            $lookup: {
                from: 'branches',
                localField: 'subRegion',
                foreignField: 'subRegion',
                as: 'branch.all',
            },
        });

        {
            const $addFields = {};

            if (_.get(queryFilter, `${CONTENT_TYPES.SUBREGION}.length`)) {
                $addFields.branch = {
                    $let: {
                        vars: {
                            filters: {
                                subRegion: queryFilter[CONTENT_TYPES.SUBREGION],
                            },
                        },
                        in: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: {
                                            $ifNull: ['$branch.selected', []],
                                        },
                                    }, 0],
                                },
                                then: '$branch.selected',
                                else: {
                                    $map: {
                                        input: {
                                            $filter: {
                                                input: '$branch.all',
                                                as: 'branch',
                                                cond: {
                                                    $and: [
                                                        { $eq: ['$$branch.archived', false] },
                                                        { $setIsSubset: [['$$branch.subRegion'], '$$filters.subRegion'] },
                                                    ],
                                                },
                                            },
                                        },
                                        as: 'branch',
                                        in: {
                                            _id: '$$branch._id',
                                            retailSegment: '$$branch.retailSegment',
                                            outlet: '$$branch.outlet',
                                        },
                                    },
                                },
                            },
                        },
                    },
                };
            } else {
                $addFields.branch = {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: {
                                    $ifNull: ['$branch.selected', []],
                                },
                            }, 0],
                        },
                        then: '$branch.selected',
                        else: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$branch.all',
                                        as: 'branch',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$branch.archived', false] },
                                                { $setIsSubset: [['$$branch.subRegion'], '$subRegion'] },
                                            ],
                                        },
                                    },
                                },
                                as: 'branch',
                                in: {
                                    _id: '$$branch._id',
                                    retailSegment: '$$branch.retailSegment',
                                    outlet: '$$branch.outlet',
                                },
                            },
                        },
                    },
                };
            }

            pipeline.push({ $addFields });
        }

        pipeline.push({
            $addFields: {
                retailSegment: {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: '$retailSegment',
                            }, 0],
                        },
                        then: '$retailSegment',
                        else: {
                            $setUnion: ['$branch.retailSegment', []],
                        },
                    },
                },
            },
        });

        if (_.get(queryFilter, `${CONTENT_TYPES.RETAILSEGMENT}.length`)) {
            pipeline.push({
                $addFields: {
                    branch: {
                        $let: {
                            vars: {
                                filters: {
                                    retailSegment: queryFilter[CONTENT_TYPES.RETAILSEGMENT],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch',
                                            as: 'branch',
                                            cond: {
                                                $setIsSubset: [['$$branch.retailSegment'], '$$filters.retailSegment'],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: {
                                        _id: '$$branch._id',
                                        retailSegment: '$$branch.retailSegment',
                                        outlet: '$$branch.outlet',
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        pipeline.push({
            $addFields: {
                outlet: {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: '$outlet',
                            }, 0],
                        },
                        then: '$outlet',
                        else: {
                            $setUnion: ['$branch.outlet', []],
                        },
                    },
                },
            },
        });

        if (_.get(queryFilter, `${CONTENT_TYPES.OUTLET}.length`)) {
            pipeline.push({
                $addFields: {
                    branch: {
                        $let: {
                            vars: {
                                filters: {
                                    outlet: queryFilter[CONTENT_TYPES.OUTLET],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch',
                                            as: 'branch',
                                            cond: {
                                                $setIsSubset: [['$$branch.outlet'], '$$filters.outlet'],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: {
                                        _id: '$$branch._id',
                                        retailSegment: '$$branch.retailSegment',
                                        outlet: '$$branch.outlet',
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        pipeline.push({
            $addFields: {
                branch: {
                    $map: {
                        input: '$branch',
                        as: 'branch',
                        in: '$$branch._id',
                    },
                },
            },
        });

        if (_.get(queryFilter, `${CONTENT_TYPES.BRANCH}.length`)) {
            pipeline.push(...[
                {
                    $group: {
                        _id: null,
                        items: { $push: '$$ROOT' },
                    },
                },
                {
                    $project: {
                        _id: false,
                        items: 1,
                        matchedItems: {
                            $let: {
                                vars: {
                                    filters: {
                                        branch: queryFilter[CONTENT_TYPES.BRANCH],
                                    },
                                },
                                in: {
                                    $filter: {
                                        input: '$items',
                                        as: 'item',
                                        cond: {
                                            $gt: [{
                                                $size: {
                                                    $filter: {
                                                        input: '$$item.branch',
                                                        as: 'branch',
                                                        cond: {
                                                            $setIsSubset: [['$$branch'], '$$filters.branch'],
                                                        },
                                                    },
                                                },
                                            }, 0],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                /*
                 * tip: key thing is that if at least one item match condition then it's true condition,
                 * else condition is incorrect and branches with one of provided trade channel or outlet aren't exists.
                 */
                {
                    $project: {
                        items: {
                            $cond: {
                                if: {
                                    $gt: [{
                                        $size: '$matchedItems',
                                    }, 0],
                                },
                                then: '$matchedItems',
                                else: '$items',
                            },
                        },
                    },
                },
                {
                    $unwind: {
                        path: '$items',
                    },
                },
                {
                    $replaceRoot: {
                        newRoot: '$items',
                    },
                },
            ]);
        }

        pipeline.push(...[
            {
                $project: {
                    _id: 1,
                    country: 1,
                    region: 1,
                    subRegion: 1,
                    branch: 1,
                    retailSegment: 1,
                    outlet: 1,
                    recipients: 1,
                },
            },
            {
                $group: {
                    _id: null,
                    country: { $first: '$country' },
                    region: { $push: '$region' },
                    subRegion: { $push: '$subRegion' },
                    branch: { $push: '$branch' },
                    retailSegment: { $push: '$retailSegment' },
                    outlet: { $push: '$outlet' },
                    recipients: { $push: '$recipients' },
                },
            },
            {
                $project: {
                    _id: false,
                    country: 1,
                    region: {
                        $reduce: {
                            input: '$region',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                    subRegion: {
                        $reduce: {
                            input: '$subRegion',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                    branch: {
                        $reduce: {
                            input: '$branch',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                    retailSegment: {
                        $reduce: {
                            input: '$retailSegment',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                    outlet: {
                        $reduce: {
                            input: '$outlet',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                    recipients: {
                        $reduce: {
                            input: '$recipients',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$this', []],
                                    },
                                    then: {
                                        $setUnion: ['$$this', '$$value'],
                                    },
                                    else: '$$value',
                                },
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'country',
                    foreignField: '_id',
                    as: 'country',
                },
            },
            {
                $addFields: {
                    country: {
                        $map: {
                            input: '$country',
                            as: 'country',
                            in: {
                                _id: '$$country._id',
                                name: '$$country.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'personnels',
                    localField: 'recipients',
                    foreignField: '_id',
                    as: 'recipients',
                },
            },
            {
                $addFields: {
                    recipients: {
                        $filter: {
                            input: {
                                $map: {
                                    input: '$recipients',
                                    as: 'recipient',
                                    in: {
                                        _id: '$$recipient._id',
                                        name: {
                                            en: { $concat: ['$$recipient.firstName.en', ' ', '$$recipient.lastName.en'] },
                                            ar: { $concat: ['$$recipient.firstName.ar', ' ', '$$recipient.lastName.ar'] },
                                        },
                                        position: '$$recipient.position',
                                    },
                                },
                            },
                            as: 'recipient',
                            cond: {
                                $ne: ['$$recipient.position', null],
                            },
                        },
                    },
                },
            },
            {
                $addFields: {
                    recipientsPosition: {
                        $setUnion: [{
                            $map: {
                                input: '$recipients',
                                as: 'recipient',
                                in: '$$recipient.position',
                            },
                        }, []],
                    },
                },
            },
        ]);

        if (_.get(queryFilter, `${CONTENT_TYPES.POSITION}.length`)) {
            pipeline.push({
                $addFields: {
                    recipients: {
                        $filter: {
                            input: '$recipients',
                            as: 'recipient',
                            cond: {
                                $setIsSubset: [['$$recipient.position'], queryFilter[CONTENT_TYPES.POSITION]],
                            },
                        },
                    },
                },
            });
        }

        pipeline.push(...[
            {
                $lookup: {
                    from: 'positions',
                    localField: 'recipientsPosition',
                    foreignField: '_id',
                    as: 'recipientsPosition',
                },
            },
            {
                $addFields: {
                    recipients: {
                        $map: {
                            input: '$recipients',
                            as: 'recipient',
                            in: {
                                _id: '$$recipient._id',
                                name: '$$recipient.name',
                            },
                        },
                    },
                    recipientsPosition: {
                        $map: {
                            input: '$recipientsPosition',
                            as: 'position',
                            in: {
                                _id: '$$position._id',
                                name: '$$position.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'region',
                    foreignField: '_id',
                    as: 'region',
                },
            },
            {
                $addFields: {
                    region: {
                        $map: {
                            input: '$region',
                            as: 'region',
                            in: {
                                _id: '$$region._id',
                                name: '$$region.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'subRegion',
                    foreignField: '_id',
                    as: 'subRegion',
                },
            },
            {
                $addFields: {
                    subRegion: {
                        $map: {
                            input: '$subRegion',
                            as: 'subRegion',
                            in: {
                                _id: '$$subRegion._id',
                                name: '$$subRegion.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'retailSegments',
                    localField: 'retailSegment',
                    foreignField: '_id',
                    as: 'retailSegment',
                },
            },
            {
                $addFields: {
                    retailSegment: {
                        $map: {
                            input: '$retailSegment',
                            as: 'retailSegment',
                            in: {
                                _id: '$$retailSegment._id',
                                name: '$$retailSegment.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'outlets',
                    localField: 'outlet',
                    foreignField: '_id',
                    as: 'outlet',
                },
            },
            {
                $addFields: {
                    outlet: {
                        $map: {
                            input: '$outlet',
                            as: 'outlet',
                            in: {
                                _id: '$$outlet._id',
                                name: '$$outlet.name',
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'branches',
                    localField: 'branch',
                    foreignField: '_id',
                    as: 'branch',
                },
            },
            {
                $addFields: {
                    branch: {
                        $map: {
                            input: '$branch',
                            as: 'branch',
                            in: {
                                _id: '$$branch._id',
                                name: '$$branch.name',
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: false,
                    country: 1,
                    region: 1,
                    subRegion: 1,
                    branch: 1,
                    outlet: 1,
                    retailSegment: 1,
                    position: '$recipientsPosition',
                    personnel: '$recipients',
                    translated: [],
                },
            },
        ]);

        async.waterfall([

            (cb) => {
                NotificationModel.aggregate(pipeline)
                    .allowDiskUse(true)
                    .exec(cb);
            },

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            const body = result[0];

            res.status(200).send(body);
        });
    };

    this.objectiveFilters = function (req, res, next) {
        const _ = require('lodash');
        const moment = require('moment');
        const Ajv = require('ajv');
        const ajv = new Ajv();
        const CONSTANTS = require('../public/js/constants/otherConstants');
        const locationFilter = require('./../stories/customReports/utils/locationFilter');
        const timeFilterSchema = require('./../stories/customReports/utils/timeFilter.schema');

        const queryRun = (personnel, callback) => {
            const query = req.query;
            const queryFilter = query.filter || {};

            const filterMapper = new FilterMapper();
            const filter = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.OBJECTIVES,
                filter: query.filter,
                personnel,
            });

            [
                CONTENT_TYPES.COUNTRY,
                CONTENT_TYPES.REGION,
                CONTENT_TYPES.SUBREGION,
                CONTENT_TYPES.BRANCH,
                CONTENT_TYPES.RETAILSEGMENT,
                CONTENT_TYPES.OUTLET,
                CONTENT_TYPES.POSITION,
            ].forEach((filterName) => {
                if (filter[filterName]) {
                    queryFilter[filterName] = filter[filterName].$in;
                }
            });

            const pipeline = [];

            const scopeFilter = {};

            locationFilter(pipeline, personnel, queryFilter, scopeFilter);

            pipeline.push({
                $project: {
                    _id: 1,
                    country: 1,
                    createdAt: '$createdBy.date',
                    status: 1,
                    archived: 1,
                    context: 1,
                },
            });

            if (queryFilter.time) {
                const timeFilter = [{
                    from: new Date(queryFilter.time.values[0]),
                    to: new Date(queryFilter.time.values[0]),
                }];

                const timeFilterValidate = ajv.compile(timeFilterSchema);
                const timeFilterValid = timeFilterValidate({ timeFrames: timeFilter });

                if (!timeFilterValid) {
                    const err = new Error(timeFilterValidate.errors[0].message);

                    err.status = 400;

                    return next(err);
                }

                pipeline.push({
                    $match: {
                        $or: timeFilter.map(frame => {
                            return {
                                $and: [
                                    { createdAt: { $gt: moment(frame.from, 'MM/DD/YYYY')._d } },
                                    { createdAt: { $lt: moment(frame.to, 'MM/DD/YYYY')._d } },
                                ],
                            };
                        }),
                    },
                });
            }

            pipeline.push(...[
                {
                    $match: {
                        status: { $ne: 'draft' },
                        archived: false,
                        context: CONTENT_TYPES.OBJECTIVES,
                    },
                },
                {
                    $project: {
                        _id: 1,
                        country: {
                            $ifNull: ['$country', []],
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        country: { $push: '$country' },
                        items: { $push: '$$ROOT._id' },
                    },
                },
                {
                    $project: {
                        _id: '$items',
                        country: {
                            $reduce: {
                                input: '$country',
                                initialValue: [],
                                in: {
                                    $cond: {
                                        if: {
                                            $ne: ['$$this', []],
                                        },
                                        then: {
                                            $setUnion: ['$$this', '$$value'],
                                        },
                                        else: '$$value',
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    $unwind: {
                        path: '$_id',
                    },
                },
                {
                    $lookup: {
                        from: 'objectives',
                        localField: '_id',
                        foreignField: '_id',
                        as: '_id',
                    },
                },
                {
                    $project: {
                        _id: false,
                        objective: {
                            $let: {
                                vars: {
                                    objective: { $arrayElemAt: ['$_id', 0] },
                                },
                                in: {
                                    _id: '$$objective._id',
                                    title: '$$objective.title',
                                    country: '$$objective.country',
                                    region: '$$objective.region',
                                    subRegion: '$$objective.subRegion',
                                    branch: '$$objective.branch',
                                    objectiveType: '$$objective.objectiveType',
                                    formType: '$$objective.form.contentType',
                                    priority: '$$objective.priority',
                                    status: '$$objective.status',
                                    publisher: ['$$objective.createdBy.user'],
                                    assignee: '$$objective.assignedTo',
                                },
                            },
                        },
                        country: 1,
                    },
                },
            ]);

            if (_.get(queryFilter, `${CONTENT_TYPES.COUNTRY}.length`)) {
                pipeline.push({
                    $match: {
                        'objective.country': {
                            $in: queryFilter[CONTENT_TYPES.COUNTRY],
                        },
                    },
                });
            }

            pipeline.push(...[
                {
                    $project: {
                        _id: '$objective._id',
                        title: '$objective.title',
                        country: { $ifNull: ['$country', []] },
                        region: {
                            $cond: {
                                if: { $gt: [{ $size: { $ifNull: ['$objective.region', []] } }, 0] },
                                then: { selected: '$objective.region' },
                                else: { all: 'region' },
                            },
                        },
                        subRegion: {
                            $cond: {
                                if: { $gt: [{ $size: { $ifNull: ['$objective.subRegion', []] } }, 0] },
                                then: { selected: '$objective.subRegion' },
                                else: { all: 'subRegion' },
                            },
                        },
                        branch: {
                            $cond: {
                                if: { $gt: [{ $size: { $ifNull: ['$objective.branch', []] } }, 0] },
                                then: { selected: '$objective.branch' },
                                else: { all: 'branch' },
                            },
                        },
                        objectiveType: '$objective.objectiveType',
                        formType: '$objective.formType',
                        priority: '$objective.priority',
                        status: '$objective.status',
                        publisher: '$objective.publisher',
                        assignee: '$objective.assignee',
                    },
                },
                {
                    $lookup: {
                        from: 'domains',
                        localField: 'country',
                        foreignField: '_id',
                        as: 'country',
                    },
                },
                {
                    $addFields: {
                        country: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$country',
                                        as: 'country',
                                        cond: {
                                            $eq: ['$$country.archived', false],
                                        },
                                    },
                                },
                                as: 'country',
                                in: '$$country._id',
                            },
                        },
                    },
                },
            ]);

            pipeline.push({
                $lookup: {
                    from: 'domains',
                    localField: 'region.selected',
                    foreignField: '_id',
                    as: 'region.selected',
                },
            });

            {
                const $addFields = {};

                if (_.get(queryFilter, `${CONTENT_TYPES.COUNTRY}.length`)) {
                    $addFields['region.selected'] = {
                        $let: {
                            vars: {
                                filters: {
                                    country: queryFilter[CONTENT_TYPES.COUNTRY],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$region.selected',
                                            as: 'region',
                                            cond: {
                                                $and: [
                                                    { $eq: ['$$region.archived', false] },
                                                    { $setIsSubset: [['$$region.parent'], '$$filters.country'] },
                                                ],
                                            },
                                        },
                                    },
                                    as: 'region',
                                    in: '$$region._id',
                                },
                            },
                        },
                    };
                } else {
                    $addFields['region.selected'] = {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$region.selected',
                                    as: 'region',
                                    cond: {
                                        $eq: ['$$region.archived', false],
                                    },
                                },
                            },
                            as: 'region',
                            in: '$$region._id',
                        },
                    };
                }

                pipeline.push({ $addFields });
            }

            pipeline.push({
                $lookup: {
                    from: 'domains',
                    localField: 'region.all',
                    foreignField: 'type',
                    as: 'region.all',
                },
            });

            {
                const $addFields = {};

                if (_.get(queryFilter, `${CONTENT_TYPES.COUNTRY}.length`)) {
                    $addFields.region = {
                        $let: {
                            vars: {
                                filters: {
                                    country: queryFilter[CONTENT_TYPES.COUNTRY],
                                },
                            },
                            in: {
                                $cond: {
                                    if: {
                                        $gt: [{
                                            $size: {
                                                $ifNull: ['$region.selected', []],
                                            },
                                        }, 0],
                                    },
                                    then: '$region.selected',
                                    else: {
                                        $map: {
                                            input: {
                                                $filter: {
                                                    input: '$region.all',
                                                    as: 'region',
                                                    cond: {
                                                        $and: [
                                                            { $eq: ['$$region.archived', false] },
                                                            { $setIsSubset: [['$$region.parent'], '$$filters.country'] },
                                                        ],
                                                    },
                                                },
                                            },
                                            as: 'region',
                                            in: '$$region._id',
                                        },
                                    },
                                },
                            },
                        },
                    };
                } else {
                    $addFields.region = {
                        $cond: {
                            if: {
                                $gt: [{
                                    $size: {
                                        $ifNull: ['$region.selected', []],
                                    },
                                }, 0],
                            },
                            then: '$region.selected',
                            else: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$region.all',
                                            as: 'region',
                                            cond: {
                                                $eq: ['$$region.archived', false],
                                            },
                                        },
                                    },
                                    as: 'region',
                                    in: '$$region._id',
                                },
                            },
                        },
                    };
                }

                pipeline.push({ $addFields });
            }


            if (scopeFilter[CONTENT_TYPES.REGION]) {
                pipeline.push({
                    $addFields: {
                        region: {
                            $filter: {
                                input: '$region',
                                as: 'region',
                                cond: {
                                    $setIsSubset: [['$$region'], scopeFilter[CONTENT_TYPES.REGION]],
                                },
                            },
                        },
                    },
                });
            }

            if (_.get(queryFilter, `${CONTENT_TYPES.REGION}.length`)) {
                pipeline.push(...[{

                    $addFields: {
                        acceptable: {
                            $let: {
                                vars: {
                                    filters: {
                                        region: queryFilter[CONTENT_TYPES.REGION],
                                    },
                                },
                                in: {
                                    $cond: {
                                        if: {
                                            $gt: [{
                                                $size: {
                                                    $filter: {
                                                        input: '$region',
                                                        as: 'region',
                                                        cond: {
                                                            $setIsSubset: [['$$region'], '$$filters.region'],
                                                        },
                                                    },
                                                },
                                            }, 0],
                                        },
                                        then: true,
                                        else: false,
                                    },
                                },
                            },
                        },
                    },
                },
                    {
                        $match: {
                            acceptable: true,
                        },
                    },
                ]);
            }

            pipeline.push({
                $lookup: {
                    from: 'domains',
                    localField: 'subRegion.selected',
                    foreignField: '_id',
                    as: 'subRegion.selected',
                },
            });

            {
                const $addFields = {};

                if (_.get(queryFilter, `${CONTENT_TYPES.REGION}.length`)) {
                    $addFields['subRegion.selected'] = {
                        $let: {
                            vars: {
                                filters: {
                                    region: queryFilter[CONTENT_TYPES.REGION],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$subRegion.selected',
                                            as: 'subRegion',
                                            cond: {
                                                $and: [
                                                    { $eq: ['$$subRegion.archived', false] },
                                                    { $setIsSubset: [['$$subRegion.parent'], '$$filters.region'] },
                                                ],
                                            },
                                        },
                                    },
                                    as: 'subRegion',
                                    in: '$$subRegion._id',
                                },
                            },
                        },
                    };
                } else {
                    $addFields['subRegion.selected'] = {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$subRegion.selected',
                                    as: 'subRegion',
                                    cond: {
                                        $and: [
                                            { $eq: ['$$subRegion.archived', false] },
                                            { $setIsSubset: [['$$subRegion.parent'], '$region'] },
                                        ],
                                    },
                                },
                            },
                            as: 'subRegion',
                            in: '$$subRegion._id',
                        },
                    };
                }

                pipeline.push({ $addFields });
            }

            pipeline.push({
                $lookup: {
                    from: 'domains',
                    localField: 'subRegion.all',
                    foreignField: 'type',
                    as: 'subRegion.all',
                },
            });

            {
                const $addFields = {};

                if (_.get(queryFilter, `${CONTENT_TYPES.REGION}.length`)) {
                    $addFields.subRegion = {
                        $let: {
                            vars: {
                                filters: {
                                    region: queryFilter[CONTENT_TYPES.REGION],
                                },
                            },
                            in: {
                                $cond: {
                                    if: {
                                        $gt: [{
                                            $size: {
                                                $ifNull: ['$subRegion.selected', []],
                                            },
                                        }, 0],
                                    },
                                    then: '$subRegion.selected',
                                    else: {
                                        $map: {
                                            input: {
                                                $filter: {
                                                    input: '$subRegion.all',
                                                    as: 'subRegion',
                                                    cond: {
                                                        $and: [
                                                            { $eq: ['$$subRegion.archived', false] },
                                                            { $setIsSubset: [['$$subRegion.parent'], '$$filters.region'] },
                                                        ],
                                                    },
                                                },
                                            },
                                            as: 'subRegion',
                                            in: '$$subRegion._id',
                                        },
                                    },
                                },
                            },
                        },
                    };
                } else {
                    $addFields.subRegion = {
                        $cond: {
                            if: {
                                $gt: [{
                                    $size: {
                                        $ifNull: ['$subRegion.selected', []],
                                    },
                                }, 0],
                            },
                            then: '$subRegion.selected',
                            else: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$subRegion.all',
                                            as: 'subRegion',
                                            cond: {
                                                $and: [
                                                    { $eq: ['$$subRegion.archived', false] },
                                                    { $setIsSubset: [['$$subRegion.parent'], '$region'] },
                                                ],
                                            },
                                        },
                                    },
                                    as: 'subRegion',
                                    in: '$$subRegion._id',
                                },
                            },
                        },
                    };
                }

                pipeline.push({ $addFields });
            }

            if (scopeFilter[CONTENT_TYPES.SUBREGION]) {
                pipeline.push({
                    $addFields: {
                        subRegion: {
                            $filter: {
                                input: '$subRegion',
                                as: 'subRegion',
                                cond: {
                                    $setIsSubset: [['$$subRegion'], scopeFilter[CONTENT_TYPES.SUBREGION]],
                                },
                            },
                        },
                    },
                });
            }

            if (_.get(queryFilter, `${CONTENT_TYPES.SUBREGION}.length`)) {
                pipeline.push(...[
                    {
                        $addFields: {
                            acceptable: {
                                $let: {
                                    vars: {
                                        filters: {
                                            subRegion: queryFilter[CONTENT_TYPES.SUBREGION],
                                        },
                                    },
                                    in: {
                                        $cond: {
                                            if: {
                                                $gt: [{
                                                    $size: {
                                                        $filter: {
                                                            input: '$subRegion',
                                                            as: 'subRegion',
                                                            cond: {
                                                                $setIsSubset: [['$$subRegion'], '$$filters.subRegion'],
                                                            },
                                                        },
                                                    },
                                                }, 0],
                                            },
                                            then: true,
                                            else: false,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    {
                        $match: {
                            acceptable: true,
                        },
                    },
                ]);
            }

            pipeline.push({
                $lookup: {
                    from: 'branches',
                    localField: 'branch.selected',
                    foreignField: '_id',
                    as: 'branch.selected',
                },
            });
            {
                const $addFields = {};

                if (_.get(queryFilter, `${CONTENT_TYPES.SUBREGION}.length`)) {
                    $addFields['branch.selected'] = {
                        $let: {
                            vars: {
                                filters: {
                                    subRegion: queryFilter[CONTENT_TYPES.SUBREGION],
                                },
                            },
                            in: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch.selected',
                                            as: 'branch',
                                            cond: {
                                                $and: [
                                                    { $eq: ['$$branch.archived', false] },
                                                    { $setIsSubset: [['$$branch.subRegion'], '$$filters.subRegion'] },
                                                ],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: {
                                        _id: '$$branch._id',
                                        retailSegment: '$$branch.retailSegment',
                                        outlet: '$$branch.outlet',
                                    },
                                },
                            },
                        },
                    };
                } else {
                    $addFields['branch.selected'] = {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$branch.selected',
                                    as: 'branch',
                                    cond: {
                                        $and: [
                                            { $eq: ['$$branch.archived', false] },
                                            { $setIsSubset: [['$$branch.subRegion'], '$subRegion'] },
                                        ],
                                    },
                                },
                            },
                            as: 'branch',
                            in: {
                                _id: '$$branch._id',
                                retailSegment: '$$branch.retailSegment',
                                outlet: '$$branch.outlet',
                            },
                        },
                    };
                }

                pipeline.push({ $addFields });
            }

            pipeline.push({
                $addFields: {
                    retailSegment: {
                        $setUnion: ['$branch.selected.retailSegment', []],
                    },
                },
            });

            if (_.get(queryFilter, `${CONTENT_TYPES.RETAILSEGMENT}.length`)) {
                pipeline.push({
                    $addFields: {
                        'branch.selected': {
                            $let: {
                                vars: {
                                    filters: {
                                        retailSegment: queryFilter[CONTENT_TYPES.RETAILSEGMENT],
                                    },
                                },
                                in: {
                                    $map: {
                                        input: {
                                            $filter: {
                                                input: '$branch.selected',
                                                as: 'branch',
                                                cond: {
                                                    $setIsSubset: [['$$branch.retailSegment'], '$$filters.retailSegment'],
                                                },
                                            },
                                        },
                                        as: 'branch',
                                        in: {
                                            _id: '$$branch._id',
                                            retailSegment: '$$branch.retailSegment',
                                            outlet: '$$branch.outlet',
                                        },
                                    },
                                },
                            },
                        },
                    },
                });
            }

            pipeline.push({
                $addFields: {
                    outlet: {
                        $setUnion: ['$branch.selected.outlet', []],
                    },
                },
            });

            if (_.get(queryFilter, `${CONTENT_TYPES.OUTLET}.length`)) {
                pipeline.push({
                    $addFields: {
                        'branch.selected': {
                            $let: {
                                vars: {
                                    filters: {
                                        outlet: queryFilter[CONTENT_TYPES.OUTLET],
                                    },
                                },
                                in: {
                                    $map: {
                                        input: {
                                            $filter: {
                                                input: '$branch.selected',
                                                as: 'branch',
                                                cond: {
                                                    $setIsSubset: [['$$branch.outlet'], '$$filters.outlet'],
                                                },
                                            },
                                        },
                                        as: 'branch',
                                        in: {
                                            _id: '$$branch._id',
                                            retailSegment: '$$branch.retailSegment',
                                            outlet: '$$branch.outlet',
                                        },
                                    },
                                },
                            },
                        },
                    },
                });
            }

            pipeline.push({
                $lookup: {
                    from: 'branches',
                    localField: 'subRegion',
                    foreignField: 'subRegion',
                    as: 'branch.all',
                },
            });

            {
                const $addFields = {};

                if (_.get(queryFilter, `${CONTENT_TYPES.SUBREGION}.length`)) {
                    $addFields.branch = {
                        $let: {
                            vars: {
                                filters: {
                                    subRegion: queryFilter[CONTENT_TYPES.SUBREGION],
                                },
                            },
                            in: {
                                $cond: {
                                    if: {
                                        $gt: [{
                                            $size: {
                                                $ifNull: ['$branch.selected', []],
                                            },
                                        }, 0],
                                    },
                                    then: '$branch.selected',
                                    else: {
                                        $map: {
                                            input: {
                                                $filter: {
                                                    input: '$branch.all',
                                                    as: 'branch',
                                                    cond: {
                                                        $and: [
                                                            { $eq: ['$$branch.archived', false] },
                                                            { $setIsSubset: [['$$branch.subRegion'], '$$filters.subRegion'] },
                                                        ],
                                                    },
                                                },
                                            },
                                            as: 'branch',
                                            in: {
                                                _id: '$$branch._id',
                                                retailSegment: '$$branch.retailSegment',
                                                outlet: '$$branch.outlet',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    };
                } else {
                    $addFields.branch = {
                        $cond: {
                            if: {
                                $gt: [{
                                    $size: {
                                        $ifNull: ['$branch.selected', []],
                                    },
                                }, 0],
                            },
                            then: '$branch.selected',
                            else: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$branch.all',
                                            as: 'branch',
                                            cond: {
                                                $and: [
                                                    { $eq: ['$$branch.archived', false] },
                                                    { $setIsSubset: [['$$branch.subRegion'], '$subRegion'] },
                                                ],
                                            },
                                        },
                                    },
                                    as: 'branch',
                                    in: {
                                        _id: '$$branch._id',
                                        retailSegment: '$$branch.retailSegment',
                                        outlet: '$$branch.outlet',
                                    },
                                },
                            },
                        },
                    };
                }

                pipeline.push({ $addFields });
            }

            pipeline.push({
                $addFields: {
                    retailSegment: {
                        $cond: {
                            if: {
                                $gt: [{
                                    $size: '$retailSegment',
                                }, 0],
                            },
                            then: '$retailSegment',
                            else: {
                                $setUnion: ['$branch.retailSegment', []],
                            },
                        },
                    },
                },
            });

            if (_.get(queryFilter, `${CONTENT_TYPES.RETAILSEGMENT}.length`)) {
                pipeline.push({
                    $addFields: {
                        branch: {
                            $let: {
                                vars: {
                                    filters: {
                                        retailSegment: queryFilter[CONTENT_TYPES.RETAILSEGMENT],
                                    },
                                },
                                in: {
                                    $map: {
                                        input: {
                                            $filter: {
                                                input: '$branch',
                                                as: 'branch',
                                                cond: {
                                                    $setIsSubset: [['$$branch.retailSegment'], '$$filters.retailSegment'],
                                                },
                                            },
                                        },
                                        as: 'branch',
                                        in: {
                                            _id: '$$branch._id',
                                            retailSegment: '$$branch.retailSegment',
                                            outlet: '$$branch.outlet',
                                        },
                                    },
                                },
                            },
                        },
                    },
                });
            }

            pipeline.push({
                $addFields: {
                    outlet: {
                        $cond: {
                            if: {
                                $gt: [{
                                    $size: '$outlet',
                                }, 0],
                            },
                            then: '$outlet',
                            else: {
                                $setUnion: ['$branch.outlet', []],
                            },
                        },
                    },
                },
            });

            if (_.get(queryFilter, `${CONTENT_TYPES.OUTLET}.length`)) {
                pipeline.push({
                    $addFields: {
                        branch: {
                            $let: {
                                vars: {
                                    filters: {
                                        outlet: queryFilter[CONTENT_TYPES.OUTLET],
                                    },
                                },
                                in: {
                                    $map: {
                                        input: {
                                            $filter: {
                                                input: '$branch',
                                                as: 'branch',
                                                cond: {
                                                    $setIsSubset: [['$$branch.outlet'], '$$filters.outlet'],
                                                },
                                            },
                                        },
                                        as: 'branch',
                                        in: {
                                            _id: '$$branch._id',
                                            retailSegment: '$$branch.retailSegment',
                                            outlet: '$$branch.outlet',
                                        },
                                    },
                                },
                            },
                        },
                    },
                });
            }

            pipeline.push({
                $addFields: {
                    branch: {
                        $map: {
                            input: '$branch',
                            as: 'branch',
                            in: {
                                _id: '$$branch._id',
                            },
                        },
                    },
                },
            });

            if (_.get(queryFilter, `${CONTENT_TYPES.BRANCH}.length`)) {
                pipeline.push(...[
                    {
                        $group: {
                            _id: null,
                            reports: { $push: '$$ROOT' },
                        },
                    },
                    {
                        $project: {
                            _id: false,
                            reports: 1,
                            matchedReports: {
                                $let: {
                                    vars: {
                                        filters: {
                                            branch: queryFilter[CONTENT_TYPES.BRANCH],
                                        },
                                    },
                                    in: {
                                        $filter: {
                                            input: '$reports',
                                            as: 'report',
                                            cond: {
                                                $gt: [{
                                                    $size: {
                                                        $filter: {
                                                            input: '$$report.branch',
                                                            as: 'branch',
                                                            cond: {
                                                                $setIsSubset: [['$$report.branch._id'], '$$filters.branch'],
                                                            },
                                                        },
                                                    },
                                                }, 0],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    /*
                     * tip: key thing is that if at least one report match condition then it's true condition,
                     * else condition is incorrect and branches with one of provided trade channel or outlet aren't exists.
                     */
                    {
                        $project: {
                            reports: {
                                $cond: {
                                    if: {
                                        $gt: [{
                                            $size: '$matchedReports',
                                        }, 0],
                                    },
                                    then: '$matchedReports',
                                    else: '$reports',
                                },
                            },
                        },
                    },
                    {
                        $unwind: {
                            path: '$reports',
                        },
                    },
                    {
                        $replaceRoot: {
                            newRoot: '$reports',
                        },
                    },
                ]);
            }

            pipeline.push(...[
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        country: 1,
                        region: 1,
                        subRegion: 1,
                        branch: '$branch._id',
                        retailSegment: 1,
                        outlet: 1,
                        objectiveType: 1,
                        formType: 1,
                        priority: 1,
                        status: 1,
                        publisher: 1,
                        assignee: 1,
                    },
                },
                {
                    $group: {
                        _id: null,
                        objectiveType: { $addToSet: '$objectiveType' },
                        formType: { $addToSet: '$formType' },
                        priority: { $addToSet: '$priority' },
                        status: { $addToSet: '$status' },
                        items: {
                            $push: {
                                _id: '$$ROOT._id',
                                country: '$$ROOT.country',
                                region: '$$ROOT.region',
                                subRegion: '$$ROOT.subRegion',
                                branch: '$$ROOT.branch',
                                retailSegment: '$$ROOT.retailSegment',
                                outlet: '$$ROOT.outlet',
                                objectiveType: '$$ROOT.objectiveType',
                                formType: '$$ROOT.formType',
                                priority: '$$ROOT.priority',
                                status: '$$ROOT.status',
                                publisher: '$$ROOT.publisher',
                                assignee: '$$ROOT.assignee',
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: false,
                        shared: {
                            objectiveType: '$objectiveType',
                            status: '$status',
                            priority: '$priority',
                            formType: '$formType',
                        },
                        items: 1,
                    },
                },
            ]);


            if (_.get(queryFilter, 'status.length')) {
                pipeline.push(...[
                    {
                        $addFields: {
                            items: {
                                $let: {
                                    vars: {
                                        status: queryFilter.status,
                                    },
                                    in: {
                                        $filter: {
                                            input: '$items',
                                            as: 'item',
                                            cond: {
                                                $setIsSubset: [['$$item.status'], '$$status'],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    {
                        $addFields: {
                            'shared.priority': {
                                $setUnion: ['$items.priority', []],
                            },
                            'shared.formType': {
                                $setUnion: ['$items.formType', []],
                            },
                        },
                    },
                ]);
            }

            if (_.get(queryFilter, 'priority.length')) {
                pipeline.push(...[
                    {
                        $addFields: {
                            items: {
                                $let: {
                                    vars: {
                                        priority: queryFilter.priority,
                                    },
                                    in: {
                                        $filter: {
                                            input: '$items',
                                            as: 'item',
                                            cond: {
                                                $setIsSubset: [['$$item.priority'], '$$priority'],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    {
                        $addFields: {
                            'shared.formType': {
                                $setUnion: ['$items.formType', []],
                            },
                        },
                    },
                ]);
            }

            pipeline.push(...[
                {
                    $unwind: {
                        path: '$items',
                    },
                },
                {
                    $project: {
                        _id: false,
                        country: '$items.country',
                        region: '$items.region',
                        subRegion: '$items.subRegion',
                        branch: '$items.branch',
                        retailSegment: '$items.retailSegment',
                        outlet: '$items.outlet',
                        objectiveType: '$shared.objectiveType',
                        formType: '$shared.formType',
                        priority: '$shared.priority',
                        status: '$shared.status',
                        publisher: '$items.publisher',
                        assignee: '$items.assignee',
                    },
                },
                {
                    $group: {
                        _id: null,
                        country: { $push: '$country' },
                        region: { $push: '$region' },
                        subRegion: { $push: '$subRegion' },
                        branch: { $push: '$branch' },
                        retailSegment: { $push: '$retailSegment' },
                        outlet: { $push: '$outlet' },
                        objectiveType: { $first: '$objectiveType' },
                        formType: { $first: '$formType' },
                        priority: { $first: '$priority' },
                        status: { $first: '$status' },
                        publisher: { $push: '$publisher' },
                        assignee: { $push: '$assignee' },
                    },
                },
                {
                    $project: {
                        _id: false,
                        country: {
                            $reduce: {
                                input: '$country',
                                initialValue: [],
                                in: {
                                    $cond: {
                                        if: {
                                            $ne: ['$$this', []],
                                        },
                                        then: {
                                            $setUnion: ['$$this', '$$value'],
                                        },
                                        else: '$$value',
                                    },
                                },
                            },
                        },
                        region: {
                            $reduce: {
                                input: '$region',
                                initialValue: [],
                                in: {
                                    $cond: {
                                        if: {
                                            $ne: ['$$this', []],
                                        },
                                        then: {
                                            $setUnion: ['$$this', '$$value'],
                                        },
                                        else: '$$value',
                                    },
                                },
                            },
                        },
                        subRegion: {
                            $reduce: {
                                input: '$subRegion',
                                initialValue: [],
                                in: {
                                    $cond: {
                                        if: {
                                            $ne: ['$$this', []],
                                        },
                                        then: {
                                            $setUnion: ['$$this', '$$value'],
                                        },
                                        else: '$$value',
                                    },
                                },
                            },
                        },
                        branch: {
                            $reduce: {
                                input: '$branch',
                                initialValue: [],
                                in: {
                                    $cond: {
                                        if: {
                                            $ne: ['$$this', []],
                                        },
                                        then: {
                                            $setUnion: ['$$this', '$$value'],
                                        },
                                        else: '$$value',
                                    },
                                },
                            },
                        },
                        retailSegment: {
                            $reduce: {
                                input: '$retailSegment',
                                initialValue: [],
                                in: {
                                    $cond: {
                                        if: {
                                            $ne: ['$$this', []],
                                        },
                                        then: {
                                            $setUnion: ['$$this', '$$value'],
                                        },
                                        else: '$$value',
                                    },
                                },
                            },
                        },
                        outlet: {
                            $reduce: {
                                input: '$outlet',
                                initialValue: [],
                                in: {
                                    $cond: {
                                        if: {
                                            $ne: ['$$this', []],
                                        },
                                        then: {
                                            $setUnion: ['$$this', '$$value'],
                                        },
                                        else: '$$value',
                                    },
                                },
                            },
                        },
                        objectiveType: 1,
                        formType: 1,
                        priority: 1,
                        status: 1,
                        publisher: {
                            $reduce: {
                                input: '$publisher',
                                initialValue: [],
                                in: {
                                    $cond: {
                                        if: {
                                            $ne: ['$$this', []],
                                        },
                                        then: {
                                            $setUnion: ['$$this', '$$value'],
                                        },
                                        else: '$$value',
                                    },
                                },
                            },
                        },
                        assignee: {
                            $reduce: {
                                input: '$assignee',
                                initialValue: [],
                                in: {
                                    $cond: {
                                        if: {
                                            $ne: ['$$this', []],
                                        },
                                        then: {
                                            $setUnion: ['$$this', '$$value'],
                                        },
                                        else: '$$value',
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'domains',
                        localField: 'country',
                        foreignField: '_id',
                        as: 'country',
                    },
                },
                {
                    $addFields: {
                        country: {
                            $map: {
                                input: '$country',
                                as: 'country',
                                in: {
                                    _id: '$$country._id',
                                    name: '$$country.name',
                                },
                            },
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'personnels',
                        localField: 'publisher',
                        foreignField: '_id',
                        as: 'publisher',
                    },
                },
                {
                    $lookup: {
                        from: 'personnels',
                        localField: 'assignee',
                        foreignField: '_id',
                        as: 'assignee',
                    },
                },
                {
                    $addFields: {
                        publisher: {
                            $map: {
                                input: '$publisher',
                                as: 'publisher',
                                in: {
                                    _id: '$$publisher._id',
                                    name: {
                                        en: { $concat: ['$$publisher.firstName.en', ' ', '$$publisher.lastName.en'] },
                                        ar: { $concat: ['$$publisher.firstName.ar', ' ', '$$publisher.lastName.ar'] },
                                    },
                                },
                            },
                        },
                        assignee: {
                            $filter: {
                                input: {
                                    $map: {
                                        input: '$assignee',
                                        as: 'assignee',
                                        in: {
                                            _id: '$$assignee._id',
                                            name: {
                                                en: { $concat: ['$$assignee.firstName.en', ' ', '$$assignee.lastName.en'] },
                                                ar: { $concat: ['$$assignee.firstName.ar', ' ', '$$assignee.lastName.ar'] },
                                            },
                                            position: '$$assignee.position',
                                        },
                                    },
                                },
                                as: 'assignee',
                                cond: {
                                    $ne: ['$$assignee.position', null],
                                },
                            },
                        },
                    },
                },
                {
                    $addFields: {
                        assigneePosition: {
                            $setUnion: [{
                                $map: {
                                    input: '$assignee',
                                    as: 'assignee',
                                    in: '$$assignee.position',
                                },
                            }, []],
                        },
                    },
                },
            ]);

            if (_.get(queryFilter, `${CONTENT_TYPES.POSITION}.length`)) {
                pipeline.push({
                    $addFields: {
                        assignee: {
                            $filter: {
                                input: '$assignee',
                                as: 'assignee',
                                cond: {
                                    $setIsSubset: [['$$assignee.position'], queryFilter[CONTENT_TYPES.POSITION]],
                                },
                            },
                        },
                    },
                });
            }

            pipeline.push(...[
                {
                    $lookup: {
                        from: 'positions',
                        localField: 'assigneePosition',
                        foreignField: '_id',
                        as: 'assigneePosition',
                    },
                },
                {
                    $addFields: {
                        assignee: {
                            $map: {
                                input: '$assignee',
                                as: 'assignee',
                                in: {
                                    _id: '$$assignee._id',
                                    name: '$$assignee.name',
                                },
                            },
                        },
                        assigneePosition: {
                            $map: {
                                input: '$assigneePosition',
                                as: 'position',
                                in: {
                                    _id: '$$position._id',
                                    name: '$$position.name',
                                },
                            },
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'domains',
                        localField: 'region',
                        foreignField: '_id',
                        as: 'region',
                    },
                },
                {
                    $addFields: {
                        region: {
                            $map: {
                                input: '$region',
                                as: 'region',
                                in: {
                                    _id: '$$region._id',
                                    name: '$$region.name',
                                },
                            },
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'domains',
                        localField: 'subRegion',
                        foreignField: '_id',
                        as: 'subRegion',
                    },
                },
                {
                    $addFields: {
                        subRegion: {
                            $map: {
                                input: '$subRegion',
                                as: 'subRegion',
                                in: {
                                    _id: '$$subRegion._id',
                                    name: '$$subRegion.name',
                                },
                            },
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'retailSegments',
                        localField: 'retailSegment',
                        foreignField: '_id',
                        as: 'retailSegment',
                    },
                },
                {
                    $addFields: {
                        retailSegment: {
                            $map: {
                                input: '$retailSegment',
                                as: 'retailSegment',
                                in: {
                                    _id: '$$retailSegment._id',
                                    name: '$$retailSegment.name',
                                },
                            },
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'outlets',
                        localField: 'outlet',
                        foreignField: '_id',
                        as: 'outlet',
                    },
                },
                {
                    $addFields: {
                        outlet: {
                            $map: {
                                input: '$outlet',
                                as: 'outlet',
                                in: {
                                    _id: '$$outlet._id',
                                    name: '$$outlet.name',
                                },
                            },
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'branches',
                        localField: 'branch',
                        foreignField: '_id',
                        as: 'branch',
                    },
                },
                {
                    $addFields: {
                        branch: {
                            $map: {
                                input: '$branch',
                                as: 'branch',
                                in: {
                                    _id: '$$branch._id',
                                    name: '$$branch.name',
                                },
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: false,
                        country: 1,
                        region: 1,
                        subRegion: 1,
                        branch: 1,
                        outlet: 1,
                        retailSegment: 1,
                        objectiveType: 1,
                        status: 1,
                        priority: 1,
                        position: '$assigneePosition',
                    },
                },
            ]);

            ObjectiveModel.aggregate(pipeline)
                .allowDiskUse(true)
                .exec(callback);
        };

        async.waterfall([
            (cb) => {
                AccessManager.getReadAccess(req, ACL_MODULES.OBJECTIVE, cb);
            },
            (allowed, personnel, cb) => {
                queryRun(personnel, cb);
            },
        ], (err, result) => {
            if (err) {
                return next(err);
            }

            const response = result && result[0] ? result[0] : {
                country: [],
                region: [],
                subRegion: [],
                branch: [],
                outlet: [],
                retailSegment: [],
                objectiveType: [],
                status: [],
                priority: [],
                position: [],
            };

            const objectiveTypes = [{
                _id: 'weekly',
                name: {
                    en: 'Weekly Company Objective',
                    ar: '?????????? ???????????? ??????????????????',
                },
            }, {
                _id: 'individual',
                name: {
                    en: 'Individual Objective',
                    ar: '?????????????? ??????????????',
                },
            }, {
                _id: 'monthly',
                name: {
                    en: 'Monthly Company Objective',
                    ar: '?????????? ???????????? ??????????????',
                },
            }, {
                _id: 'country',
                name: {
                    en: 'Country Objective',
                    ar: '?????????? ??????????',
                },
            }];

            const priorities = [{
                _id: 'medium',
                name: {
                    en: 'medium',
                    ar: '??????????',
                },
            }, {
                _id: 'urgent',
                name: {
                    en: 'urgent',
                    ar: '????????',
                },
            }, {
                _id: 'low',
                name: {
                    en: 'low',
                    ar: '????????',
                },
            }, {
                _id: 'high',
                name: {
                    en: 'high',
                    ar: '?????? ????????????',
                },
            }];

            const statuses = [{
                _id: 'toBeDiscussed',
                name: {
                    en: 'To be discussed',
                    ar: '',
                },
            }, {
                _id: 'inProgress',
                name: {
                    en: 'In progress',
                    ar: '???? ????????????',
                },
            }, {
                _id: 'reOpened',
                name: {
                    en: 'Reopened',
                    ar: '????????',
                },
            }, {
                _id: 'closed',
                name: {
                    en: 'Closed',
                    ar: '????????',
                },
            }, {
                _id: 'overDue',
                name: {
                    en: 'Overdue',
                    ar: '??????????',
                },
            }, {
                _id: 'fail',
                name: {
                    en: 'Fail',
                    ar: '??????????',
                },
            }, {
                _id: 'completed',
                name: {
                    en: 'Completed',
                    ar: '????????',
                },
            }];

            response.objectiveType = objectiveTypes.filter((item) => {
                return response.objectiveType.indexOf(item._id) > -1;
            });

            response.priority = priorities.filter((item) => {
                return response.priority.indexOf(item._id) > -1;
            });

            response.status = statuses.filter((item) => {
                return response.status.indexOf(item._id) > -1;
            });

            res.status(200).send(response);
        });
    };

    this.inStoreTaskFilters = function (req, res, next) {
        getInStoreTaskFilters(req, res, next);
    };

    this.personnelTasks = function (req, res, next) {
        const query = req.query;
        const queryFilter = query.filter || {};
        const currentSelected = query.current;
        const filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);

        async.parallel([
            function (parallelCb) {
                getObjectiveFilters(req, res, next, (err, result) => {
                    if (err) {
                        return parallelCb(err);
                    }

                    return parallelCb(null, result);
                });
            },
            function (parallelCb) {
                getInStoreTaskFilters(req, res, next, (err, result) => {
                    if (err) {
                        return parallelCb(err);
                    }
                    return parallelCb(null, result);
                });
            },
        ], (err, result) => {
            let resp;

            function concatFilters(response) {
                const resultObject = {};
                const keysArray = FILTERS_CONSTANTS.FILTERS[CONTENT_TYPES.PERSONNELTASKS].array || [];
                const objectivesValues = response[0] || {};
                const inStoreTasksValues = response[1] || {};

                keysArray.forEach((key) => {
                    resultObject[key] = _.union(objectivesValues[key] || [], inStoreTasksValues[key] || []);
                });

                return resultObject;
            }

            if (err) {
                return next(err);
            }
            resp = concatFilters(result);
            redisFilters({
                currentSelected,
                filterExists,
                filtersObject: resp,
                personnelId: req.personnelModel._id,
                contentType: 'personnelTasks',
            }, (err, response) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.competitorBrandingFilters = function (req, res, next) {
        const query = req.query;
        const queryFilter = query.filter || {};
        const filterMapper = new FilterMapper();
        const currentSelected = query.current;
        const filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        const filter = filterMapper.mapFilter({
            filter: queryFilter,
            personnel: req.personnelModel,
        });
        const beforeFilter = _.pick(filter, '$and', '$or');
        let aggregation;
        let pipeLine = [];
        let aggregationHelper;

        const $defProjectionExtended = Object.assign({}, $defProjection, {
            firstName: 1,
            lastName: 1,
            personnel: 1,
            displaySeason: 1,
        });
        aggregationHelper = new AggregationHelper($defProjectionExtended, filter);

        pipeLine.push({
            $match: beforeFilter,
        });

        if (filter.personnel) {
            pipeLine.push({
                $match: {
                    'createdBy.user': filter.personnel,
                },
            });
        }

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'createdBy.user',
            addProjection: ['position', 'firstName', 'lastName'],
            isArray: false,
            includeSiblings: {
                createdBy: {
                    date: 1,
                },
            },
        }));

        if (filter.position) {
            pipeLine.push({
                $match: {
                    'createdBy.user.position': filter.position,
                },
            });
        }

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from: 'positions',
            key: 'createdBy.user.position',
            isArray: false,
            as: 'position',
            includeSiblings: {
                createdBy: {
                    date: 1,
                    user: {
                        _id: 1,
                        firstName: 1,
                        lastName: 1,
                    },
                },
            },
        }));

        pipeLine.push({
            $project: aggregationHelper.getProjection({
                personnel: {
                    _id: '$createdBy.user._id',
                    name: {
                        en: { $concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en'] },
                        ar: { $concat: ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar'] },
                    },
                },

                displaySeason: {
                    _id : '$displaySeason',
                    name: {
                        ar: '$displaySeason',
                        en: '$displaySeason'
                    }
                }
            }),
        });

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from: 'categories',
            key: 'category',
            isArray: true,
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from: 'domains',
            key: 'country',
            isArray: false,
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from: 'domains',
            key: 'region',
            isArray: false,
            addProjection: ['parent'],
        }));

        if (filter.country) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'region.parent': filter.country,
                        },
                        {
                            region: {
                                $exists: false,
                            },
                        },
                    ],
                },
            });
        }

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from: 'domains',
            key: 'subRegion',
            isArray: false,
            addProjection: ['parent'],
        }));

        if (filter.region) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'subRegion.parent': filter.region,
                        },
                        {
                            subRegion: {
                                $exists: false,
                            },
                        },
                    ],
                },
            });
        }

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from: 'branches',
            key: 'branch',
            isArray: false,
            addProjection: ['subRegion', 'outlet', 'retailSegment'],
        }));

        if (filter.outlet) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'branch.outlet': filter.outlet,
                        },
                        {
                            'branch.outlet': { $exists: false },
                        },
                    ],
                },
            });
        }

        if (filter.retailSegment) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'branch.retailSegment': filter.retailSegment,
                        },
                        {
                            'branch.retailSegment': { $exists: false },
                        },
                    ],
                },
            });
        }

        if (filter.subRegion) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'branch.subRegion': filter.subRegion,
                        },
                        {
                            'branch.subRegion': { $exists: false },
                        },
                    ],
                },
            });
        }

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from: 'outlets',
            key: 'branch.outlet',
            as: 'outlet',
            isArray: false,
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from: 'retailSegments',
            key: 'branch.retailSegment',
            as: 'retailSegment',
            isArray: false,
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from: 'brands',
            key: 'brand',
            isArray: false,
        }));

        pipeLine.push({
            $group: {
                _id: null,
                category: { $addToSet: '$category' },
                brand: { $addToSet: '$brand' },
                displaySeason: { $addToSet: '$displaySeason' },
                country: { $addToSet: '$country' },
                region: { $addToSet: '$region' },
                subRegion: { $addToSet: '$subRegion' },
                retailSegment: { $addToSet: '$retailSegment' },
                outlet: { $addToSet: '$outlet' },
                branch: { $addToSet: '$branch' },
                position: { $addToSet: '$position' },
                personnel: { $addToSet: '$personnel' },
            },
        });

        aggregation = CompetitorBrandingModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true,
        };

        aggregation.exec((err, result) => {
            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {
                category: result.category && _.flatten(result.category) || [],
                brand: result.brand || [],
                country: result.country || [],
                region: result.region || [],
                subRegion: result.subRegion || [],
                retailSegment: result.retailSegment || [],
                displaySeason: result.displaySeason || [],
                outlet: result.outlet || [],
                branch: result.branch || [],
                position: result.position || [],
                personnel: result.personnel || [],
            };

            Object.keys(result).forEach((key) => {
                if (result[key]) {
                    let i = result[key].length - 1;
                    for (i; i >= 0; i--) {
                        if (!result[key][i] || !result[key][i]._id) {
                            result[key].splice(i, 1);
                        }
                    }
                }
            });

            redisFilters({
                currentSelected,
                filterExists,
                filtersObject: result,
                personnelId: req.personnelModel._id,
                contentType: CONTENT_TYPES.COMPETITORBRANDING,
            }, (err, response) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.competitorPromotionFilters = function (req, res, next) {
        const query = req.query;
        const queryFilter = query.filter || {};

        const filterMapper = new FilterMapper();

        const currentSelected = query.current;
        const filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        const filter = filterMapper.mapFilter({
            filter: queryFilter,
            personnel: req.personnelModel,
        });
        const beforeFilter = _.pick(filter, 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', '$and', '$or');
        const employeeFilter = filter.personnel ? { 'createdBy.user': _.pick(filter, 'personnel').personnel } : {};
        const afterFilter = _.pick(filter, 'position');

        if(filter.promoType){
            afterFilter['promoType.en'] = filter.promoType;
        }

        let aggregation;
        let pipeLine = [];
        pipeLine.push({
            $unwind: {
                path: '$category',
                preserveNullAndEmptyArrays: true,
            },
        });
        pipeLine.push({
            $match: beforeFilter,
        });
        pipeLine.push({
            $match: employeeFilter,
        });
        pipeLine.push({
            $lookup: {
                from: 'domains',
                localField: 'country',
                foreignField: '_id',
                as: 'country',
            },
        });
        pipeLine.push({
            $lookup: {
                from: 'domains',
                localField: 'region',
                foreignField: '_id',
                as: 'region',
            },
        });
        pipeLine.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegion',
                foreignField: '_id',
                as: 'subRegion',
            },
        });
        pipeLine.push({
            $lookup: {
                from: 'retailSegments',
                localField: 'retailSegment',
                foreignField: '_id',
                as: 'retailSegment',
            },
        });
        pipeLine.push({
            $lookup: {
                from: 'outlets',
                localField: 'outlet',
                foreignField: '_id',
                as: 'outlet',
            },
        });
        pipeLine.push({
            $lookup: {
                from: 'branches',
                localField: 'branch',
                foreignField: '_id',
                as: 'branch',
            },
        });
        pipeLine.push({
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category',
            },
        });
        pipeLine.push({
            $lookup: {
                from: 'brands',
                localField: 'brand',
                foreignField: '_id',
                as: 'brand',
            },
        });
        pipeLine.push({
            $lookup: {
                from: 'personnels',
                localField: 'createdBy.user',
                foreignField: '_id',
                as: 'createdBy.user',
            },
        });
        pipeLine.push({
            $project: {
                category: { $arrayElemAt: ['$category', 0] },
                brand: { $arrayElemAt: ['$brand', 0] },
                promoType: 1,
                country: { $arrayElemAt: ['$country', 0] },
                region: { $arrayElemAt: ['$region', 0] },
                subRegion: { $arrayElemAt: ['$subRegion', 0] },
                retailSegment: { $arrayElemAt: ['$retailSegment', 0] },
                outlet: { $arrayElemAt: ['$outlet', 0] },
                branch: { $arrayElemAt: ['$branch', 0] },
                createdBy: {
                    user: { $arrayElemAt: ['$createdBy.user', 0] },
                },
            },
        });
        pipeLine = _.union(pipeLine, domainPileLine({
            filter,
        }));
        pipeLine.push({
            $project: {
                category: 1,
                brand: 1,
                promoType: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                createdBy: 1,
                position: '$createdBy.user.position',
            },
        });
        pipeLine.push({
            $match: afterFilter,
        });
        pipeLine.push({
            $lookup: {
                from: 'positions',
                localField: 'position',
                foreignField: '_id',
                as: 'position',
            },
        });
        pipeLine.push({
            $project: {
                category: 1,
                brand: 1,
                promoType: 1,
                promoTypeExist: {$ifNull: ['$promoType', null]},
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                createdBy: 1,
                position: { $arrayElemAt: ['$position', 0] },
            },
        });
        pipeLine.push({
            $project: {
                promoType: {$cond: [
                        {$ne: ['$promoTypeExist', null]},
                    {
                    _id: '$promoType.en',
                    name: '$promoType'
                }, null]},
                category: {
                    _id: 1,
                    name: 1,
                },
                brand: {
                    _id: 1,
                    name: 1,
                },
                country: {
                    _id: 1,
                    name: 1,
                },
                region: {
                    _id: 1,
                    name: 1,
                },
                subRegion: {
                    _id: 1,
                    name: 1,
                },
                retailSegment: {
                    _id: 1,
                    name: 1,
                },
                outlet: {
                    _id: 1,
                    name: 1,
                },
                branch: {
                    _id: 1,
                    name: 1,
                },
                personnel: {
                    _id: '$createdBy.user._id',
                    name: {
                        en: { $concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en'] },
                        ar: { $concat: ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar'] },
                    },
                },
                position: {
                    _id: 1,
                    name: 1,
                },
            },
        });
        pipeLine.push({
            $group: {
                _id: null,
                category: { $addToSet: '$category' },
                promoType: { $addToSet: '$promoType' },
                brand: { $addToSet: '$brand' },
                country: { $addToSet: '$country' },
                region: { $addToSet: '$region' },
                subRegion: { $addToSet: '$subRegion' },
                retailSegment: { $addToSet: '$retailSegment' },
                outlet: { $addToSet: '$outlet' },
                branch: { $addToSet: '$branch' },
                position: { $addToSet: '$position' },
                personnel: { $addToSet: '$personnel' },
            },
        });
        aggregation = CompetitorPromotionModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true,
        };

        aggregation.exec((err, result) => {
            let response;

            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {
                category: result.category || [],
                brand: result.brand || [],
                promoType: result.promoType || [],
                country: result.country || [],
                region: result.region || [],
                subRegion: result.subRegion || [],
                retailSegment: result.retailSegment || [],
                outlet: result.outlet || [],
                branch: result.branch || [],
                position: result.position || [],
                personnel: result.personnel || [],
            };

            redisFilters({
                currentSelected,
                filterExists,
                filtersObject: result,
                personnelId: req.personnelModel._id,
                contentType: CONTENT_TYPES.COMPETITORPROMOTION,
            }, (err, response) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.promotionFilters = function (req, res, next) {
        const personnelId = req.personnelModel._id;
        const query = req.query;
        const queryFilter = query.filter || {};
        const filterMapper = new FilterMapper();
        const currentSelected = query.current;
        const filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        const personnel = req.personnelModel;
        const filter = filterMapper.mapFilter({
            filter: queryFilter,
            personnel,
        });
        let queryForFunction;
        let subRegionIds;

        const $defProjectionExtended = Object.assign({}, $defProjection, {
            employee: 1,
        });

        async.waterfall([
            function (waterfallCb) {
                if (!filter.branch) {
                    return waterfallCb();
                }
                const pipeLine = [];
                let aggregation;

                pipeLine.push({
                    $match: {
                        _id: filter.branch,
                    },
                });

                pipeLine.push({
                    $project: {
                        _id: 1,
                        subRegion: 1,
                        retailSegment: 1,
                        outlet: 1,
                    },
                });

                pipeLine.push({
                    $group: {
                        _id: null,
                        subRegion: { $addToSet: '$subRegion' },
                        retailSegment: { $addToSet: '$retailSegment' },
                        outlet: { $addToSet: '$outlet' },
                    },
                });

                aggregation = BranchModel.aggregate(pipeLine);

                aggregation.options = {
                    allowDiskUse: true,
                };

                aggregation.exec((err, result) => {
                    if (err) {
                        return waterfallCb(err);
                    }
                    if (result) {
                        result = result[0];
                        if (!filter.subRegion) {
                            filter.subRegion = { $in: result.subRegion };
                        }
                        if (!filter.outlet) {
                            filter.outlet = { $in: result.outlet };
                        }
                        if (!filter.retailSegment) {
                            filter.retailSegment = { $in: result.retailSegment };
                        }
                    }
                    waterfallCb();
                });
            },
            function (waterfallCb) {
                if (!filter || !filter.region) {
                    return waterfallCb(null, null);
                }
                queryForFunction = {
                    type: 'subRegion',
                    parent: filter.region,
                };
                self.getLocationIds(DomainModel, { query: queryForFunction }, (err, collection) => {
                    if (err) {
                        return waterfallCb(err);
                    }
                    subRegionIds = collection ? _.pluck(collection, '_id') : [];

                    waterfallCb(null, subRegionIds);
                });
            },

            function (collection, wCb) {
                AccessManager.getReadAccess(req, ACL_MODULES.REPORTING, (err, allowed, personnel) => {
                    if (err) {
                        return wCb(err);
                    }

                    if (!allowed) {
                        err = new Error();
                        err.status = 403;

                        return wCb(err);
                    }

                    wCb(null, personnel, collection);
                });
            },

            function (personnel, collection, waterfallCb) {
                const aggregationHelper = new AggregationHelper($defProjectionExtended, filter);
                const beforeFilter = _.pick(filter, 'type', 'status', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', '$and', '$or', 'createdBy');
                let pipeLine = [];
                let aggregation;
                const $match = {
                    $or: [],
                };

                pipeLine.push({
                    $match: beforeFilter,
                });

                if (personnel.accessRole.level === ACL_CONSTANTS.MASTER_ADMIN) {
                    $match.$or.push({
                        'createdBy.user': {
                            $ne: personnel._id,
                        },
                        status: {
                            $ne: 'draft',
                        },
                    });
                } else {
                    $match.$or.push({
                        'createdBy.user': {
                            $ne: personnel._id,
                        },
                        status: {
                            $nin: ['draft', 'expired'],
                        },
                    });
                }

                $match.$or.push({
                    'createdBy.user': personnel._id,
                });

                pipeLine.push({ $match });

                if (filter.personnel) {
                    pipeLine.push({
                        $match: {
                            'createdBy.user': filter.personnel,
                        },
                    });
                }

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'personnels',
                    key: 'createdBy.user',
                    isArray: false,
                    addProjection: ['firstName', 'lastName', 'position'],
                }));

                if (filter.position) {
                    pipeLine.push({
                        $match: {
                            'createdBy.user.position': filter.position,
                        },
                    });
                }

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'positions',
                    key: 'createdBy.user.position',
                    isArray: false,
                    includeSiblings: {
                        createdBy: {
                            user: {
                                firstName: 1,
                                lastName: 1,
                                _id: 1,
                            },
                        },
                    },
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'domains',
                    key: 'country',
                    isArray: false,
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'domains',
                    key: 'region',
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'domains',
                    key: 'subRegion',
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'categories',
                    key: 'category',
                    isArray: false,
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'branches',
                    key: 'branch',
                    addProjection: ['outlet', 'retailSegment', 'subRegion'],
                }));

                if (filter.outlet || filter.retailSegment || filter.subRegion) {
                    pipeLine.push({
                        $unwind: {
                            path: '$branch',
                            preserveNullAndEmptyArrays: true,
                        },
                    });

                    if (filter.outlet) {
                        pipeLine.push({
                            $match: {
                                $or: [
                                    {
                                        'branch.outlet': filter.outlet,
                                    },
                                    {
                                        'branch.outlet': { $exists: false },
                                    },
                                ],
                            },
                        });
                    }

                    if (filter.retailSegment) {
                        pipeLine.push({
                            $match: {
                                $or: [
                                    {
                                        'branch.retailSegment': filter.retailSegment,
                                    },
                                    {
                                        'branch.retailSegment': { $exists: false },
                                    },
                                ],
                            },
                        });
                    }

                    if (filter.subRegion) {
                        pipeLine.push({
                            $match: {
                                $or: [
                                    {
                                        'branch.subRegion': filter.subRegion,
                                    },
                                    {
                                        'branch.subRegion': { $exists: false },
                                    },
                                ],
                            },
                        });
                    }

                    pipeLine.push({
                        $group: aggregationHelper.getGroupObject({
                            branch: { $addToSet: '$branch' },
                        }),
                    });
                }

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'outlets',
                    key: 'outlet',
                    addProjection: ['retailSegments', 'subRegions'],
                }));

                if (filter.retailSegment || filter.subRegion) {
                    pipeLine.push({
                        $unwind: {
                            path: '$outlet',
                            preserveNullAndEmptyArrays: true,
                        },
                    });

                    if (filter.retailSegment) {
                        pipeLine.push({
                            $match: {
                                $or: [
                                    {
                                        'outlet.retailSegments': filter.retailSegment,
                                    },
                                    {
                                        'outlet.retailSegments': {
                                            $exists: false,
                                        },
                                    },
                                ],
                            },
                        });
                    }

                    if (filter.subRegion) {
                        pipeLine.push({
                            $match: {
                                $or: [
                                    {
                                        'outlet.subRegions': filter.subRegion,
                                    },
                                    {
                                        'outlet.subRegions': {
                                            $exists: false,
                                        },
                                    },
                                ],
                            },
                        });
                    }

                    pipeLine.push({
                        $group: aggregationHelper.getGroupObject({
                            outlet: { $addToSet: '$outlet' },
                        }),
                    });
                }

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'retailSegments',
                    key: 'retailSegment',
                    addProjection: ['subRegions'],
                }));

                if (filter.subRegion) {
                    pipeLine.push({
                        $unwind: {
                            path: '$retailSegment',
                            preserveNullAndEmptyArrays: true,
                        },
                    });

                    pipeLine.push({
                        $match: {
                            $or: [
                                {
                                    'retailSegment.subRegions': filter.subRegion,
                                },
                                {
                                    'retailSegment.subRegions': {
                                        $exists: false,
                                    },
                                },
                            ],
                        },
                    });

                    pipeLine.push({
                        $group: aggregationHelper.getGroupObject({
                            retailSegment: { $addToSet: '$retailSegment' },
                        }),
                    });
                }

                pipeLine.push({
                    $project: aggregationHelper.getProjection({
                        type: {
                            _id: '$type',
                            name: {
                                en: '$type',
                            },
                        },

                        status: {
                            _id: '$status',
                            name: {
                                en: '$status',
                            },
                        },

                        position: '$createdBy.user.position',
                        employee: '$createdBy.user',
                    }),
                });

                pipeLine.push({
                    $project: aggregationHelper.getProjection({
                        employee: {
                            _id: '$employee._id',
                            name: {
                                en: { $concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en'] },
                                ar: { $concat: ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar'] },
                            },
                        },
                    }),
                });

                pipeLine.push({
                    $group: {
                        _id: null,
                        country: { $addToSet: '$country' },
                        region: { $addToSet: '$region' },
                        subRegion: { $addToSet: '$subRegion' },
                        retailSegment: { $addToSet: '$retailSegment' },
                        outlet: { $addToSet: '$outlet' },
                        branch: { $addToSet: '$branch' },
                        type: { $addToSet: '$type' },
                        status: { $addToSet: '$status' },
                        category: { $addToSet: '$category' },
                        position: { $addToSet: '$position' },
                        employee: { $addToSet: '$employee' },
                    },
                });

                aggregation = PromotionModel.aggregate(pipeLine);

                aggregation.options = {
                    allowDiskUse: true,
                };

                aggregation.exec((err, result) => {
                    if (err) {
                        return waterfallCb(err);
                    }

                    result = result[0] || {};

                    result = {
                        country: result.country || [],
                        category: result.category || [],
                        position: result.position || [],
                        region: result.region && _.uniq(_.flatten(result.region)) || [],
                        subRegion: result.subRegion && _.uniq(_.flatten(result.subRegion)) || [],
                        retailSegment: result.retailSegment && _.uniq(_.flatten(result.retailSegment)) || [],
                        outlet: result.outlet && _.uniq(_.flatten(result.outlet)) || [],
                        branch: result.branch && _.uniq(_.flatten(result.branch)) || [],
                        personnel: result.employee && _.uniq(_.flatten(result.employee)) || [],
                        type: result.type || [],
                        status: result.status || [],
                    };

                    Object.keys(result).forEach((key) => {
                        if (result[key]) {
                            const condition = subRegionIds && key === 'subRegion';
                            let i = result[key].length - 1;
                            subRegionIds = condition ? subRegionIds.fromObjectID() : subRegionIds;
                            for (i; i >= 0; i--) {
                                if (!result[key][i] || !result[key][i].name || (condition && subRegionIds.indexOf(result[key][i]._id.toString()) === -1)) {
                                    result[key].splice(i, 1);
                                }
                            }
                        }
                    });

                    waterfallCb(null, result);
                });
            }],
            (err, result) => {
                if (err) {
                    return next(err);
                }

                redisFilters({
                    currentSelected,
                    filterExists,
                    filtersObject: result,
                    personnelId: req.personnelModel._id,
                    contentType: CONTENT_TYPES.PROMOTIONS,
                }, (err, response) => {
                    if (err) {
                        return next(err);
                    }

                    res.status(200).send(response);
                });
            });
    };

    this.promotionLocationFilters = function (req, res, next) {
        const query = req.query;
        const queryFilter = query.filter || {};
        const currentSelected = query.current;
        const filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        const edit = query.edit;
        let countryFromFilter;
        let regionFromFilter;
        let subRegionFromFilter;
        const filterMapper = new FilterMapper();
        let filter = filterMapper.mapFilter({
            filter: queryFilter,
            personnel: req.personnelModel,
        });
        if (edit) {
            countryFromFilter = filter.country;
            regionFromFilter = filter.region;
            subRegionFromFilter = filter.subRegion;
            filter = {};
        }
        const keys = Object.keys(filter);
        let queryForFunction;
        const result = {};
        const personnel = req.personnelModel;
        async.waterfall([
            function (waterfallCb) {
                queryForFunction = personnel.country.length ? {
                    type: 'country',
                    _id: { $in: personnel.country.objectID() },
                } : { type: 'country' };
                if (_.indexOf(keys, 'country') !== -1) {
                    queryForFunction._id = filter.country;
                }

                self.getLocationIds(DomainModel, { query: queryForFunction }, (err, collection) => {
                    if (err) {
                        return waterfallCb(err);
                    }
                    result.country = collection;

                    waterfallCb(null, collection);
                });
            },
            function (collection, waterfallCb) {
                queryForFunction = {
                    type: 'region',
                    parent: countryFromFilter ? countryFromFilter : { $in: _.pluck(collection, '_id') },
                };
                if (_.indexOf(keys, 'region') !== -1) {
                    delete queryForFunction.parent;
                    queryForFunction._id = filter.region;
                }
                self.getLocationIds(DomainModel, { query: queryForFunction }, (err, collection) => {
                    if (err) {
                        return waterfallCb(err);
                    }
                    result.region = collection;

                    waterfallCb(null, collection);
                });
            },
            function (collection, waterfallCb) {
                queryForFunction = {
                    type: 'subRegion',
                    parent: regionFromFilter ? regionFromFilter : { $in: _.pluck(collection, '_id') },
                };
                if (_.indexOf(keys, 'subRegion') !== -1) {
                    delete queryForFunction.parent;
                    queryForFunction._id = filter.subRegion;
                }
                self.getLocationIds(DomainModel, { query: queryForFunction }, (err, collection) => {
                    if (err) {
                        return waterfallCb(err);
                    }
                    result.subRegion = collection;

                    waterfallCb(null, collection);
                });
            },
            function (collection, waterfallCb) {
                const addProjection = {
                    retailSegment: 1,
                    outlet: 1,
                };
                const customQuery = { subRegion: subRegionFromFilter ? subRegionFromFilter : { $in: _.pluck(collection, '_id') } };

                if (personnel.branch.length) {
                    customQuery._id = {
                        $in: personnel.branch,
                    };
                }

                if (_.indexOf(keys, 'branch') !== -1) {
                    customQuery._id = filter.branch;
                } else {
                    if (_.indexOf(keys, 'retailSegment') !== -1) {
                        delete queryForFunction._id;
                        customQuery.retailSegment = filter.retailSegment;
                    }
                    if (_.indexOf(keys, 'outlet') !== -1) {
                        delete queryForFunction._id;
                        customQuery.outlet = filter.outlet;
                    }
                }
                self.getLocationIds(BranchModel, {
                    addProjection,
                    query: customQuery,
                }, (err, collection) => {
                    if (err) {
                        return waterfallCb(err);
                    }
                    _.extend(result, collection[0]);
                    waterfallCb(null, result);
                });
            },

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });
    };

    this.achievementFormFilters = function (req, res, next) {
        const query = req.query;
        const queryFilter = query.filter || {};

        const filterMapper = new FilterMapper();

        const currentSelected = query.current;
        const filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        const filter = filterMapper.mapFilter({
            filter: queryFilter,
            personnel: req.personnelModel,
        });
        const beforeFilter = _.pick(filter, 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', '$and', '$or');
        const employeeFilter = filter.personnel ? { 'createdBy.user': _.pick(filter, 'personnel').personnel } : {};
        const afterFilter = _.pick(filter, 'position');
        let aggregation;
        let pipeLine = [];
        pipeLine.push({
            $match: beforeFilter,
        });

        pipeLine.push({
            $match: employeeFilter,
        });

        pipeLine.push({
            $lookup: {
                from: 'domains',
                localField: 'country',
                foreignField: '_id',
                as: 'country',
            },
        });

        pipeLine.push({
            $lookup: {
                from: 'domains',
                localField: 'region',
                foreignField: '_id',
                as: 'region',
            },
        });

        pipeLine.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegion',
                foreignField: '_id',
                as: 'subRegion',
            },
        });

        pipeLine.push({
            $lookup: {
                from: 'retailSegments',
                localField: 'retailSegment',
                foreignField: '_id',
                as: 'retailSegment',
            },
        });

        pipeLine.push({
            $lookup: {
                from: 'outlets',
                localField: 'outlet',
                foreignField: '_id',
                as: 'outlet',
            },
        });

        pipeLine.push({
            $lookup: {
                from: 'branches',
                localField: 'branch',
                foreignField: '_id',
                as: 'branch',
            },
        });

        pipeLine.push({
            $lookup: {
                from: 'personnels',
                localField: 'createdBy.user',
                foreignField: '_id',
                as: 'createdBy.user',
            },
        });

        pipeLine.push({
            $project: {
                country: { $arrayElemAt: ['$country', 0] },
                region: { $arrayElemAt: ['$region', 0] },
                subRegion: { $arrayElemAt: ['$subRegion', 0] },
                retailSegment: { $arrayElemAt: ['$retailSegment', 0] },
                outlet: { $arrayElemAt: ['$outlet', 0] },
                branch: { $arrayElemAt: ['$branch', 0] },
                createdBy: {
                    user: { $arrayElemAt: ['$createdBy.user', 0] },
                },
            },
        });

        pipeLine = _.union(pipeLine, domainPileLine({
            filter,
        }));

        pipeLine.push({
            $project: {
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                createdBy: 1,
                position: '$createdBy.user.position',
            },
        });

        pipeLine.push({
            $match: afterFilter,
        });

        pipeLine.push({
            $lookup: {
                from: 'positions',
                localField: 'position',
                foreignField: '_id',
                as: 'position',
            },
        });

        pipeLine.push({
            $project: {
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                createdBy: 1,
                position: { $arrayElemAt: ['$position', 0] },
            },
        });

        pipeLine.push({
            $project: {
                country: {
                    _id: 1,
                    name: 1,
                },
                region: {
                    _id: 1,
                    name: 1,
                },
                subRegion: {
                    _id: 1,
                    name: 1,
                },
                retailSegment: {
                    _id: 1,
                    name: 1,
                },
                outlet: {
                    _id: 1,
                    name: 1,
                },
                branch: {
                    _id: 1,
                    name: 1,
                },
                personnel: {
                    _id: '$createdBy.user._id',
                    name: {
                        en: { $concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en'] },
                        ar: { $concat: ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar'] },
                    },
                },
                position: {
                    _id: 1,
                    name: 1,
                },
            },
        });

        pipeLine.push({
            $group: {
                _id: null,
                country: { $addToSet: '$country' },
                region: { $addToSet: '$region' },
                subRegion: { $addToSet: '$subRegion' },
                retailSegment: { $addToSet: '$retailSegment' },
                outlet: { $addToSet: '$outlet' },
                branch: { $addToSet: '$branch' },
                position: { $addToSet: '$position' },
                personnel: { $addToSet: '$personnel' },
            },
        });

        aggregation = CompetitorBrandingModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true,
        };

        aggregation.exec((err, result) => {
            let response;

            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {
                country: result.country || [],
                region: result.region || [],
                subRegion: result.subRegion || [],
                retailSegment: result.retailSegment || [],
                outlet: result.outlet || [],
                branch: result.branch || [],
                position: result.position || [],
                personnel: result.personnel || [],
            };

            redisFilters({
                currentSelected,
                filterExists,
                filtersObject: result,
                personnelId: req.personnelModel._id,
                contentType: CONTENT_TYPES.ACHIEVEMENTFORM,
            }, (err, response) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.newProductLaunchFilters = function (req, res, next) {
        const query = req.query;
        const queryFilter = query.filter || {};

        const filterMapper = new FilterMapper();

        const currentSelected = query.current;
        const filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        const filter = filterMapper.mapFilter({
            filter: queryFilter,
            personnel: req.personnelModel,
        });
        const beforeFilter = _.pick(filter, 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', '$and', '$or');
        const employeeFilter = filter.personnel ? { 'createdBy.user': _.pick(filter, 'personnel').personnel } : {};
        const afterFilter = _.pick(filter, 'position');
        let aggregation;
        let pipeLine = [];
        pipeLine.push({
            $match: beforeFilter,
        });
        pipeLine.push({
            $match: employeeFilter,
        });
        pipeLine.push({
            $lookup: {
                from: 'domains',
                localField: 'country',
                foreignField: '_id',
                as: 'country',
            },
        });
        pipeLine.push({
            $lookup: {
                from: 'domains',
                localField: 'region',
                foreignField: '_id',
                as: 'region',
            },
        });
        pipeLine.push({
            $lookup: {
                from: 'domains',
                localField: 'subRegion',
                foreignField: '_id',
                as: 'subRegion',
            },
        });
        pipeLine.push({
            $lookup: {
                from: 'retailSegments',
                localField: 'retailSegment',
                foreignField: '_id',
                as: 'retailSegment',
            },
        });
        pipeLine.push({
            $lookup: {
                from: 'outlets',
                localField: 'outlet',
                foreignField: '_id',
                as: 'outlet',
            },
        });
        pipeLine.push({
            $lookup: {
                from: 'branches',
                localField: 'branch',
                foreignField: '_id',
                as: 'branch',
            },
        });
        pipeLine.push({
            $lookup: {
                from: 'personnels',
                localField: 'createdBy.user',
                foreignField: '_id',
                as: 'createdBy.user',
            },
        });
        pipeLine.push({
            $project: {
                country: { $arrayElemAt: ['$country', 0] },
                region: { $arrayElemAt: ['$region', 0] },
                subRegion: { $arrayElemAt: ['$subRegion', 0] },
                retailSegment: { $arrayElemAt: ['$retailSegment', 0] },
                outlet: { $arrayElemAt: ['$outlet', 0] },
                branch: { $arrayElemAt: ['$branch', 0] },
                createdBy: {
                    user: { $arrayElemAt: ['$createdBy.user', 0] },
                },
            },
        });
        pipeLine = _.union(pipeLine, domainPileLine({
            filter,
        }));
        pipeLine.push({
            $project: {
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                createdBy: 1,
                position: '$createdBy.user.position',
            },
        });
        pipeLine.push({
            $match: afterFilter,
        });
        pipeLine.push({
            $lookup: {
                from: 'positions',
                localField: 'position',
                foreignField: '_id',
                as: 'position',
            },
        });
        pipeLine.push({
            $project: {
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                createdBy: 1,
                position: { $arrayElemAt: ['$position', 0] },
            },
        });
        pipeLine.push({
            $project: {
                country: {
                    _id: 1,
                    name: 1,
                },
                region: {
                    _id: 1,
                    name: 1,
                },
                subRegion: {
                    _id: 1,
                    name: 1,
                },
                retailSegment: {
                    _id: 1,
                    name: 1,
                },
                outlet: {
                    _id: 1,
                    name: 1,
                },
                branch: {
                    _id: 1,
                    name: 1,
                },
                personnel: {
                    _id: '$createdBy.user._id',
                    name: {
                        en: { $concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en'] },
                        ar: { $concat: ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar'] },
                    },
                },
                position: {
                    _id: 1,
                    name: 1,
                },
            },
        });
        pipeLine.push({
            $group: {
                _id: null,
                country: { $addToSet: '$country' },
                region: { $addToSet: '$region' },
                subRegion: { $addToSet: '$subRegion' },
                retailSegment: { $addToSet: '$retailSegment' },
                outlet: { $addToSet: '$outlet' },
                branch: { $addToSet: '$branch' },
                position: { $addToSet: '$position' },
                personnel: { $addToSet: '$personnel' },
            },
        });
        aggregation = NewProductLaunchModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true,
        };

        aggregation.exec((err, result) => {
            let response;

            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {
                country: result.country || [],
                region: result.region || [],
                subRegion: result.subRegion || [],
                retailSegment: result.retailSegment || [],
                outlet: result.outlet || [],
                branch: result.branch || [],
                position: result.position || [],
                personnel: result.personnel || [],
            };

            redisFilters({
                currentSelected,
                filterExists,
                filtersObject: result,
                personnelId: req.personnelModel._id,
                contentType: CONTENT_TYPES.NEWPRODUCTLAUNCH,
            }, (err, response) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.getLocationIds = function (model, options, cb) {
        const aggregationHelper = new AggregationHelper($defProjection);
        const query = _.extend(options.query, { archived: false });
        const addProjection = options.addProjection || null;
        const defProjection = addProjection ? _.extend({
            _id: 1,
            name: 1,
        }, addProjection) : {
            _id: 1,
            name: 1,
        };
        let pipLine = [];
        let aggregation;

        pipLine.push({
            $match: query,
        });

        pipLine.push({
            $project: defProjection,
        });

        if (!query.type) {
            pipLine = _.union(pipLine, aggregationHelper.aggregationPartMaker({
                from: 'retailSegments',
                key: 'retailSegment',
                isArray: false,
            }));

            pipLine = _.union(pipLine, aggregationHelper.aggregationPartMaker({
                from: 'outlets',
                key: 'outlet',
                isArray: false,
            }));

            pipLine.push({
                $group: {
                    _id: null,
                    branch: {
                        $addToSet: {
                            _id: '$_id',
                            name: '$name',
                        },
                    },
                    retailSegment: { $addToSet: '$retailSegment' },
                    outlet: { $addToSet: '$outlet' },
                },
            });
        }

        aggregation = model.aggregate(pipLine);

        aggregation.options = {
            allowDiskUse: true,
        };

        aggregation.exec((err, result) => {
            if (err) {
                return cb(err);
            }
            return cb(null, result);
        });
    };

    this.contractsYearlyLocationFilters = function (req, res, next) {
        const query = req.query;
        const edit = query.edit;
        let countryFromFilter;
        let regionFromFilter;
        let subRegionFromFilter;
        const personnel = req.personnelModel;
        const filterMapper = new FilterMapper();
        let filter = filterMapper.mapFilter({
            filter: query.filter,
            personnel,
        });
        if (edit) {
            countryFromFilter = filter.country;
            regionFromFilter = filter.region;
            subRegionFromFilter = filter.subRegion;
            filter = {};
        }
        const keys = Object.keys(filter);
        let queryForFunction;
        const result = {};
        async.waterfall([
            function (waterfallCb) {
                queryForFunction = personnel.country.length ? {
                    type: 'country',
                    _id: { $in: personnel.country.objectID() },
                } : { type: 'country' };
                if (_.indexOf(keys, 'country') !== -1) {
                    queryForFunction._id = filter.country;
                }

                self.getLocationIds(DomainModel, { query: queryForFunction }, (err, collection) => {
                    if (err) {
                        return waterfallCb(err);
                    }
                    result.country = collection;

                    waterfallCb(null, collection);
                });
            },
            function (collection, waterfallCb) {
                queryForFunction = {
                    type: 'region',
                    parent: countryFromFilter ? countryFromFilter : { $in: _.pluck(collection, '_id') },
                };
                if (_.indexOf(keys, 'region') !== -1) {
                    delete queryForFunction.parent;
                    queryForFunction._id = filter.region;
                }
                self.getLocationIds(DomainModel, { query: queryForFunction }, (err, collection) => {
                    if (err) {
                        return waterfallCb(err);
                    }
                    result.region = collection;

                    waterfallCb(null, collection);
                });
            },
            function (collection, waterfallCb) {
                queryForFunction = {
                    type: 'subRegion',
                    parent: regionFromFilter ? regionFromFilter : { $in: _.pluck(collection, '_id') },
                };
                if (_.indexOf(keys, 'subRegion') !== -1) {
                    delete queryForFunction.parent;
                    queryForFunction._id = filter.subRegion;
                }
                self.getLocationIds(DomainModel, { query: queryForFunction }, (err, collection) => {
                    if (err) {
                        return waterfallCb(err);
                    }
                    result.subRegion = collection;

                    waterfallCb(null, collection);
                });
            },
            function (collection, waterfallCb) {
                const addProjection = {
                    retailSegment: 1,
                    outlet: 1,
                };
                const customQuery = { subRegion: subRegionFromFilter ? subRegionFromFilter : { $in: _.pluck(collection, '_id') } };

                if (personnel.branch.length) {
                    customQuery._id = { $in: personnel.branch };
                }

                queryForFunction = customQuery;

                if (_.indexOf(keys, 'branch') !== -1) {
                    queryForFunction._id = filter.branch;
                } else {
                    if (_.indexOf(keys, 'retailSegment') !== -1) {
                        delete queryForFunction._id;
                        queryForFunction.retailSegment = filter.retailSegment;
                    }
                    if (_.indexOf(keys, 'outlet') !== -1) {
                        delete queryForFunction._id;
                        queryForFunction.outlet = filter.outlet;
                    }
                }

                self.getLocationIds(BranchModel, {
                    addProjection,
                    query: queryForFunction,
                }, (err, collection) => {
                    if (err) {
                        return waterfallCb(err);
                    }
                    _.extend(result, collection[0]);
                    waterfallCb(null, result);
                });
            },
        ], (err, result) => {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.contractsYearlyFilters = function (req, res, next) {
        const query = req.query;
        const queryFilter = query.filter || {};
        const filterMapper = new FilterMapper();
        const currentSelected = query.current;
        const filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        const filter = filterMapper.mapFilter({
            filter: queryFilter,
            personnel: req.personnelModel,
        });
        let queryForFunction;
        let subRegionIds;
        if (req.session.level === 4) {
            filter.type = 'visibility';
        }

        async.waterfall([
            function (waterfallCb) {
                if (!filter || !filter.region) {
                    return waterfallCb(null, null);
                }
                queryForFunction = {
                    type: 'subRegion',
                    parent: filter.region,
                };
                self.getLocationIds(DomainModel, { query: queryForFunction }, (err, collection) => {
                    if (err) {
                        return waterfallCb(err);
                    }
                    subRegionIds = collection ? _.pluck(collection, '_id') : [];

                    waterfallCb(null, subRegionIds);
                });
            },
            function (collection, waterfallCb) {
                const aggregationHelper = new AggregationHelper($defProjection, filter);
                const beforeFilter = _.pick(filter, 'type', 'status', '$and', '$or', 'createdBy');
                let pipeLine = [];
                let aggregation;

                pipeLine.push({
                    $match: beforeFilter,
                });

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'domains',
                    key: 'country',
                    as: 'country',
                    isArray: false,
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'domains',
                    key: 'region',
                    as: 'region',
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'domains',
                    key: 'subRegion',
                    as: 'subRegion',
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'retailSegments',
                    key: 'retailSegment',
                    as: 'retailSegment',
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'outlets',
                    key: 'outlet',
                    as: 'outlet',
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'branches',
                    key: 'branch',
                    as: 'branch',
                }));

                pipeLine.push({
                    $project: {
                        country: 1,
                        region: 1,
                        subRegion: 1,
                        retailSegment: 1,
                        outlet: 1,
                        branch: 1,
                        type: {
                            _id: '$type',
                            name: {
                                en: '$type',
                            },
                        },
                        status: {
                            _id: '$status',
                            name: {
                                en: '$status',
                            },
                        },
                    },
                });

                pipeLine.push({
                    $group: {
                        _id: null,
                        country: { $addToSet: '$country' },
                        region: { $addToSet: '$region' },
                        subRegion: { $addToSet: '$subRegion' },
                        retailSegment: { $addToSet: '$retailSegment' },
                        outlet: { $addToSet: '$outlet' },
                        branch: { $addToSet: '$branch' },
                        type: { $addToSet: '$type' },
                        status: { $addToSet: '$status' },
                    },
                });

                aggregation = ContractsYearlyModel.aggregate(pipeLine);

                aggregation.options = {
                    allowDiskUse: true,
                };

                aggregation.exec((err, result) => {
                    if (err) {
                        return waterfallCb(err);
                    }

                    result = result[0] || {};

                    result = {
                        country: result.country || [],
                        region: result.region && _.uniq(_.flatten(result.region)) || [],
                        subRegion: result.subRegion && _.uniq(_.flatten(result.subRegion)) || [],
                        retailSegment: result.retailSegment && _.uniq(_.flatten(result.retailSegment)) || [],
                        outlet: result.outlet && _.uniq(_.flatten(result.outlet)) || [],
                        branch: result.branch && _.uniq(_.flatten(result.branch)) || [],
                        contractType: result.type || [],
                        status: result.status || [],
                    };

                    Object.keys(result).forEach((key) => {
                        if (result[key]) {
                            const condition = subRegionIds && key === 'subRegion';
                            let i = result[key].length - 1;
                            subRegionIds = condition ? subRegionIds.fromObjectID() : subRegionIds;
                            for (i; i >= 0; i--) {
                                if (!result[key][i] || !result[key][i].name || (condition && subRegionIds.indexOf(result[key][i]._id.toString()) === -1)) {
                                    result[key].splice(i, 1);
                                }
                            }
                        }
                    });

                    waterfallCb(null, result);
                });
            }],
            (err, result) => {
                if (err) {
                    return next(err);
                }

                redisFilters({
                    currentSelected,
                    filterExists,
                    filtersObject: result,
                    personnelId: req.personnelModel._id,
                    contentType: CONTENT_TYPES.CONTRACTSYEARLY,
                }, (err, response) => {
                    if (err) {
                        return next(err);
                    }

                    res.status(200).send(response);
                });
            });
    };

    this.contractsSecondaryLocationFilters = function (req, res, next) {
        const query = req.query;
        const edit = query.edit;
        let countryFromFilter;
        let regionFromFilter;
        let subRegionFromFilter;
        const filterMapper = new FilterMapper();
        let filter = filterMapper.mapFilter({
            filter: query.filter,
            personnel: req.personnelModel,
        });
        if (edit) {
            countryFromFilter = filter.country;
            regionFromFilter = filter.region;
            subRegionFromFilter = filter.subRegion;
            filter = {};
        }
        const keys = Object.keys(filter);
        let queryForFunction;
        const result = {};
        const personnel = req.personnelModel;
        async.waterfall([
            function (waterfallCb) {
                queryForFunction = personnel.country.length ? {
                    type: 'country',
                    _id: { $in: personnel.country.objectID() },
                } : { type: 'country' };
                if (_.indexOf(keys, 'country') !== -1) {
                    queryForFunction._id = filter.country;
                }

                self.getLocationIds(DomainModel, { query: queryForFunction }, (err, collection) => {
                    if (err) {
                        return waterfallCb(err);
                    }
                    result.country = collection;

                    waterfallCb(null, collection);
                });
            },
            function (collection, waterfallCb) {
                queryForFunction = {
                    type: 'region',
                    parent: countryFromFilter ? countryFromFilter : { $in: _.pluck(collection, '_id') },
                };
                if (_.indexOf(keys, 'region') !== -1) {
                    delete queryForFunction.parent;
                    queryForFunction._id = filter.region;
                }
                self.getLocationIds(DomainModel, { query: queryForFunction }, (err, collection) => {
                    if (err) {
                        return waterfallCb(err);
                    }
                    result.region = collection;

                    waterfallCb(null, collection);
                });
            },
            function (collection, waterfallCb) {
                queryForFunction = {
                    type: 'subRegion',
                    parent: regionFromFilter ? regionFromFilter : { $in: _.pluck(collection, '_id') },
                };
                if (_.indexOf(keys, 'subRegion') !== -1) {
                    delete queryForFunction.parent;
                    queryForFunction._id = filter.subRegion;
                }
                self.getLocationIds(DomainModel, { query: queryForFunction }, (err, collection) => {
                    if (err) {
                        return waterfallCb(err);
                    }
                    result.subRegion = collection;

                    waterfallCb(null, collection);
                });
            },
            function (collection, waterfallCb) {
                const addProjection = {
                    retailSegment: 1,
                    outlet: 1,
                };
                const customQuery = { subRegion: subRegionFromFilter ? subRegionFromFilter : { $in: _.pluck(collection, '_id') } };

                if (personnel.branch.length) {
                    customQuery._id = { $in: personnel.branch };
                }

                queryForFunction = customQuery;

                if (_.indexOf(keys, 'branch') !== -1) {
                    queryForFunction._id = filter.branch;
                } else {
                    if (_.indexOf(keys, 'retailSegment') !== -1) {
                        delete queryForFunction._id;
                        queryForFunction.retailSegment = filter.retailSegment;
                    }
                    if (_.indexOf(keys, 'outlet') !== -1) {
                        delete queryForFunction._id;
                        queryForFunction.outlet = filter.outlet;
                    }
                }
                self.getLocationIds(BranchModel, {
                    addProjection,
                    query: queryForFunction,
                }, (err, collection) => {
                    if (err) {
                        return waterfallCb(err);
                    }
                    _.extend(result, collection[0]);
                    waterfallCb(null, result);
                });
            },

        ], (err, result) => {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.contractsSecondaryFilters = function (req, res, next) {
        const query = req.query;
        const queryFilter = query.filter || {};

        const filterMapper = new FilterMapper();

        const currentSelected = query.current;
        const filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        const filter = filterMapper.mapFilter({
            filter: queryFilter,
            personnel: req.personnelModel,
        });

        const aggregationHelper = new AggregationHelper($defProjection, filter);
        let queryForFunction;
        let subRegionIds;

        async.waterfall([
            function (waterfallCb) {
                if (!filter || !filter.region) {
                    return waterfallCb(null, null);
                }
                queryForFunction = {
                    type: 'subRegion',
                    parent: filter.region,
                };
                self.getLocationIds(DomainModel, { query: queryForFunction }, (err, collection) => {
                    if (err) {
                        return waterfallCb(err);
                    }
                    subRegionIds = collection ? _.pluck(collection, '_id') : [];

                    waterfallCb(null, subRegionIds);
                });
            },
            function (collection, waterfallCb) {
                const beforeFilter = _.pick(filter, 'type', 'status', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', '$and', '$or', 'createdBy');
                let pipeLine = [];
                let aggregation;

                pipeLine.push({
                    $match: beforeFilter,
                });

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'domains',
                    key: 'country',
                    as: 'country',
                    isArray: false,
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'categories',
                    key: 'category',
                    as: 'category',
                    isArray: false,
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'domains',
                    key: 'region',
                    as: 'region',
                    isArray: true,
                    addProjection: ['parent'],
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'domains',
                    key: 'subRegion',
                    as: 'subRegion',
                    isArray: true,
                    addProjection: ['parent'],
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'retailSegments',
                    key: 'retailSegment',
                    as: 'retailSegment',
                    isArray: true,
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'outlets',
                    key: 'outlet',
                    as: 'outlet',
                    isArray: true,
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'branches',
                    key: 'branch',
                    as: 'branch',
                    isArray: true,
                }));

                pipeLine.push({
                    $project: {
                        country: 1,
                        category: 1,
                        region: 1,
                        subRegion: 1,
                        retailSegment: 1,
                        outlet: 1,
                        branch: 1,
                        type: {
                            _id: '$type',
                            name: {
                                en: '$type',
                            },
                        },
                        status: {
                            _id: '$status',
                            name: {
                                en: '$status',
                            },
                        },
                    },
                });

                pipeLine.push({
                    $group: {
                        _id: null,
                        country: { $addToSet: '$country' },
                        region: { $addToSet: '$region' },
                        subRegion: { $addToSet: '$subRegion' },
                        retailSegment: { $addToSet: '$retailSegment' },
                        outlet: { $addToSet: '$outlet' },
                        branch: { $addToSet: '$branch' },
                        type: { $addToSet: '$type' },
                        category: { $addToSet: '$category' },
                        status: { $addToSet: '$status' },
                    },
                });

                aggregation = ContractsSecondaryModel.aggregate(pipeLine);

                aggregation.options = {
                    allowDiskUse: true,
                };

                aggregation.exec((err, result) => {
                    if (err) {
                        return waterfallCb(err);
                    }

                    result = result[0] || {};

                    result = {
                        country: result.country || [],
                        category: result.category || [],
                        region: result.region && _.uniq(_.flatten(result.region)) || [],
                        subRegion: result.subRegion && _.uniq(_.flatten(result.subRegion)) || [],
                        retailSegment: result.retailSegment && _.uniq(_.flatten(result.retailSegment)) || [],
                        outlet: result.outlet && _.uniq(_.flatten(result.outlet)) || [],
                        branch: result.branch && _.uniq(_.flatten(result.branch)) || [],
                        contractType: result.type || [],
                        status: result.status || [],
                    };

                    Object.keys(result).forEach((key) => {
                        if (result[key]) {
                            const condition = subRegionIds && key === 'subRegion';
                            let i = result[key].length - 1;

                            subRegionIds = condition ? subRegionIds.fromObjectID() : subRegionIds;
                            for (i; i >= 0; i--) {
                                if (!result[key][i] || !result[key][i].name || (condition && subRegionIds.indexOf(result[key][i]._id.toString()) === -1)) {
                                    result[key].splice(i, 1);
                                }
                            }
                        }
                    });

                    waterfallCb(null, result);
                });
            },
        ], (err, result) => {
            if (err) {
                return next(err);
            }

            redisFilters({
                currentSelected,
                filterExists,
                filtersObject: result,
                personnelId: req.personnelModel._id,
                contentType: CONTENT_TYPES.CONTRACTSSECONDARY,
            }, (err, response) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.documentsFilters = function (req, res, next) {
        const query = req.query;
        const queryFilter = query.filter || {};

        const filterMapper = new FilterMapper();

        const currentSelected = query.current;
        const filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        const filter = filterMapper.mapFilter({
            filter: queryFilter,
            personnel: req.personnelModel,
        });
        const beforeFilter = _.pick(filter, 'archived');

        const aggregation = DocumentModel.aggregate([
            {
                $project: {
                    archived: 1,
                },
            },
            {
                $match: beforeFilter,
            },
        ]);

        aggregation.options = {
            allowDiskUse: true,
        };

        aggregation.exec((err, result) => {
            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {};

            redisFilters({
                currentSelected,
                filterExists,
                filtersObject: result,
                personnelId: req.personnelModel._id,
                contentType: CONTENT_TYPES.DOCUMENTS,
            }, (err, response) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.notesFilters = function (req, res, next) {
        const query = req.query;
        const queryFilter = query.filter || {};

        const filterMapper = new FilterMapper();

        const filter = filterMapper.mapFilter({
            filter: queryFilter,
            personnel: req.personnelModel,
        });
        const beforeFilter = _.pick(filter, 'archived');

        const aggregation = NoteModel.aggregate([
            {
                $project: {
                    archived: 1,
                },
            },
            {
                $match: beforeFilter,
            },
        ]);

        aggregation.options = {
            allowDiskUse: true,
        };

        aggregation.exec((err, result) => {
            if (err) {
                return next(err);
            }

            result = result[0] || {};

            const response = {};

            res.status(200).send(response);
        });
    };

    this.contactUsFilters = function (req, res, next) {
        const query = req.query;
        const queryFilter = query.filter || {};
        const filterMapper = new FilterMapper();
        const currentSelected = query.current;
        const filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        const filter = filterMapper.mapFilter({
            filter: queryFilter,
            personnel: req.personnelModel,
        });
        const pipeLine = [];
        let aggregation;
        const TYPES = [
            {
                _id: 'Application Related Issue',
                name: {
                    en: 'Application Related Issue',
                    ar: '',
                },
            }, {
                _id: 'Future Application Ideas',
                name: {
                    en: 'Future Application Ideas',
                    ar: '',
                },
            }, {
                _id: 'Sales Feedback',
                name: {
                    en: 'Sales Feedback',
                    ar: '',
                },
            }, {
                _id: 'Trade Feedback',
                name: {
                    en: 'Trade Feedback',
                    ar: '',
                },
            }, {
                _id: 'Consumers Feedback',
                name: {
                    en: 'Consumers Feedback',
                    ar: '',
                },
            }, {
                _id: 'Others',
                name: {
                    en: 'Others',
                    ar: '',
                },
            },
        ];
        const STATUSES = [
            {
                _id: 'new',
                name: {
                    en: 'new',
                    ar: '',
                },
            },
            {
                _id: 'resolved',
                name: {
                    en: 'resolved',
                    ar: '',
                },
            },
        ];

        if (filter.personnel) {
            pipeLine.push({
                $match: {
                    createdBy: filter.personnel,
                },
            });
        }

        pipeLine.push({
            $lookup: {
                from: 'personnels',
                localField: 'createdBy',
                foreignField: '_id',
                as: 'createdBy',
            },
        }, {
            $unwind: {
                path: '$createdBy',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $unwind: {
                path: '$createdBy.country',
                preserveNullAndEmptyArrays: true,
            },
        });

        if (filter.position) {
            pipeLine.push({
                $match: {
                    'createdBy.position': filter.position,
                },
            });
        }

        if (filter.country) {
            pipeLine.push({
                $match: {
                    'createdBy.country': filter.country,
                },
            });
        }

        pipeLine.push({
            $lookup: {
                from: 'domains',
                localField: 'createdBy.country',
                foreignField: '_id',
                as: 'country',
            },
        }, {
            $unwind: {
                path: '$country',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeLine.push({
            $lookup: {
                from: 'positions',
                localField: 'createdBy.position',
                foreignField: '_id',
                as: 'position',
            },
        }, {
            $unwind: {
                path: '$position',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $project: {
                country: {
                    _id: 1,
                    name: 1,
                },
                position: {
                    _id: 1,
                    name: 1,
                },
                personnel: {
                    _id: '$createdBy._id',
                    name: {
                        en: { $concat: ['$createdBy.firstName.en', ' ', '$createdBy.lastName.en'] },
                        ar: { $concat: ['$createdBy.firstName.ar', ' ', '$createdBy.lastName.ar'] },
                    },
                },
            },
        });

        pipeLine.push({
            $group: {
                _id: null,
                country: { $addToSet: '$country' },
                position: { $addToSet: '$position' },
                personnel: { $addToSet: '$personnel' },
            },
        });

        aggregation = ContactUsModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true,
        };

        aggregation.exec((err, result) => {
            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {
                country: result.country || [],
                type: TYPES,
                status: STATUSES,
                position: result.position || [],
                personnel: result.personnel || [],
            };

            redisFilters({
                currentSelected,
                filterExists,
                filtersObject: result,
                personnelId: req.personnelModel._id,
                contentType: CONTENT_TYPES.CONTACT_US,
            }, (err, response) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.brandingAndDisplayFilters = function (req, res, next) {
        const query = req.query;
        const queryFilter = query.filter || {};
        const globalSearch = queryFilter.globalSearch;
        const currentUser = req.personnelModel;
        const $matchPersonnel = {
            $and: [],
        };

        const filter = {};
        const isObjectId = (filter) => {
            return filter.type === 'ObjectId';
        };

        if (queryFilter.category && isObjectId(queryFilter.category)) {
            filter.setCategory = queryFilter.category.values.map(id => ObjectId(id));
        }

        if (queryFilter.country && isObjectId(queryFilter.country)) {
            filter.setCountry = queryFilter.country.values.map(id => ObjectId(id));
        }

        if (queryFilter.region && isObjectId(queryFilter.region)) {
            filter.setRegion = queryFilter.region.values.map(id => ObjectId(id));
        }

        if (queryFilter.subRegion && isObjectId(queryFilter.subRegion)) {
            filter.setSubRegion = queryFilter.subRegion.values.map(id => ObjectId(id));
        }

        if (queryFilter.branch && isObjectId(queryFilter.branch)) {
            filter.setBranch = queryFilter.branch.values.map(id => ObjectId(id));
        }

        if (queryFilter.retailSegment && isObjectId(queryFilter.retailSegment)) {
            filter.setRetailSegment = queryFilter.retailSegment.values.map(id => ObjectId(id));
        }

        if (queryFilter.outlet && isObjectId(queryFilter.outlet)) {
            filter.setOutlet = queryFilter.outlet.values.map(id => ObjectId(id));
        }

        if (queryFilter.position && isObjectId(queryFilter.position)) {
            filter.setPosition = queryFilter.position.values.map(id => ObjectId(id));
        }

        if (queryFilter.personnel && isObjectId(queryFilter.personnel)) {
            filter.setPersonnel = queryFilter.personnel.values.map(id => ObjectId(id));
        }

        if (queryFilter.time) {
            filter.setPeriod = queryFilter.time.values.map(date => new Date(date));
        }

        const getSearchReference = (string) => {
            return { $regex: string, $options: 'i' };
        };

        if (globalSearch && globalSearch.length > 0) {
            $matchPersonnel.$and.push({
                $or: [
                    { 'createdBy.name.en': getSearchReference(globalSearch) },
                    { 'createdBy.name.ar': getSearchReference(globalSearch) },
                ],
            });
        }

        if (filter.setPosition) {
            $matchPersonnel.$and.push({
                'createdBy.position': {
                    $in: filter.setPosition,
                },
            });
        }

        if (filter.setPersonnel) {
            $matchPersonnel.$and.push({
                'createdBy._id': {
                    $in: filter.setPersonnel,
                },
            });
        }

        const needPersonnelFilter = $matchPersonnel.$and.length > 0;

        const pipeline = [
            {
                $addFields: {
                    category: {
                        $ifNull: ['$categories', []],
                    },
                },
            },
        ];

        if (needPersonnelFilter) {
            pipeline.push(...[
                {
                    $group: {
                        _id: '$createdBy',
                        setBrandingAndMonthlyDisplay: {
                            $push: '$$ROOT',
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'personnels',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'createdBy',
                    },
                },
                {
                    $project: {
                        createdBy: {
                            $let: {
                                vars: {
                                    user: {
                                        $arrayElemAt: ['$createdBy', 0],
                                    },
                                },
                                in: {
                                    _id: '$$user._id',
                                    firstName: '$$user.firstName',
                                    lastName: '$$user.lastName',
                                    name: {
                                        en: {
                                            $concat: ['$$user.firstName.en', ' ', '$$user.lastName.en'],
                                        },
                                        ar: {
                                            $concat: ['$$user.firstName.ar', ' ', '$$user.lastName.ar'],
                                        },
                                    },
                                    position: '$$user.position',
                                },
                            },
                        },
                        setBrandingAndMonthlyDisplay: 1,
                    },
                },
                {
                    $match: $matchPersonnel,
                },
                {
                    $unwind: {
                        path: '$setBrandingAndMonthlyDisplay',
                    },
                },
            ]);

            pipeline.push({
                $replaceRoot: { newRoot: '$setBrandingAndMonthlyDisplay' },
            });
        }

        if (filter.setPeriod) {
            pipeline.push({
                $match: {
                    $and: [{
                        createdAt: { $gte: new Date(filter.setPeriod[0]) },
                    }, {
                        createdAt: { $lte: new Date(filter.setPeriod[1]) },
                    }],
                },
            });
        }

        const $matchGeneral = {
            $and: [],
        };

        if (filter.setCountry || (currentUser.country && currentUser.country.length)) {
            filter.setCountry = filter.setCountry || [];

            $matchGeneral.$and.push({
                country: {
                    $in: _.union(filter.setCountry, currentUser.country),
                },
            });
        }

        if (filter.setCategory) {
            $matchGeneral.$and.push({
                categories: {
                    $in: filter.setCategory,
                },
            });
        }

        if (queryFilter.displaySeason && queryFilter.displaySeason.values) {
            $matchGeneral.$and.push({
                'displaySeason': {
                    $in: queryFilter.displaySeason.values,
                },
            });
        }

        if (filter.setRegion || (currentUser.region && currentUser.region.length)) {
            filter.setRegion = filter.setRegion || [];

            $matchGeneral.$and.push({
                region: {
                    $in: _.union(filter.setRegion, currentUser.region),
                },
            });
        }

        if (filter.setSubRegion || (currentUser.subRegion && currentUser.subRegion.length)) {
            filter.setSubRegion = filter.setSubRegion || [];

            $matchGeneral.$and.push({
                subRegion: {
                    $in: _.union(filter.setSubRegion, currentUser.subRegion),
                },
            });
        }

        if (filter.setBranch || (currentUser.branch && currentUser.branch.length)) {
            filter.setBranch = filter.setBranch || [];

            $matchGeneral.$and.push({
                branch: {
                    $in: _.union(filter.setBranch, currentUser.branch),
                },
            });
        }

        if (filter.setRetailSegment) {
            $matchGeneral.$and.push({
                retailSegment: {
                    $in: filter.setRetailSegment,
                },
            });
        }

        if (filter.setOutlet) {
            $matchGeneral.$and.push({
                outlet: {
                    $in: filter.setOutlet,
                },
            });
        }

        if ($matchGeneral.$and.length > 0) {
            pipeline.push({
                $match: $matchGeneral,
            });
        }

        pipeline.push(...[
            {
                $group: {
                    _id: null,
                    category: {
                        $push: '$category',
                    },
                    displaySeason: {
                        $push: '$displaySeason',
                    },
                    country: {
                        $push: '$country',
                    },
                    region: {
                        $push: '$region',
                    },
                    subRegion: {
                        $push: '$subRegion',
                    },
                    outlet: {
                        $push: '$outlet',
                    },
                    retailSegment: {
                        $push: '$retailSegment',
                    },
                    branch: {
                        $push: '$branch',
                    },
                    createdBy: {
                        $push: '$createdBy',
                    },
                },
            },
            {
                $project: {
                    category: {
                        $reduce: {
                            input: '$category',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: {
                                        $ne: ['$$value', []],
                                    },
                                    then: {
                                        $setUnion: ['$$value', '$$this'],
                                    },
                                    else: '$$this',
                                },
                            },
                        },
                    },
                    country: {
                        $setUnion: '$country',
                    },
                    displaySeason: {
                        $setUnion: '$displaySeason',
                    },
                    region: {
                        $setUnion: '$region',
                    },
                    subRegion: {
                        $setUnion: '$subRegion',
                    },
                    outlet: {
                        $setUnion: '$outlet',
                    },
                    retailSegment: {
                        $setUnion: '$retailSegment',
                    },
                    branch: {
                        $setUnion: '$branch',
                    },
                    createdBy: {
                        $setUnion: '$createdBy',
                    },
                },
            },
            {
                $lookup: {
                    from: 'personnels',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'createdBy',
                },
            },
            {
                $project: {
                    category: 1,
                    displaySeason: 1,
                    country: 1,
                    region: 1,
                    subRegion: 1,
                    outlet: 1,
                    retailSegment: 1,
                    branch: 1,
                    position: '$createdBy.position',
                    personnel: {
                        $map: {
                            input: '$createdBy',
                            as: 'item',
                            in: {
                                _id: '$$item._id',
                                name: {
                                    en: {
                                        $concat: ['$$item.firstName.en', ' ', '$$item.lastName.en'],
                                    },
                                    ar: {
                                        $concat: ['$$item.firstName.ar', ' ', '$$item.lastName.ar'],
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'positions',
                    localField: 'position',
                    foreignField: '_id',
                    as: 'position',
                },
            },
            {
                $project: {
                    position: {
                        _id: 1,
                        name: 1,
                    },
                    category: 1,
                    displaySeason: 1,
                    country: 1,
                    region: 1,
                    subRegion: 1,
                    outlet: 1,
                    retailSegment: 1,
                    branch: 1,
                    personnel: 1,
                },
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            {
                $project: {
                    position: 1,
                    country: 1,
                    displaySeason: 1,
                    region: 1,
                    subRegion: 1,
                    outlet: 1,
                    retailSegment: 1,
                    branch: 1,
                    personnel: 1,
                    category: {
                        _id: 1,
                        name: 1,
                    },
                },
            },
            {
                $lookup: {
                    from: 'retailSegments',
                    localField: 'retailSegment',
                    foreignField: '_id',
                    as: 'retailSegment',
                },
            },
            {
                $project: {
                    position: 1,
                    country: 1,
                    displaySeason: 1,
                    region: 1,
                    subRegion: 1,
                    outlet: 1,
                    category: 1,
                    branch: 1,
                    personnel: 1,
                    retailSegment: {
                        _id: 1,
                        name: 1,
                    },
                },
            },
            {
                $lookup: {
                    from: 'outlets',
                    localField: 'outlet',
                    foreignField: '_id',
                    as: 'outlet',
                },
            },
            {
                $project: {
                    position: 1,
                    displaySeason: 1,
                    country: 1,
                    region: 1,
                    subRegion: 1,
                    retailSegment: 1,
                    category: 1,
                    branch: 1,
                    personnel: 1,
                    outlet: {
                        _id: 1,
                        name: 1,
                    },
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'country',
                    foreignField: '_id',
                    as: 'country',
                },
            },
            {
                $project: {
                    position: 1,
                    displaySeason: 1,
                    region: 1,
                    subRegion: 1,
                    outlet: 1,
                    retailSegment: 1,
                    branch: 1,
                    personnel: 1,
                    category: 1,
                    country: {
                        _id: 1,
                        name: 1,
                    },
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'region',
                    foreignField: '_id',
                    as: 'region',
                },
            },
            {
                $project: {
                    position: 1,
                    displaySeason: 1,
                    country: 1,
                    subRegion: 1,
                    outlet: 1,
                    retailSegment: 1,
                    branch: 1,
                    personnel: 1,
                    category: 1,
                    region: {
                        _id: 1,
                        name: 1,
                        parent: 1,
                    },
                },
            },
            {
                $addFields: {
                    region: {
                        $let: {
                            vars: {
                                setCountry: filter.setCountry && filter.setCountry.length ? filter.setCountry : {
                                    $map: {
                                        input: '$country',
                                        as: 'item',
                                        in: '$$item._id',
                                    },
                                },
                                setRegion: filter.setRegion && filter.setRegion.length ? filter.setRegion : [],
                            },
                            in: {
                                $cond: {
                                    if: {
                                        $gt: [{
                                            $size: '$$setRegion',
                                        }, 0],
                                    },
                                    then: {
                                        $filter: {
                                            input: '$region',
                                            as: 'item',
                                            cond: {
                                                $and: [
                                                    { $setIsSubset: [['$$item.parent'], '$$setCountry'] },
                                                    { $setIsSubset: [['$$item._id'], '$$setRegion'] },
                                                ],
                                            },
                                        },
                                    },
                                    else: {
                                        $filter: {
                                            input: '$region',
                                            as: 'item',
                                            cond: {
                                                $setIsSubset: [['$$item.parent'], '$$setCountry'],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'domains',
                    localField: 'subRegion',
                    foreignField: '_id',
                    as: 'subRegion',
                },
            },
            {
                $project: {
                    position: 1,
                    country: 1,
                    displaySeason: 1,
                    outlet: 1,
                    retailSegment: 1,
                    branch: 1,
                    personnel: 1,
                    category: 1,
                    region: {
                        _id: 1,
                        name: 1,
                    },
                    subRegion: {
                        _id: 1,
                        name: 1,
                        parent: 1,
                    },
                },
            },
            {
                $addFields: {
                    subRegion: {
                        $let: {
                            vars: {
                                setRegion: filter.setRegion && filter.setRegion.length ? filter.setRegion : {
                                    $map: {
                                        input: '$region',
                                        as: 'item',
                                        in: '$$item._id',
                                    },
                                },
                                setSubRegion: filter.setSubRegion && filter.setSubRegion.length ? filter.setSubRegion : [],
                            },
                            in: {
                                $cond: {
                                    if: {
                                        $gt: [{
                                            $size: '$$setSubRegion',
                                        }, 0],
                                    },
                                    then: {
                                        $filter: {
                                            input: '$subRegion',
                                            as: 'item',
                                            cond: {
                                                $and: [
                                                    { $setIsSubset: [['$$item.parent'], '$$setRegion'] },
                                                    { $setIsSubset: [['$$item._id'], '$$setSubRegion'] },
                                                ],
                                            },
                                        },
                                    },
                                    else: {
                                        $filter: {
                                            input: '$subRegion',
                                            as: 'item',
                                            cond: {
                                                $setIsSubset: [['$$item.parent'], '$$setRegion'],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'branches',
                    localField: 'branch',
                    foreignField: '_id',
                    as: 'branch',
                },
            },
            {
                $project: {
                    position: 1,
                    country: 1,
                    subRegion: 1,
                    displaySeason: 1,
                    outlet: 1,
                    retailSegment: 1,
                    personnel: 1,
                    category: 1,
                    region: 1,
                    branch: {
                        _id: 1,
                        name: 1,
                        subRegion: 1,
                    },
                },
            },
            {
                $addFields: {
                    branch: {
                        $let: {
                            vars: {
                                setSubRegion: {
                                    $map: {
                                        input: '$subRegion',
                                        as: 'item',
                                        in: '$$item._id',
                                    },
                                },
                                setBranch: filter.setBranch && filter.setBranch.length ? filter.setBranch : [],
                            },
                            in: {
                                $cond: {
                                    if: {
                                        $gt: [{
                                            $size: '$$setBranch',
                                        }, 0],
                                    },
                                    then: {
                                        $filter: {
                                            input: '$branch',
                                            as: 'item',
                                            cond: {
                                                $and: [
                                                    { $setIsSubset: [['$$item.subRegion'], '$$setSubRegion'] },
                                                    { $setIsSubset: [['$$item._id'], '$$setBranch'] },
                                                ],
                                            },
                                        },
                                    },
                                    else: {
                                        $filter: {
                                            input: '$branch',
                                            as: 'item',
                                            cond: {
                                                $setIsSubset: [['$$item.subRegion'], '$$setSubRegion'],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    displaySeason: {
                        _id: '$displaySeason',
                        name: {
                            en: '$displaySeason',
                            ar: '$displaySeason'
                        }
                    },
                    category: {
                        _id: 1,
                        name: 1,
                    },
                    country: {
                        _id: 1,
                        name: 1,
                    },
                    region: {
                        _id: 1,
                        name: 1,
                    },
                    subRegion: {
                        _id: 1,
                        name: 1,
                    },
                    outlet: {
                        _id: 1,
                        name: 1,
                    },
                    retailSegment: {
                        _id: 1,
                        name: 1,
                    },
                    branch: {
                        _id: 1,
                        name: 1,
                    },
                    position: {
                        _id: 1,
                        name: 1,
                    },
                    personnel: {
                        _id: 1,
                        name: 1,
                    },
                },
            },
        ]);

        const aggregation = BrandingAndMonthlyDisplayModel.aggregate(pipeline);

        aggregation.options = {
            allowDiskUse: true,
        };

        aggregation.exec((err, result) => {
            if (err) {
                return next(err);
            }

            const filters = result.length ?
                result.slice().pop() : {
                    category: [],
                    country: [],
                    displaySeason: [],
                    region: [],
                    subRegion: [],
                    outlet: [],
                    retailSegment: [],
                    branch: [],
                    position: [],
                    personnel: [],
                };

            res.status(200).send(filters);
        });
    };
};

module.exports = Filters;
