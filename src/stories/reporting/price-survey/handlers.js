const async = require('async');
const _ = require('lodash');
const ActivityLog = require('./../../push-notifications/activityLog');
const access = require('../../../helpers/access')();
const CONTENT_TYPES = require('../../../public/js/constants/contentType.js');
const CONSTANTS = require('../../../constants/mainConstants');
const ACL_MODULES = require('../../../constants/aclModulesNames');
const FilterMapper = require('../../../helpers/filterMapper');
const AggregationHelper = require('../../../helpers/aggregationCreater');
const PriceSurveyModel = require('./../../../types/priceSurvey/model');
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
            totalMinPrice: 1,
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
            'brand.name.en',
            'brand.name.ar'
        ];

        delete filter.globalSearch;
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

        aggregateHelper = new AggregationHelper($defProjection);

        pipeLine.push({
            $match: queryObject
        });

        if (employeeFilter) {
            pipeLine.push({
                $match: {
                    'createdBy.user': employeeFilter
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'createdBy.user',
            addProjection: ['position', 'country', 'region', 'subRegion'],
            isArray: false
        }));

        if (queryObject.country) {
            pipeLine.push({
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
            pipeLine.push({
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
            pipeLine.push({
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
            pipeLine.push({
                $match: {
                    'createdBy.user.position': positionFilter
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'categories',
            key: 'category',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'variants',
            key: 'variant',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'branches',
            key: 'branch',
            isArray: false,
            addProjection: ['outlet', 'retailSegment', 'subRegion']
        }));

        if (queryObject.outlet) {
            pipeLine.push({
                $match: {
                    'branch.outlet': queryObject.outlet
                }
            });
        }

        if (queryObject.subRegion) {
            pipeLine.push({
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

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key: 'branch.subRegion',
            isArray: false,
            addProjection: ['parent'],
            includeSiblings: {
                branch: {
                    _id: 1,
                    name: 1
                }
            }
        }));

        if (queryObject.subRegion) {
            pipeLine.push({
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

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'outlets',
            key: 'outlet',
            isArray: false,
            addProjection: ['retailSegments']
        }));

        if (queryObject.retailSegment) {
            pipeLine.push({
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

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key: 'country',
            isArray: false,
            addMainProjection: ['currency']
        }));

        pipeLine.push({
            $unwind: '$items'
        });

        pipeLine.push({
            $project: {
                category: 1,
                variant: 1,
                branch: 1,
                currency: 1,
                brand: '$items.brand',
                size: '$items.size',
                price: '$items.price'
            }
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'brands',
            key: 'brand',
            addProjection: 'ourCompany',
            isArray: false
        }));

        pipeLine.push({
            $match: aggregateHelper.getSearchMatch(searchFieldsArray, filterSearch)
        });

        pipeLine.push({
            $group: {
                _id: {
                    brandId: '$brand._id',
                    categoryId: '$category._id',
                    variantId: '$variant._id',
                    branchId: '$branch._id',
                    size: '$size'
                },

                currency: { $first: '$currency' },

                category: { $first: '$category' },
                brand: { $first: '$brand' },
                variant: { $first: '$variant' },
                branch: { $first: '$branch' },
                size: { $first: '$size' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
                avgPrice: { $avg: '$price' }
            }
        });

        pipeLine.push({
            $project: {
                _id: 0,
                brand: 1,
                category: 1,
                variant: 1,
                branch: 1,
                size: 1,
                minPrice: 1,
                maxPrice: 1,
                avgPrice: 1,
                currency: 1
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
                minPrice: '$data.minPrice',
                maxPrice: '$data.maxPrice',
                avgPrice: '$data.avgPrice',
                currency: '$data.currency',
                branchesAll: '$branches'
            }
        });

        pipeLine.push({
            $group: {
                _id: {
                    categoryId: '$category._id',
                    brandId: '$brand._id',
                    variantId: '$variant._id',
                    size: '$size'
                },

                category: { $first: '$category' },
                brand: { $first: '$brand' },
                variant: { $first: '$variant' },
                size: { $first: '$size' },

                branches: {
                    $addToSet: {
                        branch: '$branch',
                        minPrice: '$minPrice',
                        maxPrice: '$maxPrice',
                        avgPrice: '$avgPrice',
                        currency: '$currency'
                    }
                },
                branchCount: { $sum: 1 },
                totalMinPrice: { $min: '$minPrice' },
                totalMaxPrice: { $max: '$maxPrice' },
                totalAvgPrice: { $avg: '$avgPrice' },
                currency: { $first: '$currency' },
                branchesAll: { $first: '$branchesAll' }
            }
        });

        pipeLine.push({
            $project: {
                _id: 0,
                category: 1,
                brand: 1,
                variant: 1,
                branches: 1,
                size: 1,
                totalMinPrice: 1,
                totalMaxPrice: 1,
                totalAvgPrice: 1,
                currency: 1,
                branchCount: 1,
                branchesAll: 1
            }
        });

        pipeLine.push({
            $group: {
                _id: {
                    categoryId: '$category._id',
                    brandId: '$brand._id'
                },

                category: { $first: '$category' },
                brand: { $first: '$brand' },
                variants: {
                    $push: {
                        variant: '$variant',
                        branches: '$branches',
                        size: '$size',
                        totalMinPrice: '$totalMinPrice',
                        totalMaxPrice: '$totalMaxPrice',
                        totalAvgPrice: '$totalAvgPrice',
                        currency: '$currency'
                    }
                },

                maxBranchCount: { $max: '$branchCount' },
                branchesAll: { $first: '$branchesAll' },
                currency: { $last: '$currency' }
            }
        });

        pipeLine.push({
            $sort: {
                'brand.ourCompany': -1,
                'brand.name': 1
            }
        });

        pipeLine.push({
            $group: {
                _id: '$category._id',
                category: {
                    $first: '$category'
                },

                brands: {
                    $push: {
                        variants: '$variants',
                        brand: '$brand'
                    }
                },

                maxBranchCount: { $max: '$maxBranchCount' },
                branchesAll: { $first: '$branchesAll' },
                currency: { $last: '$currency' }
            }
        });

        /*pipeLine = _.union(pipeLine, aggregateHelper.setTotal());

         pipeLine.push({
         $sort: sort
         });

         pipeLine.push({
         $skip: skip
         });

         pipeLine.push({
         $limit: limit
         });

         pipeLine = _.union(pipeLine, aggregateHelper.groupForUi());*/

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            searchFieldsArray: searchFieldsArray,
            filterSearch: filterSearch,
            skip: skip,
            limit: limit,
            sort: sort
        }));

        aggregation = PriceSurveyModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function(err, response) {
            console.log(response[0]);
            if (err) {
                return next(err);
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
            console.log(response[0]);

            response = response && response[0] ? response[0] : { data: [], total: 0 };


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
                    'items.size': sizeFilter
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
                    brand: 1,
                    price: 1,
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
};
