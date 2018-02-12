const async = require('async');
const _ = require('lodash');
const logger = require('../../../utils/logger');
const getMedian = require('../../../utils/getMedian');
const ActivityLog = require('./../../push-notifications/activityLog');
const access = require('../../../helpers/access')();
const CONTENT_TYPES = require('../../../public/js/constants/contentType.js');
const CONSTANTS = require('../../../constants/mainConstants');
const ACL_MODULES = require('../../../constants/aclModulesNames');
const FilterMapper = require('../../../helpers/filterMapper');
const AggregationHelper = require('../../../helpers/aggregationCreater');
const PriceSurveyModel = require('./../../../types/priceSurvey/model');
const EventModel = require('./../../../types/event/model');
const bodyValidator = require('../../../helpers/bodyValidator');
const ObjectId = require('mongoose').Types.ObjectId;

const $defProjection = {
    category: 1,
    _id: 1,
    maxBranchCount: 1,
    brands: 1,
    branchesAll: 1,
    items: 1,
    variant: 1,
    country: 1,
    branch: 1,
    region: 1,
    subRegion: 1,
    retailSegment: 1,
    outlet: 1,
    createdBy: 1,
    size: 1,
    price: 1,
    currency: 1
};

const aggregateById = (options, callback) => {
    const id = options.id || '';
    const pipeLine = [];

    pipeLine.push({
        $match: { _id: id }
    });

    pipeLine.push({
        $unwind: '$items'
    });

    pipeLine.push({
        $project: {
            category: 1,
            variant: 1,
            branch: 1,
            brand: '$items.brand',
            size: '$items.size',
            metric: '$items.metric',
            price: '$items.price'
        }
    });

    pipeLine.push({
        $group: {
            _id: {
                brand: '$brand',
                category: '$category',
                variant: '$variant',
                branch: '$branch'
            },
            size: { $first: '$size' },
            metric: { $first: '$metric' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
            avgPrice: { $avg: '$price' }
        }
    });

    pipeLine.push({
        $lookup: {
            from: 'branches',
            localField: '_id.branch',
            foreignField: '_id',
            as: 'branch'
        }
    });

    pipeLine.push({
        $project: {
            _id: 0,
            brand: '$_id.brand',
            category: '$_id.category',
            variant: '$_id.variant',
            branch: { $arrayElemAt: ['$branch', 0] },
            size: 1,
            metric: 1,
            minPrice: 1,
            maxPrice: 1,
            avgPrice: 1
        }
    });

    pipeLine.push({
        $project: {
            brand: 1,
            category: 1,
            variant: 1,
            metric: 1,
            branch: {
                _id: 1,
                name: 1
            },
            size: 1,
            minPrice: 1,
            maxPrice: 1,
            avgPrice: 1
        }
    });

    pipeLine.push({
        $group: {
            _id: null,
            data: { $push: '$$ROOT' },
            branches: { $addToSet: '$branch' }
        }
    });

    pipeLine.push({
        $unwind: '$data'
    });

    pipeLine.push({
        $project: {
            brand: '$data.brand',
            category: '$data.category',
            variant: '$data.variant',
            branch: '$data.branch',
            size: '$data.size',
            metric: '$data.metric',
            minPrice: '$data.minPrice',
            maxPrice: '$data.maxPrice',
            avgPrice: '$data.avgPrice',
            branchesAll: '$branches'
        }
    });

    pipeLine.push({
        $group: {
            _id: {
                category: '$category',
                brand: '$brand',
                variant: '$variant'
            },
            branches: {
                $addToSet: {
                    branch: '$branch',
                    minPrice: '$minPrice',
                    maxPrice: '$maxPrice',
                    avgPrice: '$avgPrice'
                }
            },
            branchCount: { $sum: 1 },
            size: { $first: '$size' },
            metric: { $first: '$metric' },
            totalMinPrice: { $min: '$minPrice' },
            totalMaxPrice: { $max: '$maxPrice' },
            totalAvgPrice: { $avg: '$avgPrice' },
            branchesAll: { $first: '$branchesAll' }
        }
    });

    pipeLine.push({
        $lookup: {
            from: 'variants',
            localField: '_id.variant',
            foreignField: '_id',
            as: 'variant'
        }
    });

    pipeLine.push({
        $project: {
            _id: 0,
            category: '$_id.category',
            brand: '$_id.brand',
            variant: { $arrayElemAt: ['$variant', 0] },
            branches: 1,
            size: 1,
            metric: 1,
            totalMaxPrice: 1,
            totalAvgPrice: 1,
            branchCount: 1,
            branchesAll: 1
        }
    });

    pipeLine.push({
        $project: {
            category: 1,
            brand: 1,
            variant: {
                _id: 1,
                name: 1
            },
            branches: 1,
            size: 1,
            metric: 1,
            totalMinPrice: 1,
            totalMaxPrice: 1,
            totalAvgPrice: 1,
            branchCount: 1,
            branchesAll: 1
        }
    });

    pipeLine.push({
        $group: {
            _id: {
                category: '$category',
                brand: '$brand'
            },
            variants: {
                $push: {
                    variant: '$variant',
                    branches: '$branches',
                    size: '$size',
                    metric: '$metric',
                    totalMinPrice: '$totalMinPrice',
                    totalMaxPrice: '$totalMaxPrice',
                    totalAvgPrice: '$totalAvgPrice'
                }
            },
            maxBranchCount: { $max: '$branchCount' },
            branchesAll: { $first: '$branchesAll' }
        }
    });

    pipeLine.push({
        $lookup: {
            from: 'brands',
            localField: '_id.brand',
            foreignField: '_id',
            as: 'brand'
        }
    });

    pipeLine.push({
        $project: {
            _id: 0,
            category: '$_id.category',
            brand: { $arrayElemAt: ['$brand', 0] },
            variants: 1,
            maxBranchCount: 1,
            branchesAll: 1
        }
    });

    pipeLine.push({
        $project: {
            _id: 0,
            category: 1,
            brand: {
                _id: 1,
                name: 1
            },
            variants: 1,
            maxBranchCount: 1,
            branchesAll: 1
        }
    });

    pipeLine.push({
        $group: {
            _id: '$category',
            brands: {
                $push: {
                    variants: '$variants',
                    brand: '$brand'
                }
            },
            maxBranchCount: { $max: '$maxBranchCount' },
            branchesAll: { $first: '$branchesAll' }
        }
    });

    pipeLine.push({
        $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category'
        }
    });

    pipeLine.push({
        $project: {
            _id: 1,
            maxBranchCount: 1,
            brands: 1,
            category: { $arrayElemAt: ['$category', 0] },
            branchesAll: 1
        }
    });

    pipeLine.push({
        $project: {
            category: {
                _id: 1,
                name: 1
            },
            _id: 1,
            maxBranchCount: 1,
            brands: 1,
            branchesAll: 1
        }
    });

    PriceSurveyModel.aggregate(pipeLine)
        .allowDiskUse(true)
        .exec((err, result) => {
            if (err) {
                return callback(err);
            }
            result = result[0];

            if (result) {
                if (result.items && result.items.length) {
                    result.items.forEach((item) => {
                        if (item.size) {
                            item.size = _.unescape(item.size);
                        }
                        if (item.price) {
                            item.price = _.unescape(item.price);
                        }
                    })
                }
            }

            callback(null, result);
        });
};

