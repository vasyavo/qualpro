'use strict';

var mongoose = require('mongoose');
var Filters = function (db, redis) {
    var FILTERS_CONSTANTS = require('../public/js/constants/filters');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var FilterMapper = require('../helpers/filterMapper');
    var async = require('async');
    var self = this;

    var notificationSchema = mongoose.Schemas[CONTENT_TYPES.NOTIFICATIONS];
    var personnelSchema = mongoose.Schemas[CONTENT_TYPES.PERSONNEL];
    var PersonnelModel = db.model(CONTENT_TYPES.PERSONNEL, personnelSchema);
    var objectiveSchema = mongoose.Schemas[CONTENT_TYPES.OBJECTIVES];
    var inStoreTasksSchema = mongoose.Schemas[CONTENT_TYPES.INSTORETASKS];
    var itemSchema = mongoose.Schemas.item;
    var activityListSchema = mongoose.Schemas[CONTENT_TYPES.ACTIVITYLIST];
    var planogramSchema = mongoose.Schemas[CONTENT_TYPES.PLANOGRAM];
    var questionnarySchema = mongoose.Schemas[CONTENT_TYPES.QUESTIONNARIES];
    var competitorSchema = mongoose.Schemas[CONTENT_TYPES.COMPETITORITEM];
    var contractsYearlySchema = mongoose.Schemas[CONTENT_TYPES.CONTRACTSYEARLY];
    var contractsSecondarySchema = mongoose.Schemas[CONTENT_TYPES.CONTRACTSSECONDARY];
    var promotionsSchema = mongoose.Schemas[CONTENT_TYPES.PROMOTIONS];
    var documentsSchema = mongoose.Schemas[CONTENT_TYPES.DOCUMENTS];
    var notesSchema = mongoose.Schemas[CONTENT_TYPES.NOTES];
    var shelfSharesSchema = mongoose.Schemas[CONTENT_TYPES.SHELFSHARES];
    var priceSurveySchema = mongoose.Schemas[CONTENT_TYPES.PRICESURVEY];
    var _ = require('../node_modules/underscore');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var $defProjection = {
        _id          : 1,
        origin       : 1,
        country      : 1,
        retailSegment: 1,
        region       : 1,
        subRegion    : 1,
        outlet       : 1,
        branch       : 1,
        brand        : 1,
        variant      : 1,
        category     : 1,
        product      : 1,
        editedBy     : 1,
        createdBy    : 1,
        archived     : 1,
        type         : 1,
        status       : 1,
        configuration: 1,
        priority     : 1,
        assignedTo   : 1,
        location     : 1,
        name         : 1,
        position     : 1
    };

    function mapFiltersValues(resultObject, constants) {
        return _.map(resultObject || [], function (element) {
            var constantsElement;

            if (element) {
                var name;
                if (_.isArray(constants)) {
                    constantsElement = _.findWhere(constants, {_id: element});
                } else {
                    constantsElement = constants[element] || constants[element.toUpperCase()];
                }
                if (constantsElement && constantsElement.name) {
                    name = constantsElement.name && constantsElement.name.en ? constantsElement.name : {en: constantsElement.name};
                } else {
                    name = {en: constantsElement};
                }

                element = {
                    _id : element,
                    name: name
                };
            }

            return element;
        });
    }

    function domainPileLine(options) {
        var filter = options.filter;
        var pipeLine = [];
        if (filter.country) {
            pipeLine.push({
                $match: {'country._id': filter.country}
            });
            pipeLine.push({
                $match: {
                    $or: [
                        {'region.parent': {$exists: false}},
                        {'region.parent': filter.country}
                    ]
                }
            });
        }

        if (filter.region) {
            pipeLine.push({
                $match: {'region._id': filter.region}
            });
            pipeLine.push({
                $match: {
                    $or: [
                        {'subRegion.parent': {$exists: false}},
                        {'subRegion.parent': filter.region}
                    ]
                }
            });
        }

        if (filter.subRegion) {
            pipeLine.push({
                $match: {'subRegion._id': filter.subRegion}
            });
            pipeLine.push({
                $match: {
                    $or: [
                        {'branch.subRegion': {$exists: false}},
                        {'branch.subRegion': filter.subRegion}
                    ]
                }
            });
        }

        if (filter.branch) {
            pipeLine.push({
                $match: {'branch._id': filter.branch}
            });
        }
        return pipeLine;
    }

    function redisFilters(options, callback) {
        var filterExists = options.filterExists || false;
        var filtersObject = options.filtersObject || {};
        var personnelId = options.personnelId;
        var contentType = options.contentType;
        var currentSelected = options.currentSelected;

        var key = personnelId + '.' + contentType;

        if (filterExists) {
            redis.cacheStore.readFromStorage(key, function (err, value) {
                var valueJSON;

                if (err) {
                    return callback(err);
                }

                if (value && currentSelected) {
                    valueJSON = JSON.parse(value);
                    filtersObject[currentSelected] = valueJSON[currentSelected];
                }

                redis.cacheStore.writeToStorage(key, JSON.stringify(filtersObject), '864000');

                return callback(null, filtersObject);
            });
        } else {
            redis.cacheStore.writeToStorage(key, JSON.stringify(filtersObject), '864000');

            return callback(null, filtersObject);
        }
    }

    function getObjectiveFilters(req, res, next, cb) {
        var CONSTANTS = require('../public/js/constants/otherConstants');
        var $defProjection = {
            _id          : 1,
            country      : 1,
            retailSegment: 1,
            region       : 1,
            subRegion    : 1,
            outlet       : 1,
            branch       : 1,
            editedBy     : 1,
            createdBy    : 1,
            archived     : 1,
            objectiveType: 1,
            status       : 1,
            priority     : 1,
            assignedTo   : 1
        };
        var ObjectiveModel = db.model(CONTENT_TYPES.OBJECTIVES, objectiveSchema);

        var query = req.query;

        var queryFilter = query.filter || {};

        var filterMapper = new FilterMapper();

        var currentSelected = query.current;
        var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);

        var filter = filterMapper.mapFilter({
            contentType: CONTENT_TYPES.OBJECTIVES,
            filter     : query.filter,
            personnel  : req.personnelModel
        });

        var aggregationHelper = new AggregationHelper($defProjection, filter);

        var beforeFilter = _.pick(filter, 'priority', 'objectiveType', 'status', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', '$and', '$or', 'assignedTo', 'createdBy');
        var afterFilter = _.pick(filter, 'position');
        var aggregation;
        var pipeLine = [];
        var personnelFilter;

        if (filter && filter.assignedTo) {
            personnelFilter = filter.assignedTo;
            delete filter.assignTo;
        }

        var domainsArray = ['country', 'region', 'subRegion'];

        pipeLine.push({
            $match: beforeFilter
        });

        domainsArray.forEach(function (key) {
            pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                from         : 'domains',
                key          : key,
                as           : key,
                addProjection: ['parent']
            }));
        });

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from: 'retailSegments',
            key : 'retailSegment',
            as  : 'retailSegment'
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from: 'outlets',
            key : 'outlet',
            as  : 'outlet'
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from: 'branches',
            key : 'branch',
            as  : 'branch'
        }));

        if (personnelFilter) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'createdBy.user': personnelFilter
                        },
                        {
                            assignedTo: personnelFilter
                        }
                    ]
                }
            });
        }

        pipeLine.push({
            $unwind: {
                path                      : '$assignedTo',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from         : 'personnels',
            key          : 'createdBy.user',
            as           : 'createdBy',
            isArray      : false,
            addProjection: ['position']
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from         : 'personnels',
            key          : 'assignedTo',
            as           : 'assignedTo',
            addProjection: ['position']
        }));

        pipeLine = _.union(pipeLine, domainPileLine({
            filter: filter
        }));

        pipeLine.push({
            $project: {
                objectiveType: 1,
                country      : 1,
                region       : 1,
                subRegion    : 1,
                retailSegment: 1,
                outlet       : 1,
                branch       : 1,
                priority     : 1,
                status       : 1,
                position     : ['$createdBy.position', '$assignedTo.position']
            }
        });

        pipeLine.push({
            $match: afterFilter
        });

        pipeLine.push({
            $unwind: {
                path                      : '$position',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from   : 'positions',
            key    : 'position',
            as     : 'position',
            isArray: false
        }));

        pipeLine.push({
            $project: {
                country      : 1,
                region       : 1,
                subRegion    : 1,
                retailSegment: 1,
                outlet       : 1,
                branch       : 1,
                position     : 1,
                objectiveType: 1,
                priority     : 1,
                status       : 1
            }
        });

        pipeLine.push({
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
        });

        pipeLine.push({
            $group: {
                _id          : null,
                country      : {$addToSet: '$country'},
                region       : {$addToSet: '$region'},
                subRegion    : {$addToSet: '$subRegion'},
                retailSegment: {$addToSet: '$retailSegment'},
                outlet       : {$addToSet: '$outlet'},
                branch       : {$addToSet: '$branch'},
                priority     : {$addToSet: '$priority'},
                position     : {$addToSet: '$position'},
                objectiveType: {$addToSet: '$objectiveType'},
                status       : {$addToSet: '$status'}
            }
        });

        aggregation = ObjectiveModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                if (cb && typeof cb === 'function') {
                    return cb(err);
                }

                return next(err);
            }

            result = result[0] || {};

            result = {
                country      : result.country || [],
                region       : result.region || [],
                subRegion    : result.subRegion || [],
                retailSegment: result.retailSegment || [],
                outlet       : result.outlet || [],
                branch       : result.branch || [],
                position     : result.position || [],
                priority     : mapFiltersValues(result.priority, CONSTANTS.OBJECTIVES_PRIORITY),
                objectiveType: mapFiltersValues(result.objectiveType, CONSTANTS.OBJECTIVES_TYPE),
                status       : mapFiltersValues(result.status, CONSTANTS.OBJECTIVESTATUSES_FOR_UI)
            };
            if (cb && cb instanceof Function) {
                return cb(null, result);
            }

            redisFilters({
                currentSelected: currentSelected,
                filterExists   : filterExists,
                filtersObject  : result,
                personnelId    : req.personnelModel._id,
                contentType    : CONTENT_TYPES.OBJECTIVES
            }, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    }

    function getInStoreTaskFilters(req, res, next, cb) {
        var CONSTANTS = require('../public/js/constants/otherConstants');
        var $defProjection = {
            _id          : 1,
            country      : 1,
            retailSegment: 1,
            region       : 1,
            subRegion    : 1,
            outlet       : 1,
            branch       : 1,
            editedBy     : 1,
            createdBy    : 1,
            archived     : 1,
            status       : 1,
            priority     : 1,
            assignedTo   : 1
        };
        var filterMapper = new FilterMapper();
        var ObjectiveModel = db.model(CONTENT_TYPES.OBJECTIVES, objectiveSchema);
        var query = req.query;
        var queryFilter = query.filter || {};
        var currentSelected = query.current;
        var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);

        var filter = filterMapper.mapFilter({
            filter   : queryFilter,
            personnel: req.personnelModel
        });

        var aggregationHelper = new AggregationHelper($defProjection, filter);

        var beforeFilter = _.pick(filter, 'priority', 'status', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', '$and', '$or', 'assignedTo', 'createdBy');
        var afterFilter = _.pick(filter, 'position');
        var aggregation;
        var pipeLine = [];

        var domainsArray = ['country', 'region', 'subRegion'];

        pipeLine.push({
            $match: beforeFilter
        });

        domainsArray.forEach(function (key) {
            pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                from         : 'domains',
                key          : key,
                as           : key,
                addProjection: ['parent']
            }));
        });

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from: 'retailSegments',
            key : 'retailSegment',
            as  : 'retailSegment'
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from: 'outlets',
            key : 'outlet',
            as  : 'outlet'
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from: 'branches',
            key : 'branch',
            as  : 'branch'
        }));

        pipeLine.push({
            $unwind: {
                path                      : '$assignedTo',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from         : 'personnels',
            key          : 'createdBy.user',
            as           : 'createdBy',
            isArray      : false,
            addProjection: ['position']
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from         : 'personnels',
            key          : 'assignedTo',
            as           : 'assignedTo',
            isArray      : false,
            addProjection: ['position']
        }));

        pipeLine = _.union(pipeLine, domainPileLine({
            filter: filter
        }));

        pipeLine.push({
            $project: {
                country      : 1,
                region       : 1,
                subRegion    : 1,
                retailSegment: 1,
                outlet       : 1,
                branch       : 1,
                priority     : 1,
                status       : 1,
                position     : ['$createdBy.position', '$assignedTo.position']
            }
        });

        pipeLine.push({
            $match: afterFilter
        });

        pipeLine.push({
            $unwind: {
                path                      : '$position',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from   : 'positions',
            key    : 'position',
            as     : 'position',
            isArray: false
        }));

        pipeLine.push({
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
        });

        pipeLine.push({
            $project: {
                country      : 1,
                region       : 1,
                subRegion    : 1,
                retailSegment: 1,
                outlet       : 1,
                branch       : 1,
                position     : 1,
                priority     : 1,
                status       : 1
            }
        });
        pipeLine.push({
            $group: {
                _id          : null,
                country      : {$addToSet: '$country'},
                region       : {$addToSet: '$region'},
                subRegion    : {$addToSet: '$subRegion'},
                retailSegment: {$addToSet: '$retailSegment'},
                outlet       : {$addToSet: '$outlet'},
                branch       : {$addToSet: '$branch'},
                priority     : {$addToSet: '$priority'},
                position     : {$addToSet: '$position'},
                status       : {$addToSet: '$status'}
            }
        });
        aggregation = ObjectiveModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                if (cb && typeof cb === 'function') {
                    return cb(err);
                }
                return next(err);
            }

            result = result[0] || {};

            result = {
                country      : result.country || [],
                region       : result.region || [],
                subRegion    : result.subRegion || [],
                retailSegment: result.retailSegment || [],
                outlet       : result.outlet || [],
                branch       : result.branch || [],
                position     : result.position || [],
                priority     : mapFiltersValues(result.priority, CONSTANTS.OBJECTIVES_PRIORITY),
                status       : mapFiltersValues(result.status, CONSTANTS.OBJECTIVESTATUSES_FOR_UI)
            };
            if (cb && cb instanceof Function) {
                return cb(null, result);
            }
            redisFilters({
                currentSelected: currentSelected,
                filterExists   : filterExists,
                filtersObject  : result,
                personnelId    : req.personnelModel._id,
                contentType    : CONTENT_TYPES.INSTORETASKS
            }, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.brandingAndDisplayFilters = function (req, res, next) {
        var CONSTANTS = require('../public/js/constants/otherConstants');
        var STATUSES = CONSTANTS.PROMOTION_UI_STATUSES;
        var BrandingAndDisplayModel = db.model(CONTENT_TYPES.BRANDINGANDDISPLAY, mongoose.Schemas[CONTENT_TYPES.BRANDINGANDDISPLAY]);
        var query = req.query;
        var filter = query.filter || {};
        var currentSelected = query.current;
        var filterExists = Object.keys(filter).length && !(Object.keys(filter).length === 1 && filter.archived);
        var filterMapper = new FilterMapper();

        var aggregation;
        var pipeLine = [];

        var aggregateHelper;

        var $defProjection = {
            _id          : 1,
            description  : 1,
            displayType  : 1,
            dateStart    : 1,
            dateEnd      : 1,
            attachments  : 1,
            category     : 1,
            branch       : 1,
            country      : 1,
            region       : 1,
            subRegion    : 1,
            retailSegment: 1,
            outlet       : 1,
            createdBy    : 1,
            editedBy     : 1,
            personnel    : 1,
            status       : 1,
            parent       : 1,
            position     : 1,
            publisher    : 1
        };

        var positionFilter;

        filter = filterMapper.mapFilter({
            filter   : filter,
            personnel: req.personnelModel
        });

        if (filter.position) {
            positionFilter = {position: filter.position};

            delete filter.position;
        }

        aggregateHelper = new AggregationHelper($defProjection, filter);

        pipeLine.push({
            $match: {
                status: {
                    $ne: 'expired'
                }
            }
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'categories',
            key : 'category'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from             : 'branches',
            key              : 'branch',
            addMainProjection: ['retailSegment', 'outlet', 'subRegion']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from             : 'domains',
            key              : 'subRegion',
            addMainProjection: ['parent']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from             : 'domains',
            key              : 'parent',
            as               : 'region',
            addMainProjection: ['parent']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'parent',
            as  : 'country'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'retailSegments',
            key : 'retailSegment'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'outlets',
            key : 'outlet'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from             : 'personnels',
            key              : 'personnel',
            addMainProjection: ['position'],
            nameFields       : ['firstName', 'lastName']
        }));

        pipeLine.push({
            $lookup: {
                from        : 'personnels',
                localField  : 'createdBy.user',
                foreignField: '_id',
                as          : 'createdBy.user'
            }
        });

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                createdBy: {
                    date: 1,
                    user: {$arrayElemAt: ['$createdBy.user', 0]}
                }
            })
        });

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                position : {
                    $setUnion: ['$position', ['$createdBy.user.position']]
                },
                publisher: {
                    _id : '$createdBy.user._id',
                    name: {
                        en: {$concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en']},
                        ar: {$concat: ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar']}
                    }
                }
            })
        });

        if (positionFilter) {
            pipeLine.push({
                $match: positionFilter
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'positions',
            key : 'position'
        }));

        /*pipeLine.push({
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
                path                      : '$personnel',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeLine.push({
            $unwind: {
                path                      : '$position',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeLine.push({
            $unwind: {
                path                      : '$category',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeLine.push({
            $group: {
                _id          : null,
                country      : {$addToSet: '$country'},
                category     : {$addToSet: '$category'},
                personnel    : {$addToSet: '$personnel'},
                region       : {$addToSet: '$region'},
                subRegion    : {$addToSet: '$subRegion'},
                retailSegment: {$addToSet: '$retailSegment'},
                outlet       : {$addToSet: '$outlet'},
                branch       : {$addToSet: '$branch'},
                publisher    : {$addToSet: '$publisher'},
                position     : {$addToSet: '$position'},
                status       : {$addToSet: '$status'}
            }
        });

        aggregation = BrandingAndDisplayModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {
                category     : result.category || [],
                country      : result.country && _.uniq(_.flatten(result.country)) || [],
                region       : result.region && _.uniq(_.flatten(result.region)) || [],
                subRegion    : result.subRegion && _.uniq(_.flatten(result.subRegion)) || [],
                retailSegment: result.retailSegment && _.uniq(_.flatten(result.retailSegment)) || [],
                outlet       : result.outlet && _.uniq(_.flatten(result.outlet)) || [],
                branch       : result.branch && _.uniq(_.flatten(result.branch)) || [], position: result.position || [],
                publisher    : result.publisher || [],
                status       : mapFiltersValues(result.status, STATUSES),
                personnel    : result.personnel || []
            };

            Object.keys(result).forEach(function (key) {
                if (result[key]) {
                    var i = result[key].length - 1;
                    for (i; i >= 0; i--) {
                        if (!result[key][i] || !result[key][i].name) {
                            result[key].splice(i, 1);
                        }
                    }
                }
            });

            redisFilters({
                currentSelected: currentSelected,
                filterExists   : filterExists,
                filtersObject  : result,
                personnelId    : req.personnelModel._id,
                contentType    : CONTENT_TYPES.BRANDINGANDDISPLAY
            }, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.shelfSharesFilters = function (req, res, next) {
        var shelfSharesModel = db.model(CONTENT_TYPES.SHELFSHARES, shelfSharesSchema);
        var query = req.query;
        var filterMapper = new FilterMapper();
        var queryFilter = query.filter || {};

        var currentSelected = query.current;
        var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);

        var filter = filterMapper.mapFilter({
            filter   : queryFilter,
            personnel: req.personnelModel
        });
        var pipeLine = [];
        var aggregation;
        var personnelFilter;
        var positionFilter;
        var brandFilter;
        var aggregateHelper;
        $defProjection = _.extend({
            brands: 1
        }, $defProjection);

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

        aggregateHelper = new AggregationHelper($defProjection, filter);

        if (personnelFilter) {
            pipeLine.push({
                $match: {
                    'createdBy.user': personnelFilter
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'categories',
            key    : 'category',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'country',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'region',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'subRegion',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'retailSegments',
            key    : 'retailSegment',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'outlets',
            key    : 'outlet',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'branches',
            key    : 'branch',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            addProjection  : ['position', 'firstName', 'lastName'],
            isArray        : false,
            includeSiblings: {
                createdBy: {
                    date: 1
                }
            }
        }));

        if (positionFilter) {
            pipeLine.push({
                $match: {
                    'createdBy.user.position': positionFilter
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'positions',
            key            : 'createdBy.user.position',
            isArray        : false,
            includeSiblings: {
                createdBy: {
                    date: 1,
                    user: {
                        _id      : 1,
                        position : 1,
                        firstName: 1,
                        lastName : 1
                    }
                }
            }
        }));

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                createdBy: {
                    date: 1,
                    user: {
                        _id : 1,
                        name: {
                            en: {$concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en']},
                            ar: {$concat: ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar']}
                        }
                    }
                },
                position : {$arrayElemAt: ['$createdBy.user.position', 0]}
            })
        });

        pipeLine.push({
            $unwind: {
                path                      : '$brands',
                preserveNullAndEmptyArrays: true
            }
        });

        if (brandFilter) {
            pipeLine.push({
                $match: {
                    'brands.brand': brandFilter
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'brands',
            key    : 'brands.brand',
            as     : 'brand',
            isArray: false
        }));

        pipeLine.push({
            $group: {
                _id          : null,
                brand        : {$addToSet: '$brand'},
                category     : {$addToSet: '$category'},
                brands       : {$addToSet: '$brands'},
                country      : {$addToSet: '$country'},
                region       : {$addToSet: '$region'},
                subRegion    : {$addToSet: '$subRegion'},
                retailSegment: {$addToSet: '$retailSegment'},
                outlet       : {$addToSet: '$outlet'},
                position     : {$addToSet: '$position'},
                branch       : {$addToSet: '$branch'},
                personnel    : {$addToSet: '$createdBy.user'}
            }
        });
        aggregation = shelfSharesModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {
                category     : result.category || [],
                brand        : result.brand || [],
                country      : result.country || [],
                region       : result.region || [],
                subRegion    : result.subRegion || [],
                retailSegment: result.retailSegment || [],
                outlet       : result.outlet || [],
                branch       : result.branch || [],
                position     : result.position || [],
                personnel    : result.personnel || []
            };

            redisFilters({
                currentSelected: currentSelected,
                filterExists   : filterExists,
                filtersObject  : result,
                personnelId    : req.personnelModel._id,
                contentType    : CONTENT_TYPES.SHELF_SHARE
            }, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.priceSurveyFilters = function (req, res, next) {
        var priceSurveyModel = db.model(CONTENT_TYPES.PRICESURVEY, priceSurveySchema);
        var query = req.query;
        var queryFilter = query.filter || {};
        var filterMapper = new FilterMapper();
        var currentSelected = query.current;
        var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        var filter = filterMapper.mapFilter({
            filter   : queryFilter,
            personnel: req.personnelModel
        });
        var pipeLine = [];
        var aggregation;
        var personnelFilter;
        var positionFilter;
        var aggregateHelper;

        if (filter.personnel) {
            personnelFilter = filter.personnel;
            delete filter.personnel;
        }

        if (filter.position) {
            positionFilter = filter.position;
            delete filter.position;
        }

        aggregateHelper = new AggregationHelper($defProjection, filter);

        if (personnelFilter) {
            pipeLine.push({
                $match: {
                    'createdBy.user': personnelFilter
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'categories',
            key    : 'category',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'country',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'region',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'subRegion',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'retailSegments',
            key    : 'retailSegment',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'outlets',
            key    : 'outlet',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'branches',
            key    : 'branch',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            addProjection  : ['position', 'firstName', 'lastName'],
            isArray        : false,
            includeSiblings: {
                createdBy: {
                    date: 1
                }
            }
        }));

        if (positionFilter) {
            pipeLine.push({
                $match: {
                    'createdBy.user.position': positionFilter
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'positions',
            key            : 'createdBy.user.position',
            isArray        : false,
            includeSiblings: {
                createdBy: {
                    date: 1,
                    user: {
                        _id      : 1,
                        position : 1,
                        firstName: 1,
                        lastName : 1
                    }
                }
            }
        }));

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                createdBy: {
                    date: 1,
                    user: {
                        _id : 1,
                        name: {
                            en: {$concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en']},
                            ar: {$concat: ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar']}
                        }
                    }
                },
                position : {$arrayElemAt: ['$createdBy.user.position', 0]}
            })
        });

        pipeLine.push({
            $group: {
                _id          : null,
                branch       : {$addToSet: '$branch'},
                outlet       : {$addToSet: '$outlet'},
                retailSegment: {$addToSet: '$retailSegment'},
                subRegion    : {$addToSet: '$subRegion'},
                region       : {$addToSet: '$region'},
                country      : {$addToSet: '$country'},
                category     : {$addToSet: '$category'},
                position     : {$addToSet: '$position'},
                personnel    : {$addToSet: '$createdBy.user'}
            }
        });

        aggregation = priceSurveyModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {
                branch       : result.branch || [],
                outlet       : result.outlet || [],
                retailSegment: result.retailSegment || [],
                subRegion    : result.subRegion || [],
                region       : result.region || [],
                country      : result.country || [],
                category     : result.category || [],
                position     : result.position || [],
                personnel    : result.personnel || []
            };

            redisFilters({
                currentSelected: currentSelected,
                filterExists   : filterExists,
                filtersObject  : result,
                personnelId    : req.personnelModel._id,
                contentType    : CONTENT_TYPES.PRICESURVEY
            }, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.itemsAndPricesFilters = function (req, res, next) {
        var ItemModel = db.model('item', itemSchema);
        var query = req.query;
        var queryFilter = query.filter || {};

        var currentSelected = query.current;
        var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);

        var filterMapper = new FilterMapper();
        var filter = filterMapper.mapFilter({
            filter   : queryFilter,
            personnel: req.personnelModel
        });

        var aggregateHelper = new AggregationHelper($defProjection, filter);

        var beforeFilter = _.pick(filter, 'country', 'location', 'category', 'variant', 'archived');
        var afterFilter = _.pick(filter, 'origin');
        var pipeline = [];
        var aggregation;

        pipeline.push({
            $match: beforeFilter
        });

        pipeline = _.union(pipeline, aggregateHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'country',
            as     : 'country',
            isArray: false
        }));

        pipeline = _.union(pipeline, aggregateHelper.aggregationPartMaker({
            from   : 'categories',
            key    : 'category',
            as     : 'category',
            isArray: false
        }));

        pipeline = _.union(pipeline, aggregateHelper.aggregationPartMaker({
            from   : 'variants',
            key    : 'variant',
            as     : 'variant',
            isArray: false
        }));

        pipeline.push({
            $unwind: {
                path                      : '$location',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeline = _.union(pipeline, aggregateHelper.aggregationPartMaker({
            from   : 'outlets',
            key    : 'location.outlet',
            as     : 'outlet',
            isArray: false
        }));

        pipeline = _.union(pipeline, aggregateHelper.aggregationPartMaker({
            from   : 'retailSegments',
            key    : 'location.retailSegment',
            as     : 'retailSegment',
            isArray: false
        }));

        pipeline.push({
            $match: afterFilter
        });

        pipeline.push({
            $unwind: {
                path                      : '$origin',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeline = _.union(pipeline, aggregateHelper.aggregationPartMaker({
            from   : 'origins',
            key    : 'origin',
            as     : 'origin',
            isArray: false
        }));

        pipeline.push({
            $group: {
                _id          : null,
                country      : {$addToSet: '$country'},
                retailSegment: {$addToSet: '$retailSegment'},
                outlet       : {$addToSet: '$outlet'},
                category     : {$addToSet: '$category'},
                variant      : {$addToSet: '$variant'},
                origin       : {$addToSet: '$origin'}
            }
        });

        aggregation = ItemModel.aggregate(pipeline);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            var response;

            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {
                country      : result.country || [],
                retailSegment: result.retailSegment || [],
                outlet       : result.outlet || [],
                category     : result.category || [],
                variant      : result.variant || [],
                origin       : result.origin || []
            };

            redisFilters({
                currentSelected: currentSelected,
                filterExists   : filterExists,
                filtersObject  : result,
                personnelId    : req.personnelModel._id,
                contentType    : CONTENT_TYPES.ITEM
            }, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.itemsToOutletCountry = function (req, res, next) {
        var ItemModel = db.model('item', itemSchema);
        var domainSchema = mongoose.Schemas[CONTENT_TYPES.DOMAIN];
        var DomainModel = db.model(CONTENT_TYPES.DOMAIN, domainSchema);
        var personnel = req.personnelModel;
        var pipeLine = [];
        var aggregateHelper = new AggregationHelper($defProjection);
        var aggregation;

        if (personnel.country.length) {
            pipeLine.push({
                $match: {
                    country: {
                        $in: personnel.country
                    }
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'country',
            isArray: false
        }));

        pipeLine.push({
            $project: {
                _id : '$country._id',
                name: '$country.name'
            }
        });

        pipeLine.push({
            $group: {
                _id : '$_id',
                name: {$first: '$name'}
            }
        });

        aggregation = ItemModel.aggregate(pipeLine);
        aggregation.options = {
            allowDiskUse: true
        };
        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });
    };

    this.activityListFilters = function (req, res, next) {
        var CONSTANTS = require('../constants/activityTypes');
        var $defProjection = {
            _id          : 1,
            country      : 1,
            retailSegment: 1,
            region       : 1,
            subRegion    : 1,
            outlet       : 1,
            createdBy    : 1,
            actionType   : 1,
            position     : 1,
            module       : 1
        };
        var activityListModel = db.model(CONTENT_TYPES.ACTIVITYLIST, activityListSchema);
        var query = req.query;
        var queryFilter = query.filter || {};

        var filterMapper = new FilterMapper();

        var currentSelected = query.current;
        var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);

        var filter = filterMapper.mapFilter({
            filter   : queryFilter,
            personnel: req.personnelModel
        });

        var aggregationHelper = new AggregationHelper($defProjection, filter);

        var beforeFilter = _.pick(filter, 'actionType', 'country', 'region', 'subRegion', 'branch');
        var afterFilter = _.pick(filter, 'retailSegment', 'outlet', 'position');
        var aggregation;
        var pipeLine = [];

        var domainsArray = ['country', 'region', 'subRegion'];

        pipeLine.push({
            $match: beforeFilter
        });

        domainsArray.forEach(function (key) {
            pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                from: 'domains',
                key : key,
                as  : key
            }));
        });

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from             : 'branches',
            key              : 'branch',
            addMainProjection: ['retailSegment', 'outlet']
        }));

        pipeLine.push({
            $lookup: {
                from        : 'personnels',
                localField  : 'createdBy.user',
                foreignField: '_id',
                as          : 'createdBy.user'
            }
        });

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from   : 'modules',
            key    : 'module',
            isArray: false
        }));

        pipeLine.push({
            $project: aggregationHelper.getProjection({
                createdBy: {
                    date: 1,
                    user: {$arrayElemAt: ['$createdBy.user', 0]}
                }
            })
        });

        pipeLine = _.union(pipeLine, domainPileLine({
            filter: filter
        }));

        pipeLine.push({
            $project: aggregationHelper.getProjection({
                position: '$createdBy.user.position'
            })
        });

        pipeLine.push({
            $match: afterFilter
        });

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from   : 'positions',
            key    : 'position',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from: 'retailSegments',
            key : 'retailSegment'
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from: 'outlets',
            key : 'outlet'
        }));

        pipeLine.push({
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
        });

        pipeLine.push({
            $group: {
                _id          : null,
                country      : {$addToSet: '$country'},
                region       : {$addToSet: '$region'},
                subRegion    : {$addToSet: '$subRegion'},
                branch       : {$addToSet: '$branch'},
                retailSegment: {$addToSet: '$retailSegment'},
                outlet       : {$addToSet: '$outlet'},
                actionType   : {$addToSet: '$actionType'},
                position     : {$addToSet: '$position'},
                module       : {$addToSet: '$module'}
            }
        });

        aggregation = activityListModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result[0] || {};

            if (result.module) {
                result.module.forEach(function (item) {
                    if (item) {
                        item._id = item._id.toString();
                    }
                })
            }

            result = {
                country      : result.country || [],
                region       : result.region || [],
                subRegion    : result.subRegion || [],
                branch       : result.branch || [],
                retailSegment: result.retailSegment || [],
                outlet       : result.outlet || [],
                position     : result.position || [],
                actionType   : mapFiltersValues(result.actionType, CONSTANTS),
                module       : result.module || []
            };

            redisFilters({
                currentSelected: currentSelected,
                filterExists   : filterExists,
                filtersObject  : result,
                personnelId    : req.personnelModel._id,
                contentType    : CONTENT_TYPES.ACTIVITYLIST
            }, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.questionnary = function (req, res, next) {
        var CONSTANTS = require('../public/js/constants/otherConstants');
        var QuestionnaryModel = db.model(CONTENT_TYPES.QUESTIONNARIES, questionnarySchema);
        var query = req.query;
        var queryFilter = query.filter || {};
        var filterMapper = new FilterMapper();
        var currentSelected = query.current;
        var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        var filter = filterMapper.mapFilter({
            filter: query.filter
        });
        var aggregation;
        var aggregateHelper;
        var positionFilter;
        var publisherFilter;
        var pipeLine = [];

        $defProjection = _.extend({
            personnels: 1,
            employee  : 1,
            publisher : 1,
            personnel : 1
        }, $defProjection);

        if (filter.position) {
            positionFilter = filter.position;
            delete filter.position;
        }

        if (filter.publisher) {
            publisherFilter = filter.publisher;
            delete filter.publisher;
        }

        aggregateHelper = new AggregationHelper($defProjection, filter);

        if (publisherFilter) {
            pipeLine.push({
                $match: {
                    'createdBy.user': publisherFilter
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'personnels',
            key          : 'personnels',
            isArray      : true,
            addProjection: ['firstName', 'lastName', 'position']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['firstName', 'lastName', 'position'],
            includeSiblings: {
                createdBy: {
                    date: 1
                }
            }
        }));

        pipeLine.push({
            $unwind: {
                path                      : '$personnels',
                preserveNullAndEmptyArrays: true
            }
        });

        if (positionFilter) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'createdBy.user.position': positionFilter
                        },
                        {
                            'personnels.position': positionFilter
                        }
                    ]
                }
            });
        }

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                position  : {$concatArrays: [['$createdBy.user.position'], ['$personnels.position']]},
                personnels: {
                    _id     : 1,
                    position: 1,
                    name    : {
                        en: {$concat: ['$personnels.firstName.en', ' ', '$personnels.lastName.en']},
                        ar: {$concat: ['$personnels.firstName.ar', ' ', '$personnels.lastName.ar']}
                    }
                }
            })
        });

        pipeLine.push({
            $group: aggregateHelper.getGroupObject({
                personnels: {
                    $addToSet: '$personnels'
                }
            })
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'positions',
            key    : 'position',
            isArray: true
        }));

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                publisher: {
                    _id     : '$createdBy.user._id',
                    position: '$createdBy.user.position',
                    name    : {
                        en: {$concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en']},
                        ar: {$concat: ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar']}
                    }
                }
            })
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'country',
            isArray: true
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'domains',
            key          : 'region',
            isArray      : true,
            addProjection: ['parent']
        }));

        pipeLine.push({
            $unwind: {
                path                      : '$region',
                preserveNullAndEmptyArrays: true
            }
        });

        if (filter.country) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'region.parent': filter.country
                        },
                        {
                            region: {
                                $exists: false
                            }
                        }
                    ]
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'domains',
            key          : 'subRegion',
            isArray      : true,
            addProjection: ['parent']
        }));

        pipeLine.push({
            $unwind: {
                path                      : '$subRegion',
                preserveNullAndEmptyArrays: true
            }
        });

        if (filter.region) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'subRegion.parent': filter.region
                        },
                        {
                            subRegion: {
                                $exists: false
                            }
                        }
                    ]
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'branches',
            key          : 'branch',
            isArray      : true,
            addProjection: ['subRegion', 'outlet', 'retailSegment']
        }));

        pipeLine.push({
            $unwind: {
                path                      : '$branch',
                preserveNullAndEmptyArrays: true
            }
        });

        if (filter.outlet) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'branch.outlet': filter.outlet
                        },
                        {
                            'branch.outlet': {$exists: false}
                        }
                    ]
                }
            });
        }

        if (filter.retailSegment) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'branch.retailSegment': filter.retailSegment
                        },
                        {
                            'branch.retailSegment': {$exists: false}
                        }
                    ]
                }
            });
        }

        if (filter.subRegion) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'branch.subRegion': filter.subRegion
                        },
                        {
                            'branch.subRegion': {$exists: false}
                        }
                    ]
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'outlets',
            key          : 'outlet',
            addProjection: ['retailSegments', 'subRegions']
        }));

        if (filter.retailSegment || filter.subRegion) {
            pipeLine.push({
                $unwind: {
                    path                      : '$outlet',
                    preserveNullAndEmptyArrays: true
                }
            });

            if (filter.retailSegment) {
                pipeLine.push({
                    $match: {
                        $or: [
                            {
                                'outlet.retailSegments': filter.retailSegment
                            },
                            {
                                'outlet.retailSegments': {
                                    $exists: false
                                }
                            }
                        ]
                    }
                });
            }

            if (filter.subRegion) {
                pipeLine.push({
                    $match: {
                        $or: [
                            {
                                'outlet.subRegions': filter.subRegion
                            },
                            {
                                'outlet.subRegions': {
                                    $exists: false
                                }
                            }
                        ]
                    }
                });
            }

            pipeLine.push({
                $group: aggregateHelper.getGroupObject({
                    outlet: {$addToSet: '$outlet'}
                })
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'retailSegments',
            key          : 'retailSegment',
            addProjection: ['subRegions']
        }));

        if (filter.subRegion) {
            pipeLine.push({
                $unwind: {
                    path                      : '$retailSegment',
                    preserveNullAndEmptyArrays: true
                }
            });

            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'retailSegment.subRegions': filter.subRegion
                        },
                        {
                            'retailSegment.subRegions': {
                                $exists: false
                            }
                        }
                    ]
                }
            });

            pipeLine.push({
                $group: aggregateHelper.getGroupObject({
                    retailSegment: {$addToSet: '$retailSegment'}
                })
            });
        }

        pipeLine.push({
            $group: {
                _id          : null,
                personnel    : {$addToSet: '$personnels'},
                country      : {$addToSet: '$country'},
                region       : {$addToSet: '$region'},
                subRegion    : {$addToSet: '$subRegion'},
                retailSegment: {$addToSet: '$retailSegment'},
                outlet       : {$addToSet: '$outlet'},
                branch       : {$addToSet: '$branch'},
                position     : {$addToSet: '$position'},
                publisher    : {$addToSet: '$publisher'},
                status       : {$addToSet: '$status'}
            }
        });

        aggregation = QuestionnaryModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, response) {
            var result;
            if (err) {
                return next(err);
            }

            result = response[0] || {};

            result = {
                country      : result.country && _.flatten(result.country) || [],
                region       : result.region && _.flatten(result.region) || [],
                subRegion    : result.subRegion && _.flatten(result.subRegion) || [],
                retailSegment: result.retailSegment && _.flatten(result.retailSegment) || [],
                outlet       : result.outlet && _.flatten(result.outlet) || [],
                branch       : result.branch && _.flatten(result.branch) || [],
                publisher    : result.publisher || [],
                position     : result.position && _.flatten(result.position) || [],
                personnel    : result.personnel && _.flatten(result.personnel) || [],
                status       : mapFiltersValues(result.status, CONSTANTS.PROMOTION_UI_STATUSES)
            };

            Object.keys(result).forEach(function (key) {
                var condition = ['personnel', 'publisher'].indexOf(key) !== -1 && positionFilter;
                var positions = [];
                if (positionFilter) {
                    positions = positionFilter.$in.fromObjectID();
                }
                if (result[key]) {
                    var i = result[key].length - 1;
                    for (i; i >= 0; i--) {
                        if (!result[key][i] || !result[key][i]._id || (condition && result[key][i].position && positions.indexOf(result[key][i].position.toString()) === -1)) {
                            result[key].splice(i, 1);
                        }
                    }
                }
            });

            redisFilters({
                currentSelected: currentSelected,
                filterExists   : filterExists,
                filtersObject  : result,
                personnelId    : req.personnelModel._id,
                contentType    : CONTENT_TYPES.QUESTIONNARIES
            }, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.createQuestionnary = function (req, res, next) {
        var query = req.query;
        var queryFilter = query.filter || {};
        var currentSelected = query.current;
        var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);

        var filterMapper = new FilterMapper();
        var filter = filterMapper.mapFilter({
            filter   : query.filter,
            personnel: req.personnelModel
        });
        $defProjection = _.extend({
            firstName: 1,
            lastName : 1
        }, $defProjection);
        var aggregationHelper = new AggregationHelper($defProjection, filter);
        var aggregation;
        var pipeLine = [];

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'country',
            isArray: true
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from         : 'domains',
            key          : 'region',
            isArray      : true,
            addProjection: ['parent']
        }));

        pipeLine.push({
            $unwind: {
                path                      : '$region',
                preserveNullAndEmptyArrays: true
            }
        });

        if (filter.country) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'region.parent': filter.country
                        },
                        {
                            region: {
                                $exists: false
                            }
                        }
                    ]
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from         : 'domains',
            key          : 'subRegion',
            isArray      : true,
            addProjection: ['parent']
        }));

        pipeLine.push({
            $unwind: {
                path                      : '$subRegion',
                preserveNullAndEmptyArrays: true
            }
        });

        if (filter.region) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'subRegion.parent': filter.region
                        },
                        {
                            subRegion: {
                                $exists: false
                            }
                        }
                    ]
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from         : 'branches',
            key          : 'branch',
            isArray      : true,
            addProjection: ['subRegion', 'outlet', 'retailSegment']
        }));

        pipeLine.push({
            $unwind: {
                path                      : '$branch',
                preserveNullAndEmptyArrays: true
            }
        });

        if (filter.outlet) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'branch.outlet': filter.outlet
                        },
                        {
                            'branch.outlet': {$exists: false}
                        }
                    ]
                }
            });
        }

        if (filter.retailSegment) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'branch.retailSegment': filter.retailSegment
                        },
                        {
                            'branch.retailSegment': {$exists: false}
                        }
                    ]
                }
            });
        }

        if (filter.subRegion) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'branch.subRegion': filter.subRegion
                        },
                        {
                            'branch.subRegion': {$exists: false}
                        }
                    ]
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from   : 'outlets',
            key    : 'branch.outlet',
            as     : 'outlet',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from   : 'retailSegments',
            key    : 'branch.retailSegment',
            as     : 'retailSegment',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from   : 'positions',
            key    : 'position',
            isArray: false
        }));

        pipeLine.push({
            $project: aggregationHelper.getProjection({
                personnel: {
                    _id : '$_id',
                    name: {
                        en: {$concat: ['$firstName.en', ' ', '$lastName.en']},
                        ar: {$concat: ['$firstName.ar', ' ', '$lastName.ar']}
                    }
                }
            })
        });

        pipeLine.push({
            $group: {
                _id          : null,
                personnel    : {$addToSet: '$$ROOT.personnel'},
                country      : {$addToSet: '$country'},
                region       : {$addToSet: '$region'},
                subRegion    : {$addToSet: '$subRegion'},
                branch       : {$addToSet: '$branch'},
                position     : {$addToSet: '$position'},
                retailSegment: {$addToSet: '$retailSegment'},
                outlet       : {$addToSet: '$outlet'}
            }
        });
        aggregation = PersonnelModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            var response;

            if (err) {
                return next(err);
            }

            result = result[0] || {};

            response = {
                country      : result.country && _.uniq(_.flatten(result.country)) || [],
                region       : result.region || [],
                subRegion    : result.subRegion || [],
                retailSegment: result.retailSegment || [],
                outlet       : result.outlet || [],
                branch       : result.branch || [],
                personnel    : result.personnel || [],
                position     : result.position || []
            };

            Object.keys(response).forEach(function (key) {
                if (response[key]) {
                    var i = response[key].length - 1;
                    for (i; i >= 0; i--) {
                        if (!response[key][i] || !response[key][i]._id) {
                            response[key].splice(i, 1);
                        }
                    }
                }
            });

            redisFilters({
                currentSelected: currentSelected,
                filterExists   : filterExists,
                filtersObject  : response,
                personnelId    : req.personnelModel._id,
                contentType    : CONTENT_TYPES.CREATEQUESTIONNARIES
            }, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.planogramFilters = function (req, res, next) {
        var PlanogramModel = db.model(CONTENT_TYPES.PLANOGRAM, planogramSchema);
        var query = req.query;
        var queryFilter = query.filter || {};

        var filterMapper = new FilterMapper();

        var currentSelected = query.current;
        var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        var filter = filterMapper.mapFilter({
            filter   : queryFilter,
            personnel: req.personnelModel
        });

        var aggregateHelper;

        var aggregation;
        var pipeLine = [];
        // delete filter.configuration;
        delete filter.region;
        delete filter.subRegion;
        delete filter.outlet;

        aggregateHelper = new AggregationHelper($defProjection, filter);

        pipeLine.push({
            $match: filter
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'country',
            as     : 'country',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'categories',
            key    : 'product',
            as     : 'product',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'retailSegments',
            key          : 'retailSegment',
            as           : 'retailSegment',
            isArray      : false,
            addProjection: ['configurations']

        }));

        pipeLine.push({
            $project: {
                country      : 1,
                retailSegment: 1,
                product      : 1,
                configuration: {
                    $filter: {
                        input: '$retailSegment.configurations',
                        as   : 'configuration',
                        cond : {$eq: ['$$configuration._id', '$configuration']}
                    }
                }
            }
        });

        pipeLine.push({
            $project: {
                country             : 1,
                'retailSegment._id' : 1,
                'retailSegment.name': 1,
                product             : 1,
                configuration       : {$arrayElemAt: ['$configuration', 0]}
            }
        });

        pipeLine.push({
            $project: {
                country      : 1,
                retailSegment: 1,
                product      : 1,
                configuration: {
                    name: {en: '$configuration.configuration'},
                    _id : 1
                }
            }
        });

        pipeLine.push({
            $group: {
                _id          : null,
                country      : {$addToSet: '$country'},
                retailSegment: {$addToSet: '$retailSegment'},
                product      : {$addToSet: '$product'},
                configuration: {$addToSet: '$configuration'}
            }
        });

        aggregation = PlanogramModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {
                country      : result.country || [],
                retailSegment: result.retailSegment || [],
                product      : result.product || [],
                configuration: result.configuration || []
            };

            redisFilters({
                currentSelected: currentSelected,
                filterExists   : filterExists,
                filtersObject  : result,
                personnelId    : req.personnelModel._id,
                contentType    : CONTENT_TYPES.NOTIFICATIONS
            }, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.competitorsListFilters = function (req, res, next) {
        var Model = db.model(CONTENT_TYPES.COMPETITORITEM, competitorSchema);
        var query = req.query;
        var filterMapper = new FilterMapper();
        var queryFilter = query.filter || {};
        var currentSelected = query.current;
        var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        var filter = filterMapper.mapFilter({
            filter   : queryFilter,
            personnel: req.personnelModel
        });

        var aggregateHelper = new AggregationHelper($defProjection, filter);

        var beforeFilter = _.pick(filter, 'country', 'brand', 'archived');
        var originFilter = _.pick(filter, 'origin');
        var afterFilter = _.pick(filter, 'product');
        var pipeLine = [];
        var aggregation;

        pipeLine.push({
            $match: beforeFilter
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'country',
            as     : 'country',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'brands',
            key    : 'brand',
            as     : 'brand',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from             : 'competitorVariants',
            key              : 'variant',
            as               : 'variant',
            isArray          : false,
            addMainProjection: ['category']
        }));

        pipeLine.push({
            $match: afterFilter
        });
        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'categories',
            key    : 'category',
            as     : 'product',
            isArray: false
        }));

        pipeLine.push({
            $unwind: {
                path                      : '$origin',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeLine.push({
            $match: originFilter
        });
        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'origins',
            key    : 'origin',
            as     : 'origin',
            isArray: false
        }));

        pipeLine.push({
            $group: {
                _id    : null,
                origin : {$addToSet: '$origin'},
                country: {$addToSet: '$country'},
                brand  : {$addToSet: '$brand'},
                product: {$addToSet: '$product'},
                variant: {$addToSet: '$variant'}
            }
        });

        aggregation = Model.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }
            result = result[0] || {};

            result = {
                country: result.country || [],
                origin : _.flatten(result.origin) || [],
                brand  : result.brand || [],
                product: result.product || []
            };
            redisFilters({
                currentSelected: currentSelected,
                filterExists   : filterExists,
                filtersObject  : result,
                personnelId    : req.personnelModel._id,
                contentType    : CONTENT_TYPES.COMPETITORITEM
            }, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.selectItemsLocationFilters = function (req, res, next) {
        var OutletModel = db.model(CONTENT_TYPES.OUTLET, mongoose.Schemas[CONTENT_TYPES.OUTLET]);
        var pipeLine = [];
        var $defProjection = {
            _id           : 1,
            name          : 1,
            subRegions    : 1,
            retailSegments: 1,
            country       : 1,
            region        : 1,
            outlet        : {
                _id : '$_id',
                name: '$name'
            }
        };
        var aggregateHelper = new AggregationHelper($defProjection);

        var aggregation;

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'retailSegments',
            key : 'retailSegments'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from             : 'domains',
            key              : 'subRegions',
            addMainProjection: 'parent'
        }));

        pipeLine.push({
            $unwind: {
                path                      : '$parent',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeLine.push({
            $lookup: {
                from        : 'domains',
                localField  : 'parent',
                foreignField: '_id',
                as          : 'region'
            }
        });

        pipeLine.push({
            $unwind: {
                path                      : '$region',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeLine.push({
            $lookup: {
                from        : 'domains',
                localField  : 'region.parent',
                foreignField: '_id',
                as          : 'country'
            }
        });

        pipeLine.push({
            $project: {
                _id          : 1,
                name         : 1,
                country      : 1,
                region       : 1,
                outlet       : 1,
                subRegion    : '$subRegions',
                retailSegment: '$retailSegments'
            }
        });

        aggregation = OutletModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });
    };

    this.personnelFilters = function (req, res, next) {

        var STATUSES = require('../public/js/constants/personnelStatuses');

        var query = req.query;

        var $defProjection = {
            _id              : 1,
            country          : 1,
            retailSegment    : 1,
            region           : 1,
            subRegion        : 1,
            outlet           : 1,
            branch           : 1,
            editedBy         : 1,
            createdBy        : 1,
            archived         : 1,
            status           : 1,
            position         : 1,
            lastMonthEvaluate: 1
        };

        var filterMapper = new FilterMapper();

        var language = req.cookies.currentLanguage;
        var translateFields = ['firstName', 'lastName'];

        var queryFilter = query.filter || {};
        var translated = queryFilter.translated ? queryFilter.translated.values : [];

        delete queryFilter.translated;

        var filter = filterMapper.mapFilter({
            filter   : queryFilter,
            personnel: req.personnelModel
        });

        var aggregateHelper = new AggregationHelper($defProjection, filter);

        var currentSelected = query.current;
        var filterExists = Object.keys(filter).length && !(Object.keys(filter).length === 1 && filter.archived);

        var beforeFilter;
        var afterFilter;
        var aggregation;
        var pipeLine = [];

        beforeFilter = _.pick(filter, 'country', 'region', 'subRegion', 'branch', 'position', 'archived');
        afterFilter = _.pick(filter, 'retailSegment', 'outlet');

        pipeLine.push({
            $project: {
                country   : 1,
                region    : 1,
                subRegion : 1,
                branch    : 1,
                archived  : 1,
                position  : 1,
                status    : 1,
                translated: translated.length === 1 ? aggregateHelper.translatedCond(language, translateFields, translated[0]) : {$literal: true}
            }
        });

        beforeFilter.translated = true;

        pipeLine.push({
            $match: beforeFilter
        });
        /*pipeLine.push({
         $match: {
         translated: true
         }
         });*/
        pipeLine.push({
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
                path                      : '$branch',
                preserveNullAndEmptyArrays: true
            }
        });
        pipeLine.push({
            $unwind: {
                path                      : '$position',
                preserveNullAndEmptyArrays: true
            }
        });
        pipeLine.push({
            $lookup: {
                from        : 'domains',
                localField  : 'country',
                foreignField: '_id',
                as          : 'country'
            }
        });
        pipeLine.push({
            $lookup: {
                from        : 'domains',
                localField  : 'region',
                foreignField: '_id',
                as          : 'region'
            }
        });
        pipeLine.push({
            $lookup: {
                from        : 'domains',
                localField  : 'subRegion',
                foreignField: '_id',
                as          : 'subRegion'
            }
        });
        pipeLine.push({
            $lookup: {
                from        : 'branches',
                localField  : 'branch',
                foreignField: '_id',
                as          : 'branch'
            }
        });
        pipeLine.push({
            $lookup: {
                from        : 'positions',
                localField  : 'position',
                foreignField: '_id',
                as          : 'position'
            }
        });
        pipeLine.push({
            $project: {
                country  : {$arrayElemAt: ['$country', 0]},
                region   : {$arrayElemAt: ['$region', 0]},
                subRegion: {$arrayElemAt: ['$subRegion', 0]},
                branch   : {$arrayElemAt: ['$branch', 0]},
                position : {$arrayElemAt: ['$position', 0]},
                status   : 1
            }
        });
        pipeLine = _.union(pipeLine, domainPileLine({
            filter: filter
        }));
        pipeLine.push({
            $project: {
                country      : 1,
                region       : 1,
                subRegion    : 1,
                branch       : 1,
                position     : 1,
                status       : 1,
                retailSegment: '$branch.retailSegment',
                outlet       : '$branch.outlet'
            }
        });
        pipeLine.push({
            $match: afterFilter
        });
        pipeLine.push({
            $lookup: {
                from        : 'retailSegments',
                localField  : 'retailSegment',
                foreignField: '_id',
                as          : 'retailSegment'
            }
        });
        pipeLine.push({
            $lookup: {
                from        : 'outlets',
                localField  : 'outlet',
                foreignField: '_id',
                as          : 'outlet'
            }
        });
        pipeLine.push({
            $project: {
                country      : 1,
                region       : 1,
                subRegion    : 1,
                branch       : 1,
                position     : 1,
                status       : 1,
                retailSegment: {$arrayElemAt: ['$retailSegment', 0]},
                outlet       : {$arrayElemAt: ['$outlet', 0]}
            }
        });
        pipeLine.push({
            $project: {
                country      : {_id: 1, name: 1},
                region       : {_id: 1, name: 1},
                subRegion    : {_id: 1, name: 1},
                branch       : {_id: 1, name: 1},
                position     : {_id: 1, name: 1},
                retailSegment: {_id: 1, name: 1},
                outlet       : {_id: 1, name: 1},
                status       : 1
            }
        });
        pipeLine.push({
            $group: {
                _id          : null,
                country      : {$addToSet: '$country'},
                region       : {$addToSet: '$region'},
                subRegion    : {$addToSet: '$subRegion'},
                branch       : {$addToSet: '$branch'},
                position     : {$addToSet: '$position'},
                retailSegment: {$addToSet: '$retailSegment'},
                outlet       : {$addToSet: '$outlet'},
                status       : {$addToSet: '$status'}
            }
        });
        aggregation = PersonnelModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {
                country      : result.country || [],
                region       : result.region || [],
                subRegion    : result.subRegion || [],
                branch       : result.branch || [],
                retailSegment: result.retailSegment || [],
                outlet       : result.outlet || [],
                position     : result.position || [],
                status       : mapFiltersValues(result.status, STATUSES)
            };

            redisFilters({
                currentSelected: currentSelected,
                filterExists   : filterExists,
                filtersObject  : result,
                personnelId    : req.personnelModel._id,
                contentType    : CONTENT_TYPES.PERSONNEL
            }, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.notificationCreateFilters = function (req, res, next) {
        var query = req.query;
        var filterMapper = new FilterMapper();
        var filter = filterMapper.mapFilter({
            filter   : query.filter,
            personnel: req.personnelModel
        });
        var mainFilter = _.pick(filter, 'country', 'region', 'subRegion', 'branch', 'position');
        var retailSegmentOutletFilter = _.pick(filter, 'retailSegment', 'outlet');
        var aggregation;
        var pipeLine = [];

        var $defProjection = {
            _id          : 1,
            country      : 1,
            region       : 1,
            subRegion    : 1,
            retailSegment: 1,
            outlet       : 1,
            branch       : 1,
            position     : 1,
            personnel    : 1
        };

        var aggregateHelper = new AggregationHelper($defProjection);

        if (!_.isEmpty(mainFilter)) {
            pipeLine.push({
                $match: mainFilter
            });
        }

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                personnel: {
                    _id : '$_id',
                    name: {
                        en: {
                            $concat: ['$firstName.en', ' ', '$lastName.en']
                        },
                        ar: {
                            $concat: ['$firstName.ar', ' ', '$lastName.ar']
                        }
                    }
                }
            })
        });

        pipeLine.push({
            $unwind: {
                path                      : '$branch',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'branches',
            key          : 'branch',
            isArray      : false,
            addProjection: ['id', 'name', 'retailSegment', 'outlet', 'subRegion']
        }));

        if (filter.subRegion) {
            pipeLine.push({
                $match: {
                    $or: [
                        {'branch.subRegion': {$exists: false}},
                        {'branch.subRegion': filter.subRegion}
                    ]
                }
            });
        }

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                outlet       : '$branch.outlet',
                retailSegment: '$branch.retailSegment',
                branch       : {
                    _id : 1,
                    name: 1
                }
            })
        });

        if (!_.isEmpty(retailSegmentOutletFilter)) {
            pipeLine.push({
                $match: retailSegmentOutletFilter
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'retailSegments',
            key    : 'retailSegment',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'outlets',
            key    : 'outlet',
            isArray: false
        }));

        pipeLine.push({
            $group: aggregateHelper.getGroupObject({
                branch       : {$addToSet: '$branch'},
                outlet       : {$addToSet: '$outlet'},
                retailSegment: {$addToSet: '$retailSegment'}
            })
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'country'
        }));

        pipeLine.push({
            $unwind: {
                path                      : '$region',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'domains',
            key          : 'region',
            isArray      : false,
            addProjection: ['parent']
        }));

        if (filter.country) {
            pipeLine.push({
                $match: {
                    $or: [
                        {'region.parent': {$exists: false}},
                        {'region.parent': filter.country}
                    ]
                }
            });
        }

        pipeLine.push({
            $group: aggregateHelper.getGroupObject({
                region: {
                    $addToSet: {
                        _id : '$region._id',
                        name: '$region.name'
                    }
                }
            })
        });

        pipeLine.push({
            $unwind: {
                path                      : '$subRegion',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'domains',
            key          : 'subRegion',
            isArray      : false,
            addProjection: ['parent']
        }));

        if (filter.region) {
            pipeLine.push({
                $match: {
                    $or: [
                        {'subRegion.parent': {$exists: false}},
                        {'subRegion.parent': filter.region}
                    ]
                }
            });
        }

        pipeLine.push({
            $group: aggregateHelper.getGroupObject({
                subRegion: {
                    $addToSet: {
                        _id : '$subRegion._id',
                        name: '$subRegion.name'
                    }
                }
            })
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'positions',
            key    : 'position',
            isArray: false
        }));

        pipeLine.push({
            $group: {
                _id          : null,
                country      : {$addToSet: '$country'},
                region       : {$addToSet: '$region'},
                subRegion    : {$addToSet: '$subRegion'},
                retailSegment: {$addToSet: '$retailSegment'},
                outlet       : {$addToSet: '$outlet'},
                branch       : {$addToSet: '$branch'},
                position     : {$addToSet: '$position'},
                personnel    : {$addToSet: '$personnel'}
            }
        });

        aggregation = PersonnelModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {
                country      : result.country && _.uniq(_.flatten(result.country)) || [],
                region       : result.region && _.uniq(_.flatten(result.region)) || [],
                subRegion    : result.subRegion && _.uniq(_.flatten(result.subRegion)) || [],
                retailSegment: result.retailSegment && _.uniq(_.flatten(result.retailSegment)) || [],
                outlet       : result.outlet && _.uniq(_.flatten(result.outlet)) || [],
                branch       : result.branch && _.uniq(_.flatten(result.branch)) || [],
                position     : result.position && _.uniq(_.flatten(result.position)) || [],
                personnel    : result.personnel && _.uniq(_.flatten(result.personnel)) || []
            };

            Object.keys(result).forEach(function (key) {
                if (result[key]) {
                    var i = result[key].length - 1;
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
        var BranchModel = db.model(CONTENT_TYPES.BRANCH, mongoose.Schemas[CONTENT_TYPES.BRANCH]);
        var DomainModel = db.model(CONTENT_TYPES.DOMAIN, mongoose.Schemas[CONTENT_TYPES.DOMAIN]);
        var $defProjection = {
            _id          : 1,
            country      : 1,
            retailSegment: 1,
            region       : 1,
            subRegion    : 1,
            outlet       : 1,
            branch       : 1,
            position     : 1,
            personnel    : 1
        };
        var NotificationModel = db.model(CONTENT_TYPES.NOTIFICATIONS, notificationSchema);
        var query = req.query;
        var queryFilter = query.filter || {};

        var filterMapper = new FilterMapper();

        var currentSelected = query.current;
        var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        var filter = filterMapper.mapFilter({
            filter   : queryFilter,
            personnel: req.personnelModel
        });

        var translateFields = ['description'];
        var translated = (query.filter && query.filter.translated) ? query.filter.translated.values : [];

        var initialFilter = _.pick(filter, '$or');
        var mainFilter = _.pick(filter, 'country', 'region', 'subRegion',
            'branch', 'position', 'retailSegment', 'outlet');
        var queryForFunction;
        var subRegionIds;
        var regionIds;

        async.waterfall([
            function (waterfallCb) {
                if (!filter.branch) {
                    return waterfallCb();
                }
                var pipeLine = [];
                var aggregation;
                pipeLine.push({
                    $match: {
                        _id: filter.branch
                    }
                });
                pipeLine.push({
                    $project: {
                        _id          : 1,
                        subRegion    : 1,
                        retailSegment: 1,
                        outlet       : 1
                    }
                });
                pipeLine.push({
                    $group: {
                        _id          : null,
                        subRegion    : {$addToSet: '$subRegion'},
                        retailSegment: {$addToSet: '$retailSegment'},
                        outlet       : {$addToSet: '$outlet'}
                    }
                });
                aggregation = BranchModel.aggregate(pipeLine);
                aggregation.options = {
                    allowDiskUse: true
                };
                aggregation.exec(function (err, result) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    if (result) {
                        result = result[0];
                        if (!filter.subRegion) {
                            filter.subRegion = {$in: result.subRegion};
                        }
                        if (!filter.outlet) {
                            filter.outlet = {$in: result.outlet};
                        }
                        if (!filter.retailSegment) {
                            filter.retailSegment = {$in: result.retailSegment};
                        }
                    }
                    waterfallCb();
                });
            },
            function (waterfallCb) {
                if (!filter || !filter.country) {
                    return waterfallCb(null, null);
                }
                queryForFunction = {type: 'region', parent: filter.country};
                self.getLocationIds(DomainModel, {query: queryForFunction}, function (err, collection) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    regionIds = collection ? _.pluck(collection, '_id') : [];

                    waterfallCb(null, regionIds);

                });
            },
            function (collection, waterfallCb) {
                if (!collection) {
                    return waterfallCb(null, null);
                }
                queryForFunction = {type: 'subRegion', parent: {$in: collection}};
                self.getLocationIds(DomainModel, {query: queryForFunction}, function (err, newCollection) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    subRegionIds = newCollection ? _.pluck(newCollection, '_id') : [];

                    waterfallCb(null, subRegionIds);

                });
            },
            function (collection, waterfallCb) {
                var aggregationHelper = new AggregationHelper($defProjection, filter);
                var pipeLine = [];
                var aggregation;

                pipeLine.push({
                    $match: initialFilter
                });

                if (filter.personnel) {
                    pipeLine.push({
                        $match: {
                            $or: [
                                {recipients: filter.personnel},
                                {createdBy: filter.personnel}
                            ]
                        }
                    });
                }

                pipeLine.push({
                    $lookup: {
                        from        : 'personnels',
                        localField  : 'createdBy.user',
                        foreignField: '_id',
                        as          : 'createdBy'
                    }
                });

                pipeLine.push({
                    $project: {
                        _id          : 1,
                        createdBy    : {$arrayElemAt: ['$createdBy', 0]},
                        recipients   : 1,
                        country      : 1,
                        region       : 1,
                        subRegion    : 1,
                        retailSegment: 1,
                        outlet       : 1,
                        branch       : 1,
                        position     : 1
                    }
                });

                pipeLine.push({
                    $unwind: {
                        path                      : '$createdBy.branch',
                        preserveNullAndEmptyArrays: true
                    }
                });

                pipeLine.push({
                    $lookup: {
                        from        : 'branches',
                        localField  : 'createdBy.branch',
                        foreignField: '_id',
                        as          : 'createdBy.branch'
                    }
                });

                pipeLine.push({
                    $project: {
                        _id          : 1,
                        createdBy    : {
                            _id      : 1,
                            country  : 1,
                            region   : 1,
                            subRegion: 1,
                            position : 1
                        },
                        authorsBranch: {$arrayElemAt: ['$createdBy.branch', 0]},
                        recipients   : 1,
                        country      : 1,
                        region       : 1,
                        subRegion    : 1,
                        retailSegment: 1,
                        outlet       : 1,
                        branch       : 1,
                        position     : 1
                    }
                });

                pipeLine.push({
                    $group: {
                        _id                 : '$_id',
                        createdBy           : {$first: '$createdBy'},
                        authorsBranch       : {$addToSet: '$authorsBranch._id'},
                        authorsRetailSegment: {$addToSet: '$authorsBranch.retailSegment'},
                        authorsOutlet       : {$addToSet: '$authorsBranch.outlet'},
                        recipients          : {$first: '$recipients'},
                        country             : {$first: '$country'},
                        region              : {$first: '$region'},
                        subRegion           : {$first: '$subRegion'},
                        retailSegment       : {$first: '$retailSegment'},
                        outlet              : {$first: '$outlet'},
                        branch              : {$first: '$branch'},
                        position            : {$first: '$position'}
                    }
                });

                pipeLine.push({
                    $project: {
                        _id          : 1,
                        country      : {$setUnion: ['$country', '$createdBy.country']},
                        region       : {$setUnion: ['$region', '$createdBy.region']},
                        subRegion    : {$setUnion: ['$subRegion', '$createdBy.subRegion']},
                        branch       : {$setUnion: ['$branch', '$authorsBranch']},
                        retailSegment: {$setUnion: ['$retailSegment', '$authorsRetailSegment']},
                        outlet       : {$setUnion: ['$outlet', '$authorsOutlet']},
                        position     : {$setUnion: ['$position', ['$createdBy.position']]},
                        personnel    : {$setUnion: ['$recipients', ['$createdBy._id']]}
                    }
                });

                pipeLine.push({
                    $match: mainFilter
                });

                pipeLine.push({
                    $unwind: {
                        path                      : '$personnel',
                        preserveNullAndEmptyArrays: true
                    }
                });

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from         : 'personnels',
                    key          : 'personnel',
                    isArray      : false,
                    addProjection: ['firstName', 'lastName']
                }));

                pipeLine.push({
                    $group: aggregationHelper.getGroupObject({
                        personnel: {
                            $addToSet: {
                                _id : '$personnel._id',
                                name: {
                                    en: {
                                        $concat: ['$personnel.firstName.en', ' ', '$personnel.lastName.en']
                                    },
                                    ar: {
                                        $concat: ['$personnel.firstName.ar', ' ', '$personnel.lastName.ar']
                                    }
                                }
                            }
                        }
                    })
                });

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'domains',
                    key : 'country'
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from         : 'domains',
                    key          : 'region',
                    addProjection: ['parent']
                }));

                if (filter.country) {
                    pipeLine.push({
                        $unwind: {
                            path                      : '$region',
                            preserveNullAndEmptyArrays: true
                        }
                    });

                    pipeLine.push({
                        $match: {
                            $or: [
                                {
                                    'region.parent': filter.country
                                },
                                {
                                    region: {
                                        $exists: false
                                    }
                                }
                            ]
                        }
                    });

                    pipeLine.push({
                        $group: aggregationHelper.getGroupObject({
                            region: {$addToSet: '$region'}
                        })
                    });
                }

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'domains',
                    key : 'subRegion'
                }));

                if (collection && collection.length) {
                    pipeLine.push({
                        $unwind: {
                            path                      : '$subRegion',
                            preserveNullAndEmptyArrays: true
                        }
                    });

                    pipeLine.push({
                        $match: {
                            $or: [
                                {
                                    'subRegion._id': {
                                        $in: collection
                                    }
                                },
                                {
                                    subRegion: {
                                        $exists: false
                                    }
                                }
                            ]
                        }
                    });

                    pipeLine.push({
                        $group: aggregationHelper.getGroupObject({
                            subRegion: {$addToSet: '$subRegion'}
                        })
                    });
                }

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from         : 'branches',
                    key          : 'branch',
                    addProjection: ['outlet', 'retailSegment', 'subRegion']
                }));

                if (filter.outlet || filter.retailSegment || filter.subRegion) {
                    pipeLine.push({
                        $unwind: {
                            path                      : '$branch',
                            preserveNullAndEmptyArrays: true
                        }
                    });

                    if (filter.outlet) {
                        pipeLine.push({
                            $match: {
                                $or: [
                                    {
                                        'branch.outlet': filter.outlet
                                    },
                                    {
                                        'branch.outlet': {$exists: false}
                                    }
                                ]
                            }
                        });
                    }

                    if (filter.retailSegment) {
                        pipeLine.push({
                            $match: {
                                $or: [
                                    {
                                        'branch.retailSegment': filter.retailSegment
                                    },
                                    {
                                        'branch.retailSegment': {$exists: false}
                                    }
                                ]
                            }
                        });
                    }

                    if (filter.subRegion) {
                        pipeLine.push({
                            $match: {
                                $or: [
                                    {
                                        'branch.subRegion': filter.subRegion
                                    },
                                    {
                                        'branch.subRegion': {$exists: false}
                                    }
                                ]
                            }
                        });
                    }

                    pipeLine.push({
                        $group: aggregationHelper.getGroupObject({
                            branch: {$addToSet: '$branch'}
                        })
                    });
                }

                pipeLine = _.union(pipeLine, domainPileLine({
                    filter: filter
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from: 'positions',
                    key : 'position'
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from         : 'outlets',
                    key          : 'outlet',
                    addProjection: ['retailSegments', 'subRegions']
                }));

                if (filter.retailSegment || filter.subRegion) {
                    pipeLine.push({
                        $unwind: {
                            path                      : '$outlet',
                            preserveNullAndEmptyArrays: true
                        }
                    });

                    if (filter.retailSegment) {
                        pipeLine.push({
                            $match: {
                                $or: [
                                    {
                                        'outlet.retailSegments': filter.retailSegment
                                    },
                                    {
                                        'outlet.retailSegments': {
                                            $exists: false
                                        }
                                    }
                                ]
                            }
                        });
                    }

                    if (filter.subRegion) {
                        pipeLine.push({
                            $match: {
                                $or: [
                                    {
                                        'outlet.subRegions': filter.subRegion
                                    },
                                    {
                                        'outlet.subRegions': {
                                            $exists: false
                                        }
                                    }
                                ]
                            }
                        });
                    }

                    pipeLine.push({
                        $group: aggregationHelper.getGroupObject({
                            outlet: {$addToSet: '$outlet'}
                        })
                    });
                }

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from         : 'retailSegments',
                    key          : 'retailSegment',
                    addProjection: ['subRegions']
                }));

                if (filter.subRegion) {
                    pipeLine.push({
                        $unwind: {
                            path                      : '$retailSegment',
                            preserveNullAndEmptyArrays: true
                        }
                    });

                    pipeLine.push({
                        $match: {
                            $or: [
                                {
                                    'retailSegment.subRegions': filter.subRegion
                                },
                                {
                                    'retailSegment.subRegions': {
                                        $exists: false
                                    }
                                }
                            ]
                        }
                    });

                    pipeLine.push({
                        $group: aggregationHelper.getGroupObject({
                            retailSegment: {$addToSet: '$retailSegment'}
                        })
                    });
                }

                pipeLine.push({
                    $group: {
                        _id          : null,
                        country      : {$addToSet: '$country'},
                        region       : {$addToSet: '$region'},
                        subRegion    : {$addToSet: '$subRegion'},
                        retailSegment: {$addToSet: '$retailSegment'},
                        outlet       : {$addToSet: '$outlet'},
                        branch       : {$addToSet: '$branch'},
                        position     : {$addToSet: '$position'},
                        personnel    : {$addToSet: '$personnel'}
                    }
                });

                aggregation = NotificationModel.aggregate(pipeLine);

                aggregation.options = {
                    allowDiskUse: true
                };

                aggregation.exec(function (err, result) {
                    if (err) {
                        return waterfallCb(err);
                    }

                    result = result[0] || {};

                    result = {
                        country      : result.country && _.uniq(_.flatten(result.country)) || [],
                        region       : result.region && _.uniq(_.flatten(result.region)) || [],
                        subRegion    : result.subRegion && _.uniq(_.flatten(result.subRegion)) || [],
                        retailSegment: result.retailSegment && _.uniq(_.flatten(result.retailSegment)) || [],
                        outlet       : result.outlet && _.uniq(_.flatten(result.outlet)) || [],
                        branch       : result.branch && _.uniq(_.flatten(result.branch)) || [],
                        position     : result.position && _.uniq(_.flatten(result.position)) || [],
                        personnel    : result.personnel && _.uniq(_.flatten(result.personnel)) || []
                    };

                    Object.keys(result).forEach(function (key) {
                        if (result[key]) {
                            var i = result[key].length - 1;
                            for (i; i >= 0; i--) {
                                if (!result[key][i] || !result[key][i]._id) {
                                    result[key].splice(i, 1);
                                }
                            }
                        }
                    });

                    waterfallCb(null, result);
                });
            }
        ], function (err, result) {
            redisFilters({
                currentSelected: currentSelected,
                filterExists   : filterExists,
                filtersObject  : result,
                personnelId    : req.personnelModel._id,
                contentType    : CONTENT_TYPES.NOTIFICATIONS
            }, function (err, response) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(response);
            });
        });
    };

    this.objectiveFilters = function (req, res, next) {
        getObjectiveFilters(req, res, next);
    };

    this.inStoreTaskFilters = function (req, res, next) {
        getInStoreTaskFilters(req, res, next);
    };

    this.personnelTasks = function (req, res, next) {
        var query = req.query;
        var queryFilter = query.filter || {};
        var currentSelected = query.current;
        var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);

        async.parallel([
            function (parallelCb) {
                getObjectiveFilters(req, res, next, function (err, result) {
                    if (err) {
                        return parallelCb(err);
                    }

                    return parallelCb(null, result);
                });
            },
            function (parallelCb) {
                getInStoreTaskFilters(req, res, next, function (err, result) {
                    if (err) {
                        return parallelCb(err);
                    }
                    return parallelCb(null, result);
                });
            }
        ], function (err, result) {
            var resp;

            function concatFilters(response) {
                var resultObject = {};
                var keysArray = FILTERS_CONSTANTS.FILTERS[CONTENT_TYPES.PERSONNELTASKS].array || [];
                var objectivesValues = response[0] || {};
                var inStoreTasksValues = response[1] || {};

                keysArray.forEach(function (key) {
                    resultObject[key] = _.union(objectivesValues[key] || [], inStoreTasksValues[key] || []);
                });

                return resultObject;
            }

            if (err) {
                return next(err);
            }
            resp = concatFilters(result);
            redisFilters({
                currentSelected: currentSelected,
                filterExists   : filterExists,
                filtersObject  : resp,
                personnelId    : req.personnelModel._id,
                contentType    : 'personnelTasks'
            }, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.competitorBrandingFilters = function (req, res, next) {
        var CompetitorBrandingModel = db.model(CONTENT_TYPES.COMPETITORBRANDING, mongoose.Schemas[CONTENT_TYPES.COMPETITORBRANDING]);
        var query = req.query;
        var queryFilter = query.filter || {};
        var filterMapper = new FilterMapper();
        var currentSelected = query.current;
        var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        var filter = filterMapper.mapFilter({
            filter   : queryFilter,
            personnel: req.personnelModel
        });
        var beforeFilter = _.pick(filter, '$and', '$or');
        var aggregation;
        var pipeLine = [];
        var aggregationHelper;

        $defProjection = _.extend($defProjection, {
            firstName: 1,
            lastName : 1,
            personnel: 1
        });
        aggregationHelper = new AggregationHelper($defProjection, filter);

        pipeLine.push({
            $match: beforeFilter
        });

        if (filter.personnel) {
            pipeLine.push({
                $match: {
                    'createdBy.user': filter.personnel
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            addProjection  : ['position', 'firstName', 'lastName'],
            isArray        : false,
            includeSiblings: {
                createdBy: {
                    date: 1
                }
            }
        }));

        if (filter.position) {
            pipeLine.push({
                $match: {
                    'createdBy.user.position': filter.position
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from           : 'positions',
            key            : 'createdBy.user.position',
            isArray        : false,
            as             : 'position',
            includeSiblings: {
                createdBy: {
                    date: 1,
                    user: {
                        _id      : 1,
                        firstName: 1,
                        lastName : 1
                    }
                }
            }
        }));

        pipeLine.push({
            $project: aggregationHelper.getProjection({
                personnel: {
                    _id : '$createdBy.user._id',
                    name: {
                        en: {$concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en']},
                        ar: {$concat: ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar']}
                    }
                }
            })
        });

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from   : 'categories',
            key    : 'category',
            isArray: true
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from   : 'domains',
            key    : 'country',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from         : 'domains',
            key          : 'region',
            isArray      : false,
            addProjection: ['parent']
        }));

        if (filter.country) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'region.parent': filter.country
                        },
                        {
                            region: {
                                $exists: false
                            }
                        }
                    ]
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from         : 'domains',
            key          : 'subRegion',
            isArray      : false,
            addProjection: ['parent']
        }));

        if (filter.region) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'subRegion.parent': filter.region
                        },
                        {
                            subRegion: {
                                $exists: false
                            }
                        }
                    ]
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from         : 'branches',
            key          : 'branch',
            isArray      : false,
            addProjection: ['subRegion', 'outlet', 'retailSegment']
        }));

        if (filter.outlet) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'branch.outlet': filter.outlet
                        },
                        {
                            'branch.outlet': {$exists: false}
                        }
                    ]
                }
            });
        }

        if (filter.retailSegment) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'branch.retailSegment': filter.retailSegment
                        },
                        {
                            'branch.retailSegment': {$exists: false}
                        }
                    ]
                }
            });
        }

        if (filter.subRegion) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            'branch.subRegion': filter.subRegion
                        },
                        {
                            'branch.subRegion': {$exists: false}
                        }
                    ]
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from   : 'outlets',
            key    : 'branch.outlet',
            as     : 'outlet',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from   : 'retailSegments',
            key    : 'branch.retailSegment',
            as     : 'retailSegment',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
            from   : 'brands',
            key    : 'brand',
            isArray: false
        }));

        pipeLine.push({
            $group: {
                _id          : null,
                category     : {$addToSet: '$category'},
                brand        : {$addToSet: '$brand'},
                country      : {$addToSet: '$country'},
                region       : {$addToSet: '$region'},
                subRegion    : {$addToSet: '$subRegion'},
                retailSegment: {$addToSet: '$retailSegment'},
                outlet       : {$addToSet: '$outlet'},
                branch       : {$addToSet: '$branch'},
                position     : {$addToSet: '$position'},
                personnel    : {$addToSet: '$personnel'}
            }
        });

        aggregation = CompetitorBrandingModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {

            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {
                category     : result.category && _.flatten(result.category) || [],
                brand        : result.brand || [],
                country      : result.country || [],
                region       : result.region || [],
                subRegion    : result.subRegion || [],
                retailSegment: result.retailSegment || [],
                outlet       : result.outlet || [],
                branch       : result.branch || [],
                position     : result.position || [],
                personnel    : result.personnel || []
            };

            Object.keys(result).forEach(function (key) {
                if (result[key]) {
                    var i = result[key].length - 1;
                    for (i; i >= 0; i--) {
                        if (!result[key][i] || !result[key][i]._id) {
                            result[key].splice(i, 1);
                        }
                    }
                }
            });

            redisFilters({
                currentSelected: currentSelected,
                filterExists   : filterExists,
                filtersObject  : result,
                personnelId    : req.personnelModel._id,
                contentType    : CONTENT_TYPES.COMPETITORBRANDING
            }, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.competitorPromotionFilters = function (req, res, next) {
        var CompetitorPromotionModel = db.model(CONTENT_TYPES.COMPETITORPROMOTION, mongoose.Schemas[CONTENT_TYPES.COMPETITORPROMOTION]);
        var query = req.query;
        var queryFilter = query.filter || {};

        var filterMapper = new FilterMapper();

        var currentSelected = query.current;
        var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        var filter = filterMapper.mapFilter({
            filter   : queryFilter,
            personnel: req.personnelModel
        });
        var beforeFilter = _.pick(filter, 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', '$and', '$or');
        var employeeFilter = filter.personnel ? {'createdBy.user': _.pick(filter, 'personnel').personnel} : {};
        var afterFilter = _.pick(filter, 'position');
        var aggregation;
        var pipeLine = [];
        pipeLine.push({
            $unwind: {
                path                      : '$category',
                preserveNullAndEmptyArrays: true
            }
        });
        pipeLine.push({
            $match: beforeFilter
        });
        pipeLine.push({
            $match: employeeFilter
        });
        pipeLine.push({
            $lookup: {
                from        : 'domains',
                localField  : 'country',
                foreignField: '_id',
                as          : 'country'
            }
        });
        pipeLine.push({
            $lookup: {
                from        : 'domains',
                localField  : 'region',
                foreignField: '_id',
                as          : 'region'
            }
        });
        pipeLine.push({
            $lookup: {
                from        : 'domains',
                localField  : 'subRegion',
                foreignField: '_id',
                as          : 'subRegion'
            }
        });
        pipeLine.push({
            $lookup: {
                from        : 'retailSegments',
                localField  : 'retailSegment',
                foreignField: '_id',
                as          : 'retailSegment'
            }
        });
        pipeLine.push({
            $lookup: {
                from        : 'outlets',
                localField  : 'outlet',
                foreignField: '_id',
                as          : 'outlet'
            }
        });
        pipeLine.push({
            $lookup: {
                from        : 'branches',
                localField  : 'branch',
                foreignField: '_id',
                as          : 'branch'
            }
        });
        pipeLine.push({
            $lookup: {
                from        : 'categories',
                localField  : 'category',
                foreignField: '_id',
                as          : 'category'
            }
        });
        pipeLine.push({
            $lookup: {
                from        : 'brands',
                localField  : 'brand',
                foreignField: '_id',
                as          : 'brand'
            }
        });
        pipeLine.push({
            $lookup: {
                from        : 'personnels',
                localField  : 'createdBy.user',
                foreignField: '_id',
                as          : 'createdBy.user'
            }
        });
        pipeLine.push({
            $project: {
                category     : {$arrayElemAt: ['$category', 0]},
                brand        : {$arrayElemAt: ['$brand', 0]},
                country      : {$arrayElemAt: ['$country', 0]},
                region       : {$arrayElemAt: ['$region', 0]},
                subRegion    : {$arrayElemAt: ['$subRegion', 0]},
                retailSegment: {$arrayElemAt: ['$retailSegment', 0]},
                outlet       : {$arrayElemAt: ['$outlet', 0]},
                branch       : {$arrayElemAt: ['$branch', 0]},
                createdBy    : {
                    user: {$arrayElemAt: ['$createdBy.user', 0]}
                }
            }
        });
        pipeLine = _.union(pipeLine, domainPileLine({
            filter: filter
        }));
        pipeLine.push({
            $project: {
                category     : 1,
                brand        : 1,
                country      : 1,
                region       : 1,
                subRegion    : 1,
                retailSegment: 1,
                outlet       : 1,
                branch       : 1,
                createdBy    : 1,
                position     : '$createdBy.user.position'
            }
        });
        pipeLine.push({
            $match: afterFilter
        });
        pipeLine.push({
            $lookup: {
                from        : 'positions',
                localField  : 'position',
                foreignField: '_id',
                as          : 'position'
            }
        });
        pipeLine.push({
            $project: {
                category     : 1,
                brand        : 1,
                country      : 1,
                region       : 1,
                subRegion    : 1,
                retailSegment: 1,
                outlet       : 1,
                branch       : 1,
                createdBy    : 1,
                position     : {$arrayElemAt: ['$position', 0]}
            }
        });
        pipeLine.push({
            $project: {
                category     : {_id: 1, name: 1},
                brand        : {_id: 1, name: 1},
                country      : {_id: 1, name: 1},
                region       : {_id: 1, name: 1},
                subRegion    : {_id: 1, name: 1},
                retailSegment: {_id: 1, name: 1},
                outlet       : {_id: 1, name: 1},
                branch       : {_id: 1, name: 1},
                personnel    : {
                    _id : '$createdBy.user._id',
                    name: {
                        en: {$concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en']},
                        ar: {$concat: ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar']}
                    }
                },
                position     : {
                    _id : 1,
                    name: 1
                }
            }
        });
        pipeLine.push({
            $group: {
                _id          : null,
                category     : {$addToSet: '$category'},
                brand        : {$addToSet: '$brand'},
                country      : {$addToSet: '$country'},
                region       : {$addToSet: '$region'},
                subRegion    : {$addToSet: '$subRegion'},
                retailSegment: {$addToSet: '$retailSegment'},
                outlet       : {$addToSet: '$outlet'},
                branch       : {$addToSet: '$branch'},
                position     : {$addToSet: '$position'},
                personnel    : {$addToSet: '$personnel'}
            }
        });
        aggregation = CompetitorPromotionModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            var response;

            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {
                category     : result.category || [],
                brand        : result.brand || [],
                country      : result.country || [],
                region       : result.region || [],
                subRegion    : result.subRegion || [],
                retailSegment: result.retailSegment || [],
                outlet       : result.outlet || [],
                branch       : result.branch || [],
                position     : result.position || [],
                personnel    : result.personnel || []
            };

            redisFilters({
                currentSelected: currentSelected,
                filterExists   : filterExists,
                filtersObject  : result,
                personnelId    : req.personnelModel._id,
                contentType    : CONTENT_TYPES.COMPETITORPROMOTION
            }, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.promotionFilters = function (req, res, next) {
        var BranchModel = db.model(CONTENT_TYPES.BRANCH, mongoose.Schemas[CONTENT_TYPES.BRANCH]);
        var DomainModel = db.model(CONTENT_TYPES.DOMAIN, mongoose.Schemas[CONTENT_TYPES.DOMAIN]);
        var PromotionModel = db.model(CONTENT_TYPES.PROMOTIONS, promotionsSchema);
        var query = req.query;
        var queryFilter = query.filter || {};
        var filterMapper = new FilterMapper();
        var currentSelected = query.current;
        var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        var filter = filterMapper.mapFilter({
            filter   : queryFilter,
            personnel: req.personnelModel
        });
        var queryForFunction;
        var subRegionIds;

        $defProjection = _.extend({
            employee: 1
        }, $defProjection);

        async.waterfall([
                function (waterfallCb) {
                    if (!filter.branch) {
                        return waterfallCb();
                    }
                    var pipeLine = [];
                    var aggregation;

                    pipeLine.push({
                        $match: {
                            _id: filter.branch
                        }
                    });

                    pipeLine.push({
                        $project: {
                            _id          : 1,
                            subRegion    : 1,
                            retailSegment: 1,
                            outlet       : 1
                        }
                    });

                    pipeLine.push({
                        $group: {
                            _id          : null,
                            subRegion    : {$addToSet: '$subRegion'},
                            retailSegment: {$addToSet: '$retailSegment'},
                            outlet       : {$addToSet: '$outlet'}
                        }
                    });

                    aggregation = BranchModel.aggregate(pipeLine);

                    aggregation.options = {
                        allowDiskUse: true
                    };

                    aggregation.exec(function (err, result) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        if (result) {
                            result = result[0];
                            if (!filter.subRegion) {
                                filter.subRegion = {$in: result.subRegion};
                            }
                            if (!filter.outlet) {
                                filter.outlet = {$in: result.outlet};
                            }
                            if (!filter.retailSegment) {
                                filter.retailSegment = {$in: result.retailSegment};
                            }
                        }
                        waterfallCb();
                    });
                },
                function (waterfallCb) {
                    if (!filter || !filter.region) {
                        return waterfallCb(null, null);
                    }
                    queryForFunction = {type: 'subRegion', parent: filter.region};
                    self.getLocationIds(DomainModel, {query: queryForFunction}, function (err, collection) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        subRegionIds = collection ? _.pluck(collection, '_id') : [];

                        waterfallCb(null, subRegionIds);

                    });
                },
                function (collection, waterfallCb) {
                    var aggregationHelper = new AggregationHelper($defProjection, filter);
                    var beforeFilter = _.pick(filter, 'type', 'status', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', '$and', '$or', 'createdBy');
                    var pipeLine = [];
                    var aggregation;

                    pipeLine.push({
                        $match: beforeFilter
                    });

                    pipeLine.push({
                        $match: {
                            status: {
                                $ne: 'expired'
                            }
                        }
                    });

                    if (filter.personnel) {
                        pipeLine.push({
                            $match: {
                                'createdBy.user': filter.personnel
                            }
                        });
                    }

                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from         : 'personnels',
                        key          : 'createdBy.user',
                        isArray      : false,
                        addProjection: ['firstName', 'lastName', 'position']
                    }));

                    if (filter.position) {
                        pipeLine.push({
                            $match: {
                                'createdBy.user.position': filter.position
                            }
                        })
                    }

                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from           : 'positions',
                        key            : 'createdBy.user.position',
                        isArray        : false,
                        includeSiblings: {
                            createdBy: {
                                user: {
                                    firstName: 1,
                                    lastName : 1,
                                    _id      : 1
                                }
                            }
                        }
                    }));

                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from   : 'domains',
                        key    : 'country',
                        isArray: false
                    }));

                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from: 'domains',
                        key : 'region'
                    }));

                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from: 'domains',
                        key : 'subRegion'
                    }));

                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from   : 'categories',
                        key    : 'category',
                        isArray: false
                    }));

                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from         : 'branches',
                        key          : 'branch',
                        addProjection: ['outlet', 'retailSegment', 'subRegion']
                    }));

                    if (filter.outlet || filter.retailSegment || filter.subRegion) {
                        pipeLine.push({
                            $unwind: {
                                path                      : '$branch',
                                preserveNullAndEmptyArrays: true
                            }
                        });

                        if (filter.outlet) {
                            pipeLine.push({
                                $match: {
                                    $or: [
                                        {
                                            'branch.outlet': filter.outlet
                                        },
                                        {
                                            'branch.outlet': {$exists: false}
                                        }
                                    ]
                                }
                            });
                        }

                        if (filter.retailSegment) {
                            pipeLine.push({
                                $match: {
                                    $or: [
                                        {
                                            'branch.retailSegment': filter.retailSegment
                                        },
                                        {
                                            'branch.retailSegment': {$exists: false}
                                        }
                                    ]
                                }
                            });
                        }

                        if (filter.subRegion) {
                            pipeLine.push({
                                $match: {
                                    $or: [
                                        {
                                            'branch.subRegion': filter.subRegion
                                        },
                                        {
                                            'branch.subRegion': {$exists: false}
                                        }
                                    ]
                                }
                            });
                        }

                        pipeLine.push({
                            $group: aggregationHelper.getGroupObject({
                                branch: {$addToSet: '$branch'}
                            })
                        });
                    }

                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from         : 'outlets',
                        key          : 'outlet',
                        addProjection: ['retailSegments', 'subRegions']
                    }));

                    if (filter.retailSegment || filter.subRegion) {
                        pipeLine.push({
                            $unwind: {
                                path                      : '$outlet',
                                preserveNullAndEmptyArrays: true
                            }
                        });

                        if (filter.retailSegment) {
                            pipeLine.push({
                                $match: {
                                    $or: [
                                        {
                                            'outlet.retailSegments': filter.retailSegment
                                        },
                                        {
                                            'outlet.retailSegments': {
                                                $exists: false
                                            }
                                        }
                                    ]
                                }
                            });
                        }

                        if (filter.subRegion) {
                            pipeLine.push({
                                $match: {
                                    $or: [
                                        {
                                            'outlet.subRegions': filter.subRegion
                                        },
                                        {
                                            'outlet.subRegions': {
                                                $exists: false
                                            }
                                        }
                                    ]
                                }
                            });
                        }

                        pipeLine.push({
                            $group: aggregationHelper.getGroupObject({
                                outlet: {$addToSet: '$outlet'}
                            })
                        });
                    }

                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from         : 'retailSegments',
                        key          : 'retailSegment',
                        addProjection: ['subRegions']
                    }));

                    if (filter.subRegion) {
                        pipeLine.push({
                            $unwind: {
                                path                      : '$retailSegment',
                                preserveNullAndEmptyArrays: true
                            }
                        });

                        pipeLine.push({
                            $match: {
                                $or: [
                                    {
                                        'retailSegment.subRegions': filter.subRegion
                                    },
                                    {
                                        'retailSegment.subRegions': {
                                            $exists: false
                                        }
                                    }
                                ]
                            }
                        });

                        pipeLine.push({
                            $group: aggregationHelper.getGroupObject({
                                retailSegment: {$addToSet: '$retailSegment'}
                            })
                        });
                    }

                    pipeLine.push({
                        $project: aggregationHelper.getProjection({
                            type: {
                                _id : '$type',
                                name: {
                                    en: '$type'
                                }
                            },

                            status: {
                                _id : '$status',
                                name: {
                                    en: '$status'
                                }
                            },

                            position: '$createdBy.user.position',
                            employee: '$createdBy.user'
                        })
                    });

                    pipeLine.push({
                        $project: aggregationHelper.getProjection({
                            employee: {
                                _id : '$employee._id',
                                name: {
                                    en: {$concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en']},
                                    ar: {$concat: ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar']}
                                }
                            }
                        })
                    });

                    pipeLine.push({
                        $group: {
                            _id          : null,
                            country      : {$addToSet: '$country'},
                            region       : {$addToSet: '$region'},
                            subRegion    : {$addToSet: '$subRegion'},
                            retailSegment: {$addToSet: '$retailSegment'},
                            outlet       : {$addToSet: '$outlet'},
                            branch       : {$addToSet: '$branch'},
                            type         : {$addToSet: '$type'},
                            status       : {$addToSet: '$status'},
                            category     : {$addToSet: '$category'},
                            position     : {$addToSet: '$position'},
                            employee     : {$addToSet: '$employee'}
                        }
                    });

                    aggregation = PromotionModel.aggregate(pipeLine);

                    aggregation.options = {
                        allowDiskUse: true
                    };

                    aggregation.exec(function (err, result) {
                        if (err) {
                            return waterfallCb(err);
                        }

                        result = result[0] || {};

                        result = {
                            country      : result.country || [],
                            category     : result.category || [],
                            position     : result.position || [],
                            region       : result.region && _.uniq(_.flatten(result.region)) || [],
                            subRegion    : result.subRegion && _.uniq(_.flatten(result.subRegion)) || [],
                            retailSegment: result.retailSegment && _.uniq(_.flatten(result.retailSegment)) || [],
                            outlet       : result.outlet && _.uniq(_.flatten(result.outlet)) || [],
                            branch       : result.branch && _.uniq(_.flatten(result.branch)) || [],
                            personnel    : result.employee && _.uniq(_.flatten(result.employee)) || [],
                            type         : result.type || [],
                            status       : result.status || []
                        };

                        Object.keys(result).forEach(function (key) {
                            if (result[key]) {
                                var condition = subRegionIds && key === 'subRegion';
                                var i = result[key].length - 1;
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
            function (err, result) {
                if (err) {
                    return next(err);
                }

                redisFilters({
                    currentSelected: currentSelected,
                    filterExists   : filterExists,
                    filtersObject  : result,
                    personnelId    : req.personnelModel._id,
                    contentType    : CONTENT_TYPES.PROMOTIONS
                }, function (err, response) {
                    if (err) {
                        return next(err);
                    }

                    res.status(200).send(response);
                });
            });
    };

    this.promotionLocationFilters = function (req, res, next) {
        var domainSchema = mongoose.Schemas[CONTENT_TYPES.DOMAIN];
        var DomainModel = db.model(CONTENT_TYPES.DOMAIN, domainSchema);
        var BranchModel = db.model(CONTENT_TYPES.BRANCH, mongoose.Schemas[CONTENT_TYPES.BRANCH]);
        var query = req.query;
        var queryFilter = query.filter || {};
        var currentSelected = query.current;
        var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        var edit = query.edit;
        var countryFromFilter;
        var regionFromFilter;
        var subRegionFromFilter;
        var filterMapper = new FilterMapper();
        var filter = filterMapper.mapFilter({
            filter   : queryFilter,
            personnel: req.personnelModel
        });
        if (edit) {
            countryFromFilter = filter.country;
            regionFromFilter = filter.region;
            subRegionFromFilter = filter.subRegion;
            filter = {};
        }
        var keys = Object.keys(filter);
        var queryForFunction;
        var result = {};
        var personnel = req.personnelModel;
        async.waterfall([
            function (waterfallCb) {
                queryForFunction = personnel.country.length ? {
                    type: 'country',
                    _id : {$in: personnel.country.objectID()}
                } : {type: 'country'};
                if (_.indexOf(keys, 'country') !== -1) {
                    queryForFunction._id = filter.country;
                }

                self.getLocationIds(DomainModel, {query: queryForFunction}, function (err, collection) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    result.country = collection;

                    waterfallCb(null, collection);

                });
            },
            function (collection, waterfallCb) {
                queryForFunction = {
                    type  : 'region',
                    parent: countryFromFilter ? countryFromFilter : {$in: _.pluck(collection, '_id')}
                };
                if (_.indexOf(keys, 'region') !== -1) {
                    delete queryForFunction.parent;
                    queryForFunction._id = filter.region;
                }
                self.getLocationIds(DomainModel, {query: queryForFunction}, function (err, collection) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    result.region = collection;

                    waterfallCb(null, collection);

                });
            },
            function (collection, waterfallCb) {
                queryForFunction = {
                    type  : 'subRegion',
                    parent: regionFromFilter ? regionFromFilter : {$in: _.pluck(collection, '_id')}
                };
                if (_.indexOf(keys, 'subRegion') !== -1) {
                    delete queryForFunction.parent;
                    queryForFunction._id = filter.subRegion;
                }
                self.getLocationIds(DomainModel, {query: queryForFunction}, function (err, collection) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    result.subRegion = collection;

                    waterfallCb(null, collection);

                });
            },
            function (collection, waterfallCb) {
                var addProjection = {retailSegment: 1, outlet: 1};
                var customQuery = {subRegion: subRegionFromFilter ? subRegionFromFilter : {$in: _.pluck(collection, '_id')}};
                queryForFunction = personnel.branch.length ? customQuery._id = {$in: personnel.branch} : customQuery;
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
                    addProjection: addProjection,
                    query        : queryForFunction
                }, function (err, collection) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    _.extend(result, collection[0]);
                    waterfallCb(null, result);

                });
            }

        ], function (err, result) {
            if (err) {
                return next(err);
            }
            redisFilters({
                currentSelected: currentSelected,
                filterExists   : filterExists,
                filtersObject  : result,
                personnelId    : req.personnelModel._id,
                contentType    : 'createEditPromotions'
            }, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.achievementFormFilters = function (req, res, next) {
        var CompetitorBrandingModel = db.model(CONTENT_TYPES.ACHIEVEMENTFORM, mongoose.Schemas[CONTENT_TYPES.ACHIEVEMENTFORM]);
        var query = req.query;
        var queryFilter = query.filter || {};

        var filterMapper = new FilterMapper();

        var currentSelected = query.current;
        var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        var filter = filterMapper.mapFilter({
            filter   : queryFilter,
            personnel: req.personnelModel
        });
        var beforeFilter = _.pick(filter, 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', '$and', '$or');
        var employeeFilter = filter.personnel ? {'createdBy.user': _.pick(filter, 'personnel').personnel} : {};
        var afterFilter = _.pick(filter, 'position');
        var aggregation;
        var pipeLine = [];
        pipeLine.push({
            $match: beforeFilter
        });

        pipeLine.push({
            $match: employeeFilter
        });

        pipeLine.push({
            $lookup: {
                from        : 'domains',
                localField  : 'country',
                foreignField: '_id',
                as          : 'country'
            }
        });

        pipeLine.push({
            $lookup: {
                from        : 'domains',
                localField  : 'region',
                foreignField: '_id',
                as          : 'region'
            }
        });

        pipeLine.push({
            $lookup: {
                from        : 'domains',
                localField  : 'subRegion',
                foreignField: '_id',
                as          : 'subRegion'
            }
        });

        pipeLine.push({
            $lookup: {
                from        : 'retailSegments',
                localField  : 'retailSegment',
                foreignField: '_id',
                as          : 'retailSegment'
            }
        });

        pipeLine.push({
            $lookup: {
                from        : 'outlets',
                localField  : 'outlet',
                foreignField: '_id',
                as          : 'outlet'
            }
        });

        pipeLine.push({
            $lookup: {
                from        : 'branches',
                localField  : 'branch',
                foreignField: '_id',
                as          : 'branch'
            }
        });

        pipeLine.push({
            $lookup: {
                from        : 'personnels',
                localField  : 'createdBy.user',
                foreignField: '_id',
                as          : 'createdBy.user'
            }
        });

        pipeLine.push({
            $project: {
                country      : {$arrayElemAt: ['$country', 0]},
                region       : {$arrayElemAt: ['$region', 0]},
                subRegion    : {$arrayElemAt: ['$subRegion', 0]},
                retailSegment: {$arrayElemAt: ['$retailSegment', 0]},
                outlet       : {$arrayElemAt: ['$outlet', 0]},
                branch       : {$arrayElemAt: ['$branch', 0]},
                createdBy    : {
                    user: {$arrayElemAt: ['$createdBy.user', 0]}
                }
            }
        });

        pipeLine = _.union(pipeLine, domainPileLine({
            filter: filter
        }));

        pipeLine.push({
            $project: {
                country      : 1,
                region       : 1,
                subRegion    : 1,
                retailSegment: 1,
                outlet       : 1,
                branch       : 1,
                createdBy    : 1,
                position     : '$createdBy.user.position'
            }
        });

        pipeLine.push({
            $match: afterFilter
        });

        pipeLine.push({
            $lookup: {
                from        : 'positions',
                localField  : 'position',
                foreignField: '_id',
                as          : 'position'
            }
        });

        pipeLine.push({
            $project: {
                country      : 1,
                region       : 1,
                subRegion    : 1,
                retailSegment: 1,
                outlet       : 1,
                branch       : 1,
                createdBy    : 1,
                position     : {$arrayElemAt: ['$position', 0]}
            }
        });

        pipeLine.push({
            $project: {
                country      : {_id: 1, name: 1},
                region       : {_id: 1, name: 1},
                subRegion    : {_id: 1, name: 1},
                retailSegment: {_id: 1, name: 1},
                outlet       : {_id: 1, name: 1},
                branch       : {_id: 1, name: 1},
                personnel    : {
                    _id : '$createdBy.user._id',
                    name: {
                        en: {$concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en']},
                        ar: {$concat: ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar']}
                    }
                },
                position     : {
                    _id : 1,
                    name: 1
                }
            }
        });

        pipeLine.push({
            $group: {
                _id          : null,
                country      : {$addToSet: '$country'},
                region       : {$addToSet: '$region'},
                subRegion    : {$addToSet: '$subRegion'},
                retailSegment: {$addToSet: '$retailSegment'},
                outlet       : {$addToSet: '$outlet'},
                branch       : {$addToSet: '$branch'},
                position     : {$addToSet: '$position'},
                personnel    : {$addToSet: '$personnel'}
            }
        });

        aggregation = CompetitorBrandingModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            var response;

            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {
                country      : result.country || [],
                region       : result.region || [],
                subRegion    : result.subRegion || [],
                retailSegment: result.retailSegment || [],
                outlet       : result.outlet || [],
                branch       : result.branch || [],
                position     : result.position || [],
                personnel    : result.personnel || []
            };

            redisFilters({
                currentSelected: currentSelected,
                filterExists   : filterExists,
                filtersObject  : result,
                personnelId    : req.personnelModel._id,
                contentType    : CONTENT_TYPES.ACHIEVEMENTFORM
            }, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.newProductLaunchFilters = function (req, res, next) {
        var NewProductLaunchModel = db.model(CONTENT_TYPES.NEWPRODUCTLAUNCH, mongoose.Schemas[CONTENT_TYPES.NEWPRODUCTLAUNCH]);
        var query = req.query;
        var queryFilter = query.filter || {};

        var filterMapper = new FilterMapper();

        var currentSelected = query.current;
        var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        var filter = filterMapper.mapFilter({
            filter   : queryFilter,
            personnel: req.personnelModel
        });
        var beforeFilter = _.pick(filter, 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', '$and', '$or');
        var employeeFilter = filter.personnel ? {'createdBy.user': _.pick(filter, 'personnel').personnel} : {};
        var afterFilter = _.pick(filter, 'position');
        var aggregation;
        var pipeLine = [];
        pipeLine.push({
            $match: beforeFilter
        });
        pipeLine.push({
            $match: employeeFilter
        });
        pipeLine.push({
            $lookup: {
                from        : 'domains',
                localField  : 'country',
                foreignField: '_id',
                as          : 'country'
            }
        });
        pipeLine.push({
            $lookup: {
                from        : 'domains',
                localField  : 'region',
                foreignField: '_id',
                as          : 'region'
            }
        });
        pipeLine.push({
            $lookup: {
                from        : 'domains',
                localField  : 'subRegion',
                foreignField: '_id',
                as          : 'subRegion'
            }
        });
        pipeLine.push({
            $lookup: {
                from        : 'retailSegments',
                localField  : 'retailSegment',
                foreignField: '_id',
                as          : 'retailSegment'
            }
        });
        pipeLine.push({
            $lookup: {
                from        : 'outlets',
                localField  : 'outlet',
                foreignField: '_id',
                as          : 'outlet'
            }
        });
        pipeLine.push({
            $lookup: {
                from        : 'branches',
                localField  : 'branch',
                foreignField: '_id',
                as          : 'branch'
            }
        });
        pipeLine.push({
            $lookup: {
                from        : 'personnels',
                localField  : 'createdBy.user',
                foreignField: '_id',
                as          : 'createdBy.user'
            }
        });
        pipeLine.push({
            $project: {
                country      : {$arrayElemAt: ['$country', 0]},
                region       : {$arrayElemAt: ['$region', 0]},
                subRegion    : {$arrayElemAt: ['$subRegion', 0]},
                retailSegment: {$arrayElemAt: ['$retailSegment', 0]},
                outlet       : {$arrayElemAt: ['$outlet', 0]},
                branch       : {$arrayElemAt: ['$branch', 0]},
                createdBy    : {
                    user: {$arrayElemAt: ['$createdBy.user', 0]}
                }
            }
        });
        pipeLine = _.union(pipeLine, domainPileLine({
            filter: filter
        }));
        pipeLine.push({
            $project: {
                country      : 1,
                region       : 1,
                subRegion    : 1,
                retailSegment: 1,
                outlet       : 1,
                branch       : 1,
                createdBy    : 1,
                position     : '$createdBy.user.position'
            }
        });
        pipeLine.push({
            $match: afterFilter
        });
        pipeLine.push({
            $lookup: {
                from        : 'positions',
                localField  : 'position',
                foreignField: '_id',
                as          : 'position'
            }
        });
        pipeLine.push({
            $project: {
                country      : 1,
                region       : 1,
                subRegion    : 1,
                retailSegment: 1,
                outlet       : 1,
                branch       : 1,
                createdBy    : 1,
                position     : {$arrayElemAt: ['$position', 0]}
            }
        });
        pipeLine.push({
            $project: {
                country      : {_id: 1, name: 1},
                region       : {_id: 1, name: 1},
                subRegion    : {_id: 1, name: 1},
                retailSegment: {_id: 1, name: 1},
                outlet       : {_id: 1, name: 1},
                branch       : {_id: 1, name: 1},
                personnel    : {
                    _id : '$createdBy.user._id',
                    name: {
                        en: {$concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en']},
                        ar: {$concat: ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar']}
                    }
                },
                position     : {
                    _id : 1,
                    name: 1
                }
            }
        });
        pipeLine.push({
            $group: {
                _id          : null,
                country      : {$addToSet: '$country'},
                region       : {$addToSet: '$region'},
                subRegion    : {$addToSet: '$subRegion'},
                retailSegment: {$addToSet: '$retailSegment'},
                outlet       : {$addToSet: '$outlet'},
                branch       : {$addToSet: '$branch'},
                position     : {$addToSet: '$position'},
                personnel    : {$addToSet: '$personnel'}
            }
        });
        aggregation = NewProductLaunchModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            var response;

            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {
                country      : result.country || [],
                region       : result.region || [],
                subRegion    : result.subRegion || [],
                retailSegment: result.retailSegment || [],
                outlet       : result.outlet || [],
                branch       : result.branch || [],
                position     : result.position || [],
                personnel    : result.personnel || []
            };

            redisFilters({
                currentSelected: currentSelected,
                filterExists   : filterExists,
                filtersObject  : result,
                personnelId    : req.personnelModel._id,
                contentType    : CONTENT_TYPES.NEWPRODUCTLAUNCH
            }, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.getLocationIds = function (model, options, cb) {
        var aggregationHelper = new AggregationHelper($defProjection);
        var query = _.extend(options.query, {archived: false});
        var addProjection = options.addProjection || null;
        var defProjection = addProjection ? _.extend({_id: 1, name: 1}, addProjection) : {_id: 1, name: 1};
        var pipLine = [];
        var aggregation;

        pipLine.push({
            $match: query
        });

        pipLine.push({
            $project: defProjection
        });

        if (!query.type) {

            pipLine = _.union(pipLine, aggregationHelper.aggregationPartMaker({
                from   : 'retailSegments',
                key    : 'retailSegment',
                isArray: false
            }));

            pipLine = _.union(pipLine, aggregationHelper.aggregationPartMaker({
                from   : 'outlets',
                key    : 'outlet',
                isArray: false
            }));

            pipLine.push({
                $group: {
                    _id          : null,
                    branch       : {
                        $addToSet: {
                            _id : '$_id',
                            name: '$name'
                        }
                    },
                    retailSegment: {$addToSet: '$retailSegment'},
                    outlet       : {$addToSet: '$outlet'}
                }
            });
        }

        aggregation = model.aggregate(pipLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return cb(err);
            }
            return cb(null, result);
        });

    };

    this.contractsYearlyLocationFilters = function (req, res, next) {
        var DomainModel = db.model(CONTENT_TYPES.DOMAIN, mongoose.Schemas[CONTENT_TYPES.DOMAIN]);
        var BranchModel = db.model(CONTENT_TYPES.BRANCH, mongoose.Schemas[CONTENT_TYPES.BRANCH]);
        var query = req.query;
        var edit = query.edit;
        var countryFromFilter;
        var regionFromFilter;
        var subRegionFromFilter;
        var personnel = req.personnelModel;
        var filterMapper = new FilterMapper();
        var filter = filterMapper.mapFilter({
            filter   : query.filter,
            personnel: personnel
        });
        if (edit) {
            countryFromFilter = filter.country;
            regionFromFilter = filter.region;
            subRegionFromFilter = filter.subRegion;
            filter = {};
        }
        var keys = Object.keys(filter);
        var queryForFunction;
        var result = {};
        async.waterfall([
            function (waterfallCb) {
                queryForFunction = personnel.country.length ? {
                    type: 'country',
                    _id : {$in: personnel.country.objectID()}
                } : {type: 'country'};
                if (_.indexOf(keys, 'country') !== -1) {
                    queryForFunction._id = filter.country;
                }

                self.getLocationIds(DomainModel, {query: queryForFunction}, function (err, collection) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    result.country = collection;

                    waterfallCb(null, collection);

                });
            },
            function (collection, waterfallCb) {
                queryForFunction = {
                    type  : 'region',
                    parent: countryFromFilter ? countryFromFilter : {$in: _.pluck(collection, '_id')}
                };
                if (_.indexOf(keys, 'region') !== -1) {
                    delete queryForFunction.parent;
                    queryForFunction._id = filter.region;
                }
                self.getLocationIds(DomainModel, {query: queryForFunction}, function (err, collection) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    result.region = collection;

                    waterfallCb(null, collection);

                })
            },
            function (collection, waterfallCb) {
                queryForFunction = {
                    type  : 'subRegion',
                    parent: regionFromFilter ? regionFromFilter : {$in: _.pluck(collection, '_id')}
                };
                if (_.indexOf(keys, 'subRegion') !== -1) {
                    delete queryForFunction.parent;
                    queryForFunction._id = filter.subRegion;
                }
                self.getLocationIds(DomainModel, {query: queryForFunction}, function (err, collection) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    result.subRegion = collection;

                    waterfallCb(null, collection);

                })
            },
            function (collection, waterfallCb) {
                var addProjection = {retailSegment: 1, outlet: 1};
                var customQuery = {subRegion: subRegionFromFilter ? subRegionFromFilter : {$in: _.pluck(collection, '_id')}};
                queryForFunction = personnel.branch.length ? customQuery._id = {$in: personnel.branch} : customQuery;
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
                    addProjection: addProjection,
                    query        : queryForFunction
                }, function (err, collection) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    _.extend(result, collection[0]);
                    waterfallCb(null, result);

                });
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });

    };

    this.contractsYearlyFilters = function (req, res, next) {
        var domainSchema = mongoose.Schemas[CONTENT_TYPES.DOMAIN];
        var DomainModel = db.model(CONTENT_TYPES.DOMAIN, domainSchema);
        var ContractsYearlyModel = db.model(CONTENT_TYPES.CONTRACTSYEARLY, contractsYearlySchema);
        var query = req.query;
        var queryFilter = query.filter || {};
        var filterMapper = new FilterMapper();
        var currentSelected = query.current;
        var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        var filter = filterMapper.mapFilter({
            filter   : queryFilter,
            personnel: req.personnelModel
        });
        var queryForFunction;
        var subRegionIds;
        if (req.session.level === 4) {
            filter.type = 'visibility';
        }

        async.waterfall([
                function (waterfallCb) {
                    if (!filter || !filter.region) {
                        return waterfallCb(null, null);
                    }
                    queryForFunction = {type: 'subRegion', parent: filter.region};
                    self.getLocationIds(DomainModel, {query: queryForFunction}, function (err, collection) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        subRegionIds = collection ? _.pluck(collection, '_id') : [];

                        waterfallCb(null, subRegionIds);

                    });
                },
                function (collection, waterfallCb) {
                    var aggregationHelper = new AggregationHelper($defProjection, filter);
                    var beforeFilter = _.pick(filter, 'type', 'status', '$and', '$or', 'createdBy');
                    var pipeLine = [];
                    var aggregation;

                    pipeLine.push({
                        $match: beforeFilter
                    });

                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from   : 'domains',
                        key    : 'country',
                        as     : 'country',
                        isArray: false
                    }));

                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from: 'domains',
                        key : 'region',
                        as  : 'region'
                    }));

                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from: 'domains',
                        key : 'subRegion',
                        as  : 'subRegion'
                    }));

                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from: 'retailSegments',
                        key : 'retailSegment',
                        as  : 'retailSegment'
                    }));

                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from: 'outlets',
                        key : 'outlet',
                        as  : 'outlet'
                    }));

                    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                        from: 'branches',
                        key : 'branch',
                        as  : 'branch'
                    }));

                    pipeLine.push({
                        $project: {
                            country      : 1,
                            region       : 1,
                            subRegion    : 1,
                            retailSegment: 1,
                            outlet       : 1,
                            branch       : 1,
                            type         : {
                                _id : '$type',
                                name: {
                                    en: '$type'
                                }
                            },
                            status       : {
                                _id : '$status',
                                name: {
                                    en: '$status'
                                }
                            }
                        }
                    });

                    pipeLine.push({
                        $group: {
                            _id          : null,
                            country      : {$addToSet: '$country'},
                            region       : {$addToSet: '$region'},
                            subRegion    : {$addToSet: '$subRegion'},
                            retailSegment: {$addToSet: '$retailSegment'},
                            outlet       : {$addToSet: '$outlet'},
                            branch       : {$addToSet: '$branch'},
                            type         : {$addToSet: '$type'},
                            status       : {$addToSet: '$status'}
                        }
                    });

                    aggregation = ContractsYearlyModel.aggregate(pipeLine);

                    aggregation.options = {
                        allowDiskUse: true
                    };

                    aggregation.exec(function (err, result) {
                        if (err) {
                            return waterfallCb(err);
                        }

                        result = result[0] || {};

                        result = {
                            country      : result.country || [],
                            region       : result.region && _.uniq(_.flatten(result.region)) || [],
                            subRegion    : result.subRegion && _.uniq(_.flatten(result.subRegion)) || [],
                            retailSegment: result.retailSegment && _.uniq(_.flatten(result.retailSegment)) || [],
                            outlet       : result.outlet && _.uniq(_.flatten(result.outlet)) || [],
                            branch       : result.branch && _.uniq(_.flatten(result.branch)) || [],
                            type         : result.type || [],
                            status       : result.status || []
                        };

                        Object.keys(result).forEach(function (key) {
                            if (result[key]) {
                                var condition = subRegionIds && key === 'subRegion';
                                var i = result[key].length - 1;
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
            function (err, result) {
                if (err) {
                    return next(err);
                }

                redisFilters({
                    currentSelected: currentSelected,
                    filterExists   : filterExists,
                    filtersObject  : result,
                    personnelId    : req.personnelModel._id,
                    contentType    : CONTENT_TYPES.CONTRACTSYEARLY
                }, function (err, response) {
                    if (err) {
                        return next(err);
                    }

                    res.status(200).send(response);
                });
            });
    };

    this.contractsSecondaryLocationFilters = function (req, res, next) {
        var domainSchema = mongoose.Schemas[CONTENT_TYPES.DOMAIN];
        var DomainModel = db.model(CONTENT_TYPES.DOMAIN, domainSchema);
        var BranchModel = db.model(CONTENT_TYPES.BRANCH, mongoose.Schemas[CONTENT_TYPES.BRANCH]);
        var query = req.query;
        var edit = query.edit;
        var countryFromFilter;
        var regionFromFilter;
        var subRegionFromFilter;
        var filterMapper = new FilterMapper();
        var filter = filterMapper.mapFilter({
            filter   : query.filter,
            personnel: req.personnelModel
        });
        if (edit) {
            countryFromFilter = filter.country;
            regionFromFilter = filter.region;
            subRegionFromFilter = filter.subRegion;
            filter = {};
        }
        var keys = Object.keys(filter);
        var queryForFunction;
        var result = {};
        var personnel = req.personnelModel;
        async.waterfall([
            function (waterfallCb) {
                queryForFunction = personnel.country.length ? {
                    type: 'country',
                    _id : {$in: personnel.country.objectID()}
                } : {type: 'country'};
                if (_.indexOf(keys, 'country') !== -1) {
                    queryForFunction._id = filter.country;
                }

                self.getLocationIds(DomainModel, {query: queryForFunction}, function (err, collection) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    result.country = collection;

                    waterfallCb(null, collection);

                });
            },
            function (collection, waterfallCb) {
                queryForFunction = {
                    type  : 'region',
                    parent: countryFromFilter ? countryFromFilter : {$in: _.pluck(collection, '_id')}
                };
                if (_.indexOf(keys, 'region') !== -1) {
                    delete queryForFunction.parent;
                    queryForFunction._id = filter.region;
                }
                self.getLocationIds(DomainModel, {query: queryForFunction}, function (err, collection) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    result.region = collection;

                    waterfallCb(null, collection);

                });
            },
            function (collection, waterfallCb) {
                queryForFunction = {
                    type  : 'subRegion',
                    parent: regionFromFilter ? regionFromFilter : {$in: _.pluck(collection, '_id')}
                };
                if (_.indexOf(keys, 'subRegion') !== -1) {
                    delete queryForFunction.parent;
                    queryForFunction._id = filter.subRegion;
                }
                self.getLocationIds(DomainModel, {query: queryForFunction}, function (err, collection) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    result.subRegion = collection;

                    waterfallCb(null, collection);

                });
            },
            function (collection, waterfallCb) {
                var addProjection = {retailSegment: 1, outlet: 1};
                var customQuery = {subRegion: subRegionFromFilter ? subRegionFromFilter : {$in: _.pluck(collection, '_id')}};
                queryForFunction = personnel.branch.length ? customQuery._id = {$in: personnel.branch} : customQuery;
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
                    addProjection: addProjection,
                    query        : queryForFunction
                }, function (err, collection) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    _.extend(result, collection[0]);
                    waterfallCb(null, result);

                });
            }

        ], function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send(result);
        });
    };

    this.contractsSecondaryFilters = function (req, res, next) {
        var domainSchema = mongoose.Schemas[CONTENT_TYPES.DOMAIN];
        var DomainModel = db.model(CONTENT_TYPES.DOMAIN, domainSchema);
        var ContractsSecondaryModel = db.model(CONTENT_TYPES.CONTRACTSSECONDARY, contractsSecondarySchema);
        var query = req.query;
        var queryFilter = query.filter || {};

        var filterMapper = new FilterMapper();

        var currentSelected = query.current;
        var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        var filter = filterMapper.mapFilter({
            filter   : queryFilter,
            personnel: req.personnelModel
        });

        var aggregationHelper = new AggregationHelper($defProjection, filter);
        var queryForFunction;
        var subRegionIds;

        async.waterfall([
            function (waterfallCb) {
                if (!filter || !filter.region) {
                    return waterfallCb(null, null);
                }
                queryForFunction = {type: 'subRegion', parent: filter.region};
                self.getLocationIds(DomainModel, {query: queryForFunction}, function (err, collection) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    subRegionIds = collection ? _.pluck(collection, '_id') : [];

                    waterfallCb(null, subRegionIds);

                });
            },
            function (collection, waterfallCb) {
                var beforeFilter = _.pick(filter, 'type', 'status', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', '$and', '$or', 'createdBy');
                var pipeLine = [];
                var aggregation;

                pipeLine.push({
                    $match: beforeFilter
                });

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from   : 'domains',
                    key    : 'country',
                    as     : 'country',
                    isArray: false
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from   : 'categories',
                    key    : 'category',
                    as     : 'category',
                    isArray: false
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from         : 'domains',
                    key          : 'region',
                    as           : 'region',
                    isArray      : true,
                    addProjection: ['parent']
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from         : 'domains',
                    key          : 'subRegion',
                    as           : 'subRegion',
                    isArray      : true,
                    addProjection: ['parent']
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from   : 'retailSegments',
                    key    : 'retailSegment',
                    as     : 'retailSegment',
                    isArray: true
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from   : 'outlets',
                    key    : 'outlet',
                    as     : 'outlet',
                    isArray: true
                }));

                pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
                    from   : 'branches',
                    key    : 'branch',
                    as     : 'branch',
                    isArray: true
                }));

                pipeLine.push({
                    $project: {
                        country      : 1,
                        category     : 1,
                        region       : 1,
                        subRegion    : 1,
                        retailSegment: 1,
                        outlet       : 1,
                        branch       : 1,
                        type         : {
                            _id : '$type',
                            name: {
                                en: '$type'
                            }
                        },
                        status       : {
                            _id : '$status',
                            name: {
                                en: '$status'
                            }
                        }
                    }
                });

                pipeLine.push({
                    $group: {
                        _id          : null,
                        country      : {$addToSet: '$country'},
                        region       : {$addToSet: '$region'},
                        subRegion    : {$addToSet: '$subRegion'},
                        retailSegment: {$addToSet: '$retailSegment'},
                        outlet       : {$addToSet: '$outlet'},
                        branch       : {$addToSet: '$branch'},
                        type         : {$addToSet: '$type'},
                        category     : {$addToSet: '$category'},
                        status       : {$addToSet: '$status'}
                    }
                });

                aggregation = ContractsSecondaryModel.aggregate(pipeLine);

                aggregation.options = {
                    allowDiskUse: true
                };

                aggregation.exec(function (err, result) {
                    if (err) {
                        return waterfallCb(err);
                    }

                    result = result[0] || {};

                    result = {
                        country      : result.country || [],
                        category     : result.category || [],
                        region       : result.region && _.uniq(_.flatten(result.region)) || [],
                        subRegion    : result.subRegion && _.uniq(_.flatten(result.subRegion)) || [],
                        retailSegment: result.retailSegment && _.uniq(_.flatten(result.retailSegment)) || [],
                        outlet       : result.outlet && _.uniq(_.flatten(result.outlet)) || [],
                        branch       : result.branch && _.uniq(_.flatten(result.branch)) || [],
                        type         : result.type || [],
                        status       : result.status || []
                    };

                    Object.keys(result).forEach(function (key) {
                        if (result[key]) {
                            var condition = subRegionIds && key === 'subRegion';
                            var i = result[key].length - 1;

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
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }

            redisFilters({
                currentSelected: currentSelected,
                filterExists   : filterExists,
                filtersObject  : result,
                personnelId    : req.personnelModel._id,
                contentType    : CONTENT_TYPES.CONTRACTSSECONDARY
            }, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.documentsFilters = function (req, res, next) {
        var documentModel = db.model(CONTENT_TYPES.DOCUMENTS, documentsSchema);
        var query = req.query;

        var queryFilter = query.filter || {};

        var filterMapper = new FilterMapper();

        var currentSelected = query.current;
        var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
        var filter = filterMapper.mapFilter({
            filter   : queryFilter,
            personnel: req.personnelModel
        });
        var beforeFilter = _.pick(filter, 'archived');

        var aggregation = documentModel.aggregate([
            {
                $project: {
                    archived: 1
                }
            },
            {
                $match: beforeFilter
            }
        ]);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result[0] || {};

            result = {};

            redisFilters({
                currentSelected: currentSelected,
                filterExists   : filterExists,
                filtersObject  : result,
                personnelId    : req.personnelModel._id,
                contentType    : CONTENT_TYPES.DOCUMENTS
            }, function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });
        });
    };

    this.notesFilters = function (req, res, next) {
        var noteModel = db.model(CONTENT_TYPES.NOTES, notesSchema);
        var query = req.query;
        var queryFilter = query.filter || {};

        var filterMapper = new FilterMapper();

        var filter = filterMapper.mapFilter({
            filter   : queryFilter,
            personnel: req.personnelModel
        });
        var beforeFilter = _.pick(filter, 'archived');

        var aggregation = noteModel.aggregate([
            {
                $project: {
                    archived: 1
                }
            },
            {
                $match: beforeFilter
            }
        ]);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return next(err);
            }

            result = result[0] || {};

            var response = {};

            res.status(200).send(response);
        });
    };

};

module.exports = Filters;