const create = (req, res, next) => {
    const session = req.session;
    const userId = session.uId;
    const accessRoleLevel = session.level;
    const requestBody = req.body;

    const queryRun = (body, callback) => {
        if (body.items && body.items.length) {
            body.items.forEach((item) => {
                if (item.size) {
                    item.size = _.escape(item.size);
                }
                if (item.price) {
                    item.price = _.escape(item.price);
                }
            });
        }

        const data = {
            category: body.category,
            variant: body.variant,
            country: body.country,
            region: body.region,
            subRegion: body.subRegion,
            retailSegment: body.retailSegment,
            outlet: body.outlet,
            branch: body.branch,
            items: body.items,
            createdBy: {
                user: userId,
                date: new Date()
            }
        };

        const priceSurveyModel = new PriceSurveyModel();

        priceSurveyModel.set(data);
        priceSurveyModel.save((err, model) => {
            callback(err, model);
        });
    };

    async.waterfall([

        (cb) => {
            access.getWriteAccess(req, ACL_MODULES.PRICE_SURVEY, cb);
        },

        (allowed, personnel, cb) => {
            bodyValidator.validateBody(requestBody, accessRoleLevel, CONTENT_TYPES.PRICESURVEY, 'create', cb);
        },

        (body, cb) => {
            queryRun(body, cb);
        },

    ], (err, body) => {
        if (err) {
            return next(err);
        }

        ActivityLog.emit('reporting:price-survey:published', {
            actionOriginator: userId,
            accessRoleLevel,
            body : body.toJSON(),
        });

        res.status(201).send(body);
    });
};

const update = (req, res, next) => {
    const session = req.session;
    const userId = session.uId;
    const accessRoleLevel = session.level;
    const requestBody = req.body;
    const id = req.params.id;
    const itemId = req.params.itemId;

    const queryRun = (body, callback) => {
        async.waterfall([
            (cb) => {
                PriceSurveyModel.findOne({ _id : id }).lean().exec(cb);
            },
            (model) => {
                if (model && model.items) {
                    model.items.forEach((item) => {
                        if (item._id.toString() === itemId) {
                            item.price = _.escape(body.price)
                        }
                    });

                    const data = {
                        items : model.items,
                        editedBy: {
                            user: userId,
                            date: new Date()
                        }
                    };
                    PriceSurveyModel.findByIdAndUpdate(id, data, { new: true }, callback)
                }
            },
        ]);
    };

    async.waterfall([

        (cb) => {
            access.getEditAccess(req, ACL_MODULES.PRICE_SURVEY, cb);
        },

        (allowed, personnel, cb) => {
            bodyValidator.validateBody(requestBody, accessRoleLevel, CONTENT_TYPES.PRICESURVEY, 'update', cb);
        },

        (body, cb) => {
            queryRun(body, cb);
        },

    ], (err, body) => {
        if (err) {
            return next(err);
        }

        res.status(200).send(body);
    });
};

const removeItem = (req, res, next) => {
    const session = req.session;
    const userId = session.uId;
    const accessRoleLevel = session.level;
    const requestBody = req.body;
    const id = req.params.id;
    const itemId = req.params.itemId;

    const queryRun = (callback) => {
        async.waterfall([

            (cb) => {
                PriceSurveyModel.findOne({ _id : id }).lean().exec(cb);
            },
            (model, cb) => {
                if (model && model.items) {
                    let removeItem;
                    const priceItems = model.items.filter((item) => {
                        if (item._id.toString() !== itemId) {
                            return item;
                        } else {
                            removeItem = item;
                        }
                    });

                    const data = {
                        items : priceItems,
                        editedBy: {
                            user: userId,
                            date: new Date()
                        }
                    };
                    cb(null, removeItem, data);
                }
            },
            (removeItem, data, cb) => {
                const eventModel = new EventModel();
                const options = {
                    headers: {
                        contentType: "PriceSurvey",
                        actionType : "remove",
                        user       : userId,
                        reportId   : id
                    },
                    payload: removeItem
                };
                eventModel.set(options);
                eventModel.save((err, model) => {
                    cb(null, err, model, data);
                });
            },
            (err, model, data) => {
                if (err) {
                    if (!res.headersSent) {
                        next(err);
                    }

                    return logger.error(err);
                }

                PriceSurveyModel.findByIdAndUpdate(id, data, { new: true }, callback)
            },
        ], (err, body) => {
            if (err) {
                return next(err);
            }

            res.status(200).send(body);
        });
    };

    async.waterfall([

        (cb) => {
            access.getArchiveAccess(req, ACL_MODULES.PRICE_SURVEY, cb);
        },

        (allowed, personnel, cb) => {
            queryRun(cb);
        }
    ], (err, body) => {
        if (err) {
            return next(err);
        }

        res.status(200).send(body);
    });
};

const getAll = (req, res, next) => {
    function queryRun(personnel) {
        var query = req.query;
        var filter = query.filter || {};
        var page = query.page || 1;
        var limit = query.count * 1 || parseInt(CONSTANTS.LIST_COUNT);
        var skip = (page - 1) * limit;
        var aggregateHelper;
        var filterMapper = new FilterMapper();
        var filterSearch = filter.globalSearch || '';
        var queryObject;
        var pipeLine = [];
        var queryPipeline = [];
        var mainPipeline = [];
        var aggregation;
        var employeeFilter;
        var positionFilter;

        var sort = query.sort || {
                'category.name': 1
            };
        var searchFieldsArray = [
            'branch.name.en',
            'branch.name.ar',
            'category.name.en',
            'category.name.ar',
            'variant.name.en',
            'variant.name.ar',
            'size',
            'price',
            'metric',
            'brand.name.en',
            'brand.name.ar'
        ];

        aggregateHelper = new AggregationHelper($defProjection);
        queryObject = query.filter ? filterMapper.mapFilter({
            contentType: CONTENT_TYPES.PRICESURVEY,
            filter: filter,
            personnel: personnel
        }) : {};

        if (queryObject.personnel) {
            employeeFilter = queryObject.personnel;
            delete queryObject.personnel;
        }

        if (queryObject.position) {
            positionFilter = queryObject.position;
            delete queryObject.position;
        }

        queryPipeline.push({
            $match: queryObject
        });

        if (employeeFilter) {
            queryPipeline.push({
                $match: {
                    'createdBy.user': employeeFilter
                }
            });
        }

        queryPipeline.push(...[
                // Stage 1
                {
                    $lookup: {
                        "from": "personnels",
                        "localField": "createdBy.user",
                        "foreignField": "_id",
                        "as": "createdBy.user"
                    }
                },

                // Stage 2
                {
                    $addFields: {
                        "createdBy.user": {
                            $let: {
                                vars: {
                                    user: {
                                        $arrayElemAt: ['$createdBy.user', 0]
                                    }
                                },
                                in: {
                                    "_id": "$$user._id",
                                    "name": "$$user.name",
                                    "position": "$$user.position",
                                    "country": "$$user.country",
                                    "region": "$$user.region",
                                    "subRegion": "$$user.subRegion"
                                }
                            }
                        }
                    }
                }]);

        if (queryObject.country) {
            queryPipeline.push({
                $match: {
                    $or: [
                        {
                            'createdBy.user.country': queryObject.country
                        },
                        {
                            'createdBy.user.country': { $size: 0 }
                        }
                    ]
                }
            });
        }

        if (queryObject.region) {
            queryPipeline.push({
                $match: {
                    $or: [
                        {
                            'createdBy.user.region': queryObject.region
                        },
                        {
                            'createdBy.user.region': {  $size: 0 }
                        }
                    ]
                }
            });
        }

        if (queryObject.subRegion) {
            queryPipeline.push({
                $match: {
                    $or: [
                        {
                            'createdBy.user.subRegion': queryObject.subRegion
                        },
                        {
                            'createdBy.user.subRegion': {  $size: 0 }
                        }
                    ]
                }
            });
        }

        if (positionFilter) {
            queryPipeline.push({
                $match: {
                    'createdBy.user.position': positionFilter
                }
            });
        }

        queryPipeline.push(...[
            {
                $project: {
                    "createdBy": 1,
                    "category": 1,
                    "_id": 1,
                    "maxBranchCount": 1,
                    "brands": 1,
                    "branchesAll": 1,
                    "items": 1,
                    "variant": 1,
                    "country": 1,
                    "branch": 1,
                    "region": 1,
                    "subRegion": 1,
                    "retailSegment": 1,
                    "outlet": 1,
                    "size": 1,
                    "price": 1,
                    "currency": 1
                }
            },

            // Stage 4
            {
                $lookup: {
                    "from": "categories",
                    "localField": "category",
                    "foreignField": "_id",
                    "as": "category"
                }
            },

            // Stage 5
            {
                $addFields: {
                    "category": {
                        $let: {
                            vars: {
                                category: {
                                    $arrayElemAt: ['$category', 0]
                                }
                            },
                            in: {
                                _id: '$$category._id',
                                name: '$$category.name'
                            }
                        }
                    }
                }
            },

            // Stage 6
            {
                $lookup: {
                    "from": "variants",
                    "localField": "variant",
                    "foreignField": "_id",
                    "as": "variant"
                }
            },

            // Stage 7
            {
                $addFields: {
                    "variant": {
                        $let: {
                            vars: {
                                variant: {
                                    $arrayElemAt: ['$variant', 0]
                                }
                            },
                            in: {
                                _id: '$$variant._id',
                                name: '$$variant.name'
                            }
                        }
                    }
                }
            },

            // Stage 8
            {
                $lookup: {
                    "from": "branches",
                    "localField": "branch",
                    "foreignField": "_id",
                    "as": "branch"
                }
            },

            // Stage 9
            {
                $addFields: {
                    "branch": {
                        $let: {
                            vars: {
                                branch: {
                                    $arrayElemAt: ['$branch', 0]
                                }
                            },
                            in: {
                                "_id": "$$branch._id",
                                "name": "$$branch.name",
                                "outlet": "$$branch.outlet",
                                "retailSegment": "$$branch.retailSegment",
                                "subRegion": "$$branch.subRegion"
                            }
                        }
                    }
                }
            },

            // Stage 10
            {
                $lookup: {
                    "from": "domains",
                    "localField": "branch.subRegion",
                    "foreignField": "_id",
                    "as": "branch.subRegion"
                }
            },

            // Stage 11
            {
                $addFields: {
                    "branch.subRegion": {
                        $let: {
                            vars: {
                                subRegion: {
                                    $arrayElemAt: ['$branch.subRegion', 0]
                                }
                            },
                            in: {
                                "_id": "$$subRegion._id",
                                "name": "$$subRegion.name",
                                "parent": "$$subRegion.parent"
                            }
                        }
                    }
                }
            }, {
                $lookup: {
                    "from": "outlets",
                    "localField": "outlet",
                    "foreignField": "_id",
                    "as": "outlet"
                }
            },

            // Stage 13
            {
                $addFields: {
                    "outlet": {
                        $let: {
                            vars: {
                                outlet: {
                                    $arrayElemAt: ['$outlet', 0]
                                }
                            },
                            in: {
                                "_id": "$$outlet._id",
                                "name": "$$outlet.name",
                                "retailSegments": "$$outlet.retailSegments"
                            }
                        }
                    }
                }
            }]);

        if (queryObject.outlet) {
            queryPipeline.push({
                $match: {
                    'branch.outlet': queryObject.outlet
                }
            });
        }

        if (queryObject.subRegion) {
            queryPipeline.push({
                $match: {
                    $or: [
                        {
                            'branch.subRegion': queryObject.subRegion
                        },
                        {
                            'branch.subRegion': { $exists: false }
                        }
                    ]
                }
            });
        }

        if (queryObject.region) {
            queryPipeline.push({
                $match: {
                    $or: [
                        {
                            'branch.subRegion.parent': queryObject.region
                        },
                        {
                            'branch.subRegion.parent': { $exists: false }
                        }
                    ]
                }
            });
        }

        if (queryObject.retailSegment) {
            queryPipeline.push({
                $match: {
                    $or: [
                        {
                            'branch.retailSegment': queryObject.retailSegment,
                        }, {
                            'outlet.retailSegments': queryObject.retailSegment
                        }
                    ]
                }
            });
        }

        queryPipeline.push(...[


            // Stage 14
            {
                $lookup: {
                    "from": "domains",
                    "localField": "country",
                    "foreignField": "_id",
                    "as": "country"
                }
            },

            // Stage 15
            {
                $addFields: {
                    "country": {
                        $let: {
                            vars: {
                                country: {
                                    $arrayElemAt: ['$country', 0]
                                }
                            },
                            in: {
                                "_id": "$$country._id",
                                "name": "$$country.name"
                            }
                        }
                    }
                }
            },

            // Stage 16
            {
                $project: {
                    "category": 1,
                    "variant": 1,
                    "branch": 1,
                    "currency": 1,
                    "items" :1,
                }
            },

            // Stage 17
            {
                $unwind: "$items"
            },

            // Stage 18
            {
                $project: {
                    "category": 1,
                    "variant": 1,
                    "branch": 1,
                    "currency": 1,
                    "brand": "$items.brand",
                    "size": "$items.size",
                    "price": "$items.price"
                }
            },

            // Stage 19
            {
                $lookup: {
                    "from": "brands",
                    "localField": "brand",
                    "foreignField": "_id",
                    "as": "brand"
                }
            },

            // Stage 20
            {
                $addFields: {
                    "brand": {
                        $let: {
                            vars: {
                                brand: {
                                    $arrayElemAt: ['$brand', 0]
                                }
                            },
                            in: {
                                "_id": "$$brand._id",
                                "name": "$$brand.name",
                                "ourCompany": "$$brand.ourCompany"
                            }
                        }
                    }
                }
            }]);

        queryPipeline.push({
            $match: aggregateHelper.getSearchMatch(searchFieldsArray, filterSearch)
        });
            // Stage 22
        mainPipeline.push(...queryPipeline);
        mainPipeline.push(...[
            {
                $group: {
                    "_id": {
                        "brandId": "$brand._id",
                        "categoryId": "$category._id",
                        "variantId": "$variant._id",
                        "branchId": "$branch._id",
                        "size": "$size",
                        "price": "$price"
                    },
                    "currency": {
                        "$first": "$currency"
                    },
                    "category": {
                        "$first": "$category"
                    },
                    "brand": {
                        "$first": "$brand"
                    },
                    "variant": {
                        "$first": "$variant"
                    },
                    "branch": {
                        "$first": "$branch"
                    },
                    "size": {
                        "$first": "$size"
                    },
                    "totalPrice": {
                        "$push": "$price"
                    },
                    "minPrice": {
                        "$min": "$price"
                    },
                    "maxPrice": {
                        "$max": "$price"
                    },
                    "avgPrice": {
                        "$avg": "$price"
                    }
                }
            },

            // Stage 23
            {
                $project: {
                    "_id": 0,
                    "brand": 1,
                    "category": 1,
                    "variant": 1,
                    "branch": 1,
                    "size": 1,
                    "price": "$_id.price",
                    "totalPrice": 1,
                    "minPrice": 1,
                    "maxPrice": 1,
                    "avgPrice": 1,
                    "currency": 1
                }
            },

            // Stage 27
            {
                $group: {
                    "_id": {
                        "categoryId": "$category._id",
                        "brandId": "$brand._id",
                        "variantId": "$variant._id",
                        "size": "$size"
                    },
                    "category": {
                        "$first": "$category"
                    },
                    "brand": {
                        "$first": "$brand"
                    },
                    "variant": {
                        "$first": "$variant"
                    },
                    "size": {
                        "$first": "$size"
                    },
                    "branches": {
                        "$addToSet": {
                            "branch": "$branch",
                            "minPrice": "$minPrice",
                            "maxPrice": "$maxPrice",
                            "avgPrice": "$avgPrice",
                            "price": "$totalPrice",
                            "currency": "$currency"
                        }
                    },
                    "branchCount": {
                        "$sum": 1
                    },
                    "totalMinPrice": {
                        "$min": "$minPrice"
                    },
                    "arrayOfPrice": {
                        "$push": "$price"
                    },
                    "totalMaxPrice": {
                        "$max": "$maxPrice"
                    },
                    "totalAvgPrice": {
                        "$avg": "$avgPrice"
                    },
                    "currency": {
                        "$first": "$currency"
                    },
                }
            },

            // Stage 28
            {
                $project: {
                    "_id": 0,
                    "category": 1,
                    "brand": 1,
                    "variant": 1,
                    "branches": 1,
                    "size": 1,
                    "arrayOfPrice": 1,
                    "totalMinPrice": 1,
                    "totalMaxPrice": 1,
                    "totalAvgPrice": 1,
                    "currency": 1,
                    "branchCount": 1,
                }
            },

            // Stage 29
            {
                $group: {
                    "_id": {
                        "categoryId": "$category._id",
                        "brandId": "$brand._id"
                    },
                    "category": {
                        "$first": "$category"
                    },
                    "brand": {
                        "$first": "$brand"
                    },
                    "variants": {
                        "$push": {
                            "variant": "$variant",
                            "branches": "$branches",
                            "size": "$size",
                            "arrayOfPrice": "$arrayOfPrice",
                            "totalMinPrice": "$totalMinPrice",
                            "totalMaxPrice": "$totalMaxPrice",
                            "totalAvgPrice": "$totalAvgPrice",
                            "currency": "$currency"
                        }
                    },
                    "maxBranchCount": {
                        "$max": "$branchCount"
                    },
                    "currency": {
                        "$last": "$currency"
                    }
                }
            },

            // Stage 30
            {
                $sort: {
                    "brand.ourCompany": -1,
                    "brand.name": 1
                }
            },

            // Stage 31
            {
                $group: {
                    "_id": "$category._id",
                    "category": {
                        "$first": "$category"
                    },
                    "brands": {
                        "$push": {
                            "variants": "$variants",
                            "brand": "$brand"
                        }
                    },
                    "maxBranchCount": {
                        "$max": "$maxBranchCount"
                    },
                    "currency": {
                        "$last": "$currency"
                    }
                }
            },

            // Stage 32
            {
                $sort: {
                    "category.name": 1
                }
            },

            // Stage 33
            {
                $group: {
                    "_id": null,
                    "total": {
                        "$sum": 1
                    },
                    "data": {
                        "$push": "$$ROOT"
                    }
                }
            },

            // Stage 34
            {
                $unwind: {
                    "path": "$data",
                    "preserveNullAndEmptyArrays": true
                }
            },

            // Stage 35
            {
                $project: {
                    "category": "$data.category",
                    "_id": "$data._id",
                    "maxBranchCount": "$data.maxBranchCount",
                    "brands": "$data.brands",
                    "items": "$data.items",
                    "variant": "$data.variant",
                    "country": "$data.country",
                    "branch": "$data.branch",
                    "region": "$data.region",
                    "subRegion": "$data.subRegion",
                    "retailSegment": "$data.retailSegment",
                    "outlet": "$data.outlet",
                    "createdBy": "$data.createdBy",
                    "size": "$data.size",
                    "price": "$data.price",
                    "currency": "$data.currency",
                    "total": 1
                }
            },

            // Stage 36
            {
                $skip: skip
            },

            // Stage 37
            {
                $limit: limit
            },

            // Stage 38
            {
                $group: {
                    "_id": "$total",
                    "data": {
                        "$push": "$$ROOT"
                    }
                }
            },

            // Stage 39
            {
                $project: {
                    "_id": 0,
                    "total": "$_id",
                    "data": 1
                }
            },
        ]);

        pipeLine.push({
            $facet: {
                branches: [
                    ...queryPipeline, {
                        $group: {
                            "_id": null,
                            "branches": {
                                "$addToSet": "$branch"
                            }

                        }
                    }
                ],
                result: mainPipeline,
            }
        });

        aggregation = PriceSurveyModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function(err, response) {

            if (err) {
                console.log(err);
                return next(err);
            }
            console.log(response);
            var branches;
            if (response.length) {
                branches = response[0].branches[0].branches;
                response[0] = response[0].result[0];
            }

            if (response[0] && response[0].data && response[0].data[0]){
                response[0].data[0].branchesAll = branches;
            }
            if (response.length) {
                response[0].data = _.map(response[0].data, function(model) {

                    if (model.items && model.items.length) {
                        model.items.forEach(function(item) {
                            if (item.size) {
                                item.size = _.unescape(item.size);
                            }
                            if (item.price) {
                                item.price = _.unescape(item.price);
                            }
                        });
                    }

                    return model;
                });
            }
            response = response && response[0] ? response[0] : { data: [], total: 0 };

            response.data.map(function (priceSurvey) {
                return priceSurvey.brands.map(function (brand) {
                    return brand.variants.map(function (variant) {
                        variant.totalMedPrice = getMedian(variant.arrayOfPrice);
                        variant.branches = variant.branches.map(function (branch) {
                            branch.medPrice = getMedian(branch.price);
                            return branch;
                        });
                        return variant;
                    });
                });
            });

            // res.status(200).send(response);

            next({ status: 200, body: response });
        });
    }

    access.getReadAccess(req, ACL_MODULES.PRICE_SURVEY, function(err, allowed, personnel) {
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

const getBrands = (req, res, next) => {
    function queryRun(personnel) {
        var query = req.query;
        var filter = query.filter;
        var filterMapper = new FilterMapper();
        var queryObject = query.filter ? filterMapper.mapFilter({
                contentType: CONTENT_TYPES.PRICESURVEY,
                filter: filter,
                personnel: personnel
            }) : {};

        var search = query.search;
        var pipeLine = [];
        var aggregateHelper;
        var aggregation;
        var brandFilter;
        var sizeFilter;
        var metricFilter;
        var positionFilter;
        var personnelFilter;
        var searchFieldsArray = [
            'category.name.en',
            'category.name.ar',
            'brand.name.en',
            'brand.name.ar',
            'branch.name.en',
            'branch.name.ar',
            'employee.name.en',
            'employee.name.ar',
            'lengthStr'
        ];

        if (queryObject.brand) {
            brandFilter = queryObject.brand;
            delete queryObject.brand;
        }
        if (queryObject.size) {
            sizeFilter = queryObject.size;
            delete queryObject.size;
        }
        if (queryObject.metric) {
            metricFilter = queryObject.metric;
            delete queryObject.metric;
        }
        if (queryObject.position) {
            positionFilter = queryObject.position;
            delete queryObject.position;
        }
        if (queryObject.personnel) {
            personnelFilter = queryObject.personnel;
            delete queryObject.personnel;
        }
        aggregateHelper = new AggregationHelper($defProjection, queryObject);

        if (personnelFilter) {
            pipeLine.push({
                $match: {
                    'createdBy.user': personnelFilter
                }
            });
        }

        pipeLine.push({
            $unwind: {
                preserveNullAndEmptyArrays: true,
                path: '$items'
            }
        });

        if (brandFilter) {
            pipeLine.push({
                $match: {
                    'items.brand': brandFilter,
                    'items.size': sizeFilter,
                    'items.metric': metricFilter,
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'categories',
            key: 'category',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'competitorVariants',
            key: 'variant',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'items',
            key: 'items.brand',
            isArray: false,
            includeSiblings: {
                items: {
                    _id: 1,
                    brand: 1,
                    price: 1,
                    metric: 1,
                    size: 1
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'branches',
            key: 'branch',
            isArray: false,
            addProjection: ['outlet', 'retailSegment']
        }));

        if (queryObject.outlet) {
            pipeLine.push({
                $match: {
                    'branch.outlet': queryObject.outlet
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'outlets',
            key: 'outlet',
            isArray: false,
            addProjection: ['retailSegments']
        }));

        if (queryObject.retailSegment) {
            pipeLine.push({
                $match: {
                    'branch.retailSegment': queryObject.retailSegment,
                    'outlet.retailSegments': queryObject.retailSegment,
                    retailSegment: queryObject.retailSegment
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'createdBy.user',
            addProjection: ['position', 'firstName', 'lastName', 'country', 'region', 'subRegion'],
            isArray: false,
            includeSiblings: {
                createdBy: {
                    date: 1
                }
            }
        }));

        if (queryObject.country) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'createdBy.user.country': queryObject.country
                        },
                        {
                            'createdBy.user.country': { $exists: false }
                        }
                    ]
                }
            });
        }

        if (queryObject.region) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'createdBy.user.region': queryObject.region
                        },
                        {
                            'createdBy.user.region': { $exists: false }
                        }
                    ]
                }
            });
        }

        if (queryObject.subRegion) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'createdBy.user.subRegion': queryObject.subRegion
                        },
                        {
                            'createdBy.user.subRegion': { $exists: false }
                        }
                    ]
                }
            });
        }

        if (positionFilter) {
            pipeLine.push({
                $match: {
                    'createdBy.user.position': positionFilter
                }
            });
        }

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                price: '$items.price',
                priceStr: { $substr: ['$items.price', 0, -1] },
                timeStamp: '$createdBy.date',
                employee: {
                    _id: '$createdBy.user._id',
                    name: {
                        en: { $concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en'] },
                        ar: { $concat: ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar'] }
                    }
                }
            })
        });

        if (search || search === '') {
            pipeLine.push({
                $match: aggregateHelper.getSearchMatch(searchFieldsArray, search)
            });
        }

        aggregation = PriceSurveyModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function(err, response) {
            if (err) {
                return next(err);
            }

            res.status(200).send(response);
        });
    }

    access.getReadAccess(req, ACL_MODULES.SHELF_SHARES, function(err, allowed, personnel) {
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

const getById = (req, res, next) => {
    function queryRun() {
        var id = ObjectId(req.params.id);

        console.log(id);

        aggregateById({ id: id }, function(err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });
    }

    access.getReadAccess(req, ACL_MODULES.PRICE_SURVEY, function(err, allowed) {
        if (err) {
            return next(err);
        }
        if (!allowed) {
            err = new Error();
            err.status = 403;

            return next(err);
        }

        queryRun();
    });
};

module.exports = {
    create,
    getAll,
    getBrands,
    getById,
    update,
    removeItem
};
