var ActivityHelper = function (db, redis, app) {
    'use strict';

    var async = require('async');
    var mongoose = require('mongoose');
    var _ = require('lodash');
    var Pushes = require('../helpers/pushes');
    var logWriter = require('../helpers/logWriter.js');
    var pushes = new Pushes(db);
    var ObjectId = mongoose.Types.ObjectId;
    var AggregationHelper = require('../helpers/aggregationCreater');
    var ACL_CONSTANTS = require('../constants/aclRolesNames');
    var MAIN_CONSTANTS = require('../constants/mainConstants.js');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var actionKeyTemplate = _.template(MAIN_CONSTANTS.REDIS_ACTIONS_TEMPLATE_STRING);
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var activitySchema = mongoose.Schemas[CONTENT_TYPES.ACTIVITYLIST];
    var ActivityModel = db.model(CONTENT_TYPES.ACTIVITYLIST, activitySchema);
    var personnelSchema = mongoose.Schemas[CONTENT_TYPES.PERSONNEL];
    var PersonnelModel = db.model(CONTENT_TYPES.PERSONNEL, personnelSchema);
    /*var domainSchema = mongoose.Schemas[CONTENT_TYPES.DOMAIN];
     var DomainModel = db.model(CONTENT_TYPES.DOMAIN, domainSchema);
     var branchSchema = mongoose.Schemas[CONTENT_TYPES.BRANCH];
     var BranchModel = db.model(CONTENT_TYPES.BRANCH, branchSchema);
     var itemSchema = mongoose.Schemas[CONTENT_TYPES.ITEM];
     var planogramSchema = mongoose.Schemas[CONTENT_TYPES.PLANOGRAM];
     var PlanogramModel = db.model(CONTENT_TYPES.PLANOGRAM, planogramSchema);
     var objectivesSchema = mongoose.Schemas[CONTENT_TYPES.OBJECTIVES];
     var ObjectivesModel = db.model(CONTENT_TYPES.OBJECTIVES, objectivesSchema);
     var competitorListSchema = mongoose.Schemas[CONTENT_TYPES.COMPETITORITEM];
     var CompetitorListModel = db.model(CONTENT_TYPES.COMPETITORITEM, competitorListSchema);
     var brandSchema = mongoose.Schemas[CONTENT_TYPES.BRAND];
     var BrandModel = db.model(CONTENT_TYPES.BRAND, brandSchema);
     var priceSurveySchema = mongoose.Schemas[CONTENT_TYPES.PRICESURVEY];
     var PriceSurveyModel = db.model(CONTENT_TYPES.PRICESURVEY, priceSurveySchema);
     var competitorBrandingSchema = mongoose.Schemas[CONTENT_TYPES.COMPETITORBRANDING];
     var CompetitorBrandingModel = db.model(CONTENT_TYPES.COMPETITORBRANDING, competitorBrandingSchema);
     var competitorPromotionSchema = mongoose.Schemas[CONTENT_TYPES.COMPETITORPROMOTION];
     var CompetitorPromotionModel = db.model(CONTENT_TYPES.COMPETITORPROMOTION, competitorPromotionSchema);
     var promotionSchema = mongoose.Schemas[CONTENT_TYPES.PROMOTIONS];
     var PromotionModel = db.model(CONTENT_TYPES.PROMOTIONS, promotionSchema);
     var achievementSchema = mongoose.Schemas[CONTENT_TYPES.ACHIEVEMENTFORM];
     var AchievementFormModel = db.model(CONTENT_TYPES.ACHIEVEMENTFORM, achievementSchema);
     var newProductLaunchSchema = mongoose.Schemas[CONTENT_TYPES.NEWPRODUCTLAUNCH];
     var NewProductLaunchModel = db.model(CONTENT_TYPES.NEWPRODUCTLAUNCH, newProductLaunchSchema);
     var shelfShareSchema = mongoose.Schemas[CONTENT_TYPES.SHELF_SHARE];
     var ShelfShareModel = db.model(CONTENT_TYPES.SHELF_SHARE, shelfShareSchema);
     var contractsSecondarySchema = mongoose.Schemas[CONTENT_TYPES.CONTRACTSSECONDARY];
     var ContractsSecondaryModel = db.model(CONTENT_TYPES.CONTRACTSSECONDARY, contractsSecondarySchema);
     var contractsYearlySchema = mongoose.Schemas[CONTENT_TYPES.CONTRACTSYEARLY];
     var ContractsYearlyModel = db.model(CONTENT_TYPES.CONTRACTSYEARLY, contractsYearlySchema);
     var competitorVariantSchema = mongoose.Schemas[CONTENT_TYPES.COMPETITORVARIANT];
     var CompetitorVariantModel = db.model(CONTENT_TYPES.COMPETITORVARIANT, competitorVariantSchema);*/
    var access = require('../helpers/access')(db);
    /*var ItemModel = db.model(CONTENT_TYPES.ITEM, itemSchema);
     var variantSchema = mongoose.Schemas[CONTENT_TYPES.VARIANT];
     var VariantModel = db.model(CONTENT_TYPES.VARIANT, variantSchema);
     var outletSchema = mongoose.Schemas[CONTENT_TYPES.OUTLET];
     var OutletModel = db.model(CONTENT_TYPES.OUTLET, outletSchema);
     var retailSegmentSchema = mongoose.Schemas[CONTENT_TYPES.RETAILSEGMENT];
     var RetailSegmentModel = db.model(CONTENT_TYPES.RETAILSEGMENT, retailSegmentSchema);
     var notificationSchema = mongoose.Schemas[CONTENT_TYPES.NOTIFICATIONS];
     var NotificationModel = db.model(CONTENT_TYPES.NOTIFICATIONS, notificationSchema);*/

    var levelsByLevel = {
        1: [
            ACL_CONSTANTS.MASTER_ADMIN,
            ACL_CONSTANTS.MASTER_UPLOADER,
            ACL_CONSTANTS.VIRTUAL
        ], // [1, 8, 11]
        2: [
            ACL_CONSTANTS.MASTER_ADMIN,
            ACL_CONSTANTS.MASTER_UPLOADER,
            ACL_CONSTANTS.VIRTUAL
        ], // [1, 8, 11],
        3: _(ACL_CONSTANTS).pick([
            'MASTER_ADMIN',
            'COUNTRY_ADMIN',
            'COUNTRY_UPLOADER',
            'MASTER_UPLOADER',
            'VIRTUAL'
        ]).values().value(), // [2, 9, 1, 8, 11],
        4: _(ACL_CONSTANTS).pick([
            'MASTER_ADMIN',
            'COUNTRY_ADMIN',
            'AREA_MANAGER',
            'MASTER_UPLOADER',
            'COUNTRY_UPLOADER',
            'VIRTUAL'
        ]).values().value(),// [2, 9, 1, 8, 3, 11],
        5: _(ACL_CONSTANTS).omit([
            'SUPER_ADMIN',
            'SALES_MAN',
            'MERCHANDISER',
            'CASH_VAN'
        ]).values().value(), // [2, 9, 1, 8, 3, 4, 11],
        6: _(ACL_CONSTANTS).omit([
            'SUPER_ADMIN',
            'MERCHANDISER',
            'CASH_VAN'
        ]).values().value(), // [2, 9, 1, 8, 3, 4, 5, 11],
        7: _(ACL_CONSTANTS).omit([
            'SUPER_ADMIN',
            'MERCHANDISER',
            'CASH_VAN'
        ]).values().value(), // [2, 9, 1, 8, 3, 4, 5, 11],
        8: [
            ACL_CONSTANTS.MASTER_ADMIN,
            ACL_CONSTANTS.MASTER_UPLOADER,
            ACL_CONSTANTS.VIRTUAL
        ],
        9: [
            ACL_CONSTANTS.MASTER_ADMIN,
            ACL_CONSTANTS.MASTER_UPLOADER,
            ACL_CONSTANTS.VIRTUAL
        ],

        11: _(ACL_CONSTANTS).omit([
            'SUPER_ADMIN',
            'VIRTUAL'
        ]).values().value() // [1, 2, 3, 4, 5, 6, 7, 8, 9]
    };
    var domainToLevel = {
        country  : 1,
        region   : 3,
        subRegion: 4,
        branch   : 5
    };

    var $defProjections = {};
    var models = {};

    var schemas = mongoose.Schemas;
    var schemaModelName;

    for (var key in schemas) {
        schemaModelName = key;

        if (key === CONTENT_TYPES.INSTORETASKS) {
            schemaModelName = CONTENT_TYPES.OBJECTIVES;
        }

        models[key] = db.model(schemaModelName, schemas[schemaModelName]);
    }

    $defProjections[CONTENT_TYPES.OBJECTIVES] = $defProjections[CONTENT_TYPES.INSTORETASKS] = {
        _id       : 1,
        editedBy  : 1,
        createdBy : 1,
        country   : 1,
        region    : 1,
        subRegion : 1,
        branch    : 1,
        title     : 1,
        assignedTo: 1,
        status    : 1,
        level     : 1
    };
    $defProjections[CONTENT_TYPES.PERSONNEL] = {
        _id      : 1,
        editedBy : 1,
        createdBy: 1,
        country  : 1,
        region   : 1,
        subRegion: 1,
        branch   : 1,
        firstName: 1,
        lastName : 1,
        level    : 1
    };
    $defProjections[CONTENT_TYPES.NOTIFICATIONS] = {
        _id      : 1,
        editedBy : 1,
        createdBy: 1,
        country  : 1,
        region   : 1,
        subRegion: 1,
        branch   : 1,
        name     : 1
    };
    $defProjections[CONTENT_TYPES.PLANOGRAM] = {
        _id           : 1,
        editedBy      : 1,
        createdBy     : 1,
        country       : 1,
        retailSegment : 1,
        configuration : 1,
        configurations: 1,
        level         : 1
    };
    $defProjections[CONTENT_TYPES.ITEM] = {
        _id      : 1,
        createdBy: 1,
        editedBy : 1,
        country  : 1,
        name     : 1,
        location : 1,
        level    : 1
    };
    $defProjections[CONTENT_TYPES.COMPETITORITEM] = {
        _id      : 1,
        editedBy : 1,
        createdBy: 1,
        country  : 1,
        name     : 1,
        level    : 1
    };
    $defProjections[CONTENT_TYPES.CONTRACTSYEARLY] = $defProjections[CONTENT_TYPES.CONTRACTSSECONDARY] =
        $defProjections[CONTENT_TYPES.PROMOTIONS] = $defProjections[CONTENT_TYPES.COMPETITORBRANDING] =
            $defProjections[CONTENT_TYPES.COMPETITORPROMOTION] = $defProjections[CONTENT_TYPES.ACHIEVEMENTFORM] =
                $defProjections[CONTENT_TYPES.NEWPRODUCTLAUNCH] = $defProjections[CONTENT_TYPES.PRICESURVEY] =
                    $defProjections[CONTENT_TYPES.SHELF_SHARE] = {
                        _id          : 1,
                        editedBy     : 1,
                        createdBy    : 1,
                        country      : 1,
                        region       : 1,
                        subRegion    : 1,
                        retailSegment: 1,
                        outlet       : 1,
                        branch       : 1,
                        level        : 1
                    };
    $defProjections[CONTENT_TYPES.BRAND] = $defProjections[CONTENT_TYPES.COMPETITORVARIANT] =
        $defProjections[CONTENT_TYPES.VARIANT] = {
            _id      : 1,
            editedBy : 1,
            createdBy: 1,
            name     : 1,
            level    : 1
        };
    $defProjections[CONTENT_TYPES.DOMAIN] = {
        _id      : 1,
        createdBy: 1,
        editedBy : 1,
        region   : 1,
        country  : 1,
        parent   : 1,
        level    : 1,
        type     : 1
    };
    $defProjections[CONTENT_TYPES.OUTLET] = {
        _id           : 1,
        createdBy     : 1,
        editedBy      : 1,
        name          : 1,
        subRegions    : 1,
        retailSegments: 1,
        level         : 1
    };
    $defProjections[CONTENT_TYPES.RETAILSEGMENT] = {
        _id       : 1,
        createdBy : 1,
        editedBy  : 1,
        name      : 1,
        subRegions: 1,
        level     : 1
    };
    $defProjections[CONTENT_TYPES.BRANCH] = {
        _id          : 1,
        createdBy    : 1,
        editedBy     : 1,
        name         : 1,
        subRegion    : 1,
        retailSegment: 1,
        outlet       : 1,
        level        : 1
    };

    function getLocationValue(aggregationResult, locationFields) {
        var result = {};
        var locations = aggregationResult.location;

        if (!Array.isArray(locationFields)) {
            locationFields = [locationFields];
        }

        if (!locations) {
            locationFields.forEach(function (locationField) {
                if (aggregationResult[locationField]) {
                    result[locationField] = aggregationResult[locationField];
                }
            });
        } else {
            if (!Array.isArray(locations)) {
                locations = [locations];
            }

            locations.forEach(function (location) {
                locationFields.forEach(function (locationField) {
                    if (!result[locationField]) {
                        result[locationField] = [];
                    }

                    if (location[locationField]) {
                        result[locationField].push(location[locationField]);
                    }
                });
            });
        }

        return result;
    }

    function getParentDomains(options, waterFallCB) {
        var domainsFields = ['country', 'region', 'subRegion'];
        var firstElement = options.firstElement;
        var currentType = options.contentType;
        var ids = options._ids;
        var $defProjection = $defProjections[CONTENT_TYPES.DOMAIN];
        var aggregateHelper = new AggregationHelper($defProjection);
        var model = models[CONTENT_TYPES.DOMAIN];
        var currentTypeIndex = domainsFields.indexOf(currentType);
        var projectionObject;
        var pipeLine = [];

        pipeLine.push({
            $match: {
                _id: {
                    $in: ids
                }
            }
        });

        for (var i = currentTypeIndex - 1; i >= 0; i--) {
            projectionObject = {};

            projectionObject[domainsFields[i]] = '$parent';

            pipeLine.push({
                $project: aggregateHelper.getProjection(projectionObject)
            });

            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from             : 'domains',
                key              : domainsFields[i],
                isArray          : false,
                addMainProjection: ['parent']
            }));

        }

        pipeLine.push({
            $group: {
                _id    : null,
                region : {$addToSet: '$region'},
                country: {$addToSet: '$country'}
            }
        });

        model.aggregate(pipeLine, function (err, result) {
            if (err) {
                return waterFallCB(err);
            }

            result = result[0];

            if (!result[currentType]) {
                result[currentType] = [];
            }

            if (firstElement && firstElement.type) {
                if (!options[firstElement.type]) {
                    options[firstElement.type] = [];
                }

                options[firstElement.type].push(firstElement._id);
            }

            result[currentType] = result[currentType].concat(ids);

            options.region = result.region;
            options.country = result.country;
            options.domainType = currentType;

            waterFallCB(null, options);
        });
    }

    function getDomainActivityInfo(options, waterFallCB) {
        var itemObjectId = ObjectId(options.itemId);
        var $defProjection = $defProjections[options.itemType];
        var aggregateHelper = new AggregationHelper($defProjection);
        var fieldName = options.actionType === ACTIVITY_TYPES.CREATED ? 'createdBy' : 'editedBy';
        var pipeLine = [];

        var domainsFields = ['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'];
        var includeSiblings = {};
        var waterFallTasks = []
        var locationObject;
        var notDomainProjectObject = {};

        function getCurrentDomainType(waterFallCb) {
            models[CONTENT_TYPES.DOMAIN].aggregate(pipeLine, function (err, result) {
                var error;

                if (err) {
                    return waterFallCb(err);
                }

                if (!result || !result.length) {
                    error = new Error();
                    error.status = 404;
                    error.message = 'Such domain not found';

                    return waterFallCb(err);
                }

                result = result[0];

                result._ids = [result._id];
                result.contentType = result.type;

                waterFallCb(null, result);
            });
        }

        function getNotDomainObject(wfCB) {
            var model = models[options.itemType];

            model.aggregate(pipeLine, function (err, result) {
                if (err) {
                    return wfCB(err);
                }

                result = result[0];

                if (result.subRegion) {
                    if (!Array.isArray(result.subRegion)) {
                        result.subRegion = [result.subRegion];
                    }
                } else {
                    result.subRegion = [];
                }

                result.firstElement = {type: options.itemType, _id: itemObjectId};

                result._ids = result.subRegion;
                result.contentType = 'subRegion';

                wfCB(null, result);
            });
        }

        pipeLine.push({
            $match: {_id: itemObjectId}
        });

        includeSiblings[fieldName] = {
            date: 1
        };

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : fieldName + '.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'accessRole'].concat(domainsFields),
            includeSiblings: includeSiblings
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from             : 'accessRoles',
            key              : fieldName + '.user.accessRole',
            isArray          : false,
            addMainProjection: ['level']
        }));

        if (options.itemType !== CONTENT_TYPES.DOMAIN) {
            if (options.itemType !== CONTENT_TYPES.BRANCH) {
                notDomainProjectObject.subRegion = '$subRegions';

                if (options.itemType === CONTENT_TYPES.OUTLET) {
                    notDomainProjectObject.retailSegment = '$retailSegments';
                }

                pipeLine.push({
                    $project: aggregateHelper.getProjection(notDomainProjectObject)
                });
            }

            waterFallTasks.push(getNotDomainObject);
        } else {
            waterFallTasks.push(getCurrentDomainType);
        }

        waterFallTasks.push(getParentDomains);

        async.waterfall(waterFallTasks, function (err, result) {
            if (err) {
                return waterFallCB(err);
            }

            options.itemDetails = options.itemType === CONTENT_TYPES.DOMAIN ? result.domainType : '';
            options.itemName = result.name;
            options.accessRoleLevel = ACL_CONSTANTS.VIRTUAL; // result.level || 0;

            locationObject = getLocationValue(result, domainsFields);

            options = _.extend(options, locationObject);

            waterFallCB(null);
        });
    }

    function getActivityInfo(options, waterFallCB) {
        var itemObjectId = ObjectId(options.itemId);
        var $defProjection = $defProjections[options.itemType];
        var fieldName = options.actionType === ACTIVITY_TYPES.CREATED ? 'createdBy' : 'editedBy';
        var aggregateHelper = new AggregationHelper($defProjection);
        var aggregation;
        var pipeLine = [
            {
                $match: {_id: itemObjectId}
            }
        ];
        var domainsFields = ['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'];
        var itemName;
        var includeSiblings = {};
        var contentTypesForDetails = [
            CONTENT_TYPES.BRAND,
            CONTENT_TYPES.COMPETITORVARIANT,
            CONTENT_TYPES.VARIANT
        ];

        includeSiblings[fieldName] = {
            date: 1
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : fieldName + '.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'accessRole'].concat(domainsFields),
            includeSiblings: includeSiblings
        }));

        if (options.itemType === CONTENT_TYPES.PLANOGRAM) {
            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from             : 'retailSegments',
                key              : 'retailSegment',
                isArray          : false,
                addMainProjection: ['configurations'],
                addProjection    : ['archived']
            }));

            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    configuration: {
                        $filter: {
                            input: '$configurations',
                            as   : 'configuration',
                            cond : {$eq: ['$$configuration._id', '$configuration']}
                        }
                    }
                })
            });

            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    configuration: {$arrayElemAt: ['$configuration', 0]}
                })
            });

            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    configuration: {
                        _id : 1,
                        name: '$configuration.configuration'
                    }
                })
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from             : 'accessRoles',
            key              : fieldName + '.user.accessRole',
            isArray          : false,
            addMainProjection: ['level']
        }));

        aggregation = models[options.itemType].aggregate(pipeLine);

        aggregation.exec(function (err, result) {
            var error;
            var locationObject;

            if (err) {
                return waterFallCB(err);
            }

            if (result && result.length) {
                result = result[0];
            } else {
                error = new Error();
                error.message = 'Item ' + options.itemType + ' not found';
                return waterFallCB(error);
            }

            /* TODO check correct statuses for all */

            if (result.status && result.status === 'draft') {
                error = new Error();
                error.message = options.itemType + ' is draft';
                return waterFallCB(error);
            }

            options.itemDetails = contentTypesForDetails.indexOf(options.itemType) !== -1 ? options.itemType : '';
            options.accessRoleLevel = result.level || 0;

            locationObject = getLocationValue(result, domainsFields);

            options = _.extend(options, locationObject);

            options.assignedTo = result.assignedTo;

            switch (options.itemType) {
                case CONTENT_TYPES.OBJECTIVES:
                    itemName = result.title;
                    break;
                case CONTENT_TYPES.PERSONNEL:
                    itemName = {
                        en: result.firstName.en + ' ' + result.lastName.en,
                        ar: result.firstName.ar + ' ' + result.lastName.ar
                    };
                    break;
                case CONTENT_TYPES.PLANOGRAM:
                    itemName = {
                        en: result.configuration ? result.configuration.name : '',
                        ar: result.configuration ? result.configuration.name : ''
                    };
                    break;
                default:
                    itemName = result.name;
            }

            options.itemName = itemName;

            waterFallCB(null);

        });
    }

    function getPipeline(options) {
        var aggregateHelper = options.aggregateHelper;
        var activityListId = options.activityId;
        var pipeLine = [];

        pipeLine.push({
            $match: {_id: ObjectId(activityListId)}
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
            includeSiblings: {createdBy: {date: 1}}
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
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
                        lastName : 1
                    }
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
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
                        lastName  : 1
                    }
                }
            }
        }));

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                createdBy: {
                    user    : 1,
                    date    : 1,
                    diffDate: {
                        $let: {
                            vars: {
                                dateNow   : new Date(),
                                createDate: '$createdBy.date'
                            },

                            in: {$subtract: ['$$dateNow', '$$createDate']}
                        }
                    }
                }
            })
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'modules',
            key    : 'module',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'country'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'region'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'subRegion'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'branches',
            key : 'branch'
        }));

        return pipeLine;
    }

    function getResultSendObject(activity, cb) {
        var aggregation;
        var $defProjection = {
            _id        : 1,
            module     : 1,
            actionType : 1,
            itemType   : 1,
            itemDetails: 1,
            createdBy  : 1,
            country    : 1,
            region     : 1,
            subRegion  : 1,
            branch     : 1,
            itemId     : 1,
            itemName   : 1
        };
        var aggregateHelper = new AggregationHelper($defProjection);
        var pipeLine = getPipeline({
            activityId     : activity._id,
            aggregateHelper: aggregateHelper
        });
        aggregation = ActivityModel.aggregate(pipeLine);

        aggregation.exec(function (err, response) {
            var error;

            if (err) {
                return cb(err);
            }
            if (!response[0]) {
                error = new Error();
                error.message = 'activity not found';
                return cb(error);
            }
            cb(null, activity, response[0]);
        });

    }

    function getSocketsByUserId(userId, callback) {

        redis.redisClient.keys('socket_Uid:' + userId + ':*', function (err, value) {
            if (err) {
                return callback(err, null);
            }
            callback(null, value);

        });
    }

    function getUserLocationsAndLevel(userId, cb) {

        var aggregation = PersonnelModel.aggregate([
            {
                $match: {_id: ObjectId(userId)}
            },
            {
                $project: {
                    country   : 1,
                    region    : 1,
                    subRegion : 1,
                    branch    : 1,
                    accessRole: 1,
                    firstName : 1,
                    lastName  : 1
                }
            }, {
                $lookup: {
                    from        : 'accessRoles',
                    localField  : 'accessRole',
                    foreignField: '_id',
                    as          : 'accessRole'
                }
            },
            {
                $project: {

                    country  : 1,
                    region   : 1,
                    subRegion: 1,
                    branch   : 1,

                    itemName: {
                        en: {$concat: ['$firstName.en', ' ', '$lastName.en']},
                        ar: {$concat: ['$firstName.ar', ' ', '$lastName.ar']}
                    },

                    accessRoleLevel: {$arrayElemAt: ['$accessRole.level', 0]}
                }
            }]);

        aggregation.exec(function (err, result) {
            var error;

            if (err) {
                return cb(err);
            }

            if (!result[0]) {
                error = new Error();
                error.message = 'user not found';
                return cb(error);
            }
            cb(null, result[0]);

        });

    }

    function getCoverEmployee(id, cb) {
        PersonnelModel
            .findById(ObjectId(id), {vacation: 1})
            .lean()
            .exec(function (err, model) {
                var error;

                if (err) {
                    return cb(err);
                }

                if (!model) {
                    error = new Error('Personnel not found');
                    error.status = 400;

                    return cb(error);
                }

                if (model.vacation && model.vacation.cover) {
                    return cb(null, model.vacation.cover);
                }

                return cb(null, null);
            });

    }

    function getUsersByLocationAndLevel(activityObject, cb) {
        var regionsMathArray = {};
        var aggregation;
        var pipeLine = [];
        var orArray = [];
        var coverParallelTasks = [];
        var waterFallTasks = [];

        var levelQuery = {accessRoleLevel: {$in: levelsByLevel[activityObject.accessRoleLevel]}};

        if (levelsByLevel[7].indexOf(activityObject.accessRoleLevel) > -1) {
            regionsMathArray = {branch: {$in: activityObject.branch}};
        }
        if (levelsByLevel[6].indexOf(activityObject.accessRoleLevel) > -1) {
            regionsMathArray = {subRegion: {$in: activityObject.subRegion}};
        }
        if (levelsByLevel[5].indexOf(activityObject.accessRoleLevel) > -1) {
            regionsMathArray = {region: {$in: activityObject.region}};
        }
        if (levelsByLevel[4].indexOf(activityObject.accessRoleLevel) > -1) {
            regionsMathArray = {country: {$in: activityObject.country}};
        }

        pipeLine.push({
            $match: {_id: {$ne: ObjectId(activityObject.createdBy.user)}}
        });
        pipeLine.push({
            $project: {
                country   : 1,
                region    : 1,
                subRegion : 1,
                branch    : 1,
                accessRole: 1
            }
        });
        pipeLine.push({
            $lookup: {
                from        : 'accessRoles',
                localField  : 'accessRole',
                foreignField: '_id',
                as          : 'accessRole'
            }
        });

        pipeLine.push({
            $project: {
                country        : 1,
                region         : 1,
                subRegion      : 1,
                branch         : 1,
                accessRoleLevel: {$arrayElemAt: ['$accessRole.level', 0]}
            }
        });

        if (activityObject.itemType === CONTENT_TYPES.PERSONNEL || activityObject.itemType === CONTENT_TYPES.PLANOGRAM) {
            levelQuery = {};
            regionsMathArray = {country: {$in: activityObject.country}};
        }

        if (activityObject.itemType === CONTENT_TYPES.NOTIFICATIONS) {
            levelQuery = {};
        }

        orArray.push({
            accessRoleLevel: {
                $in: levelsByLevel[1]
            }
        });

        function firstPartWaterFall(waterFallCb) {
            for (var i = 0; i < activityObject.assignedTo.length; i++) {
                coverParallelTasks.push(
                    async.apply(getCoverEmployee, activityObject.assignedTo[i])
                );
            }

            async.parallel(coverParallelTasks, function (err, results) {
                if (err) {
                    return waterFallCb(err);
                }
                if (results && results.length) {
                    results = _.compact(results);
                    activityObject.assignedTo = activityObject.assignedTo.concat(results);
                }

                waterFallCb(null, {
                    _id: {
                        $in: activityObject.assignedTo
                    }
                });
            });
        }

        function secondPartWaterFall(orPart, waterFallCb) {
            if (orPart) {
                if (typeof orPart !== 'function') {
                    orArray.push(orPart);
                } else {
                    waterFallCb = orPart;
                }
            }

            orArray.push({
                $and: [
                    levelQuery,
                    regionsMathArray
                ]
            });

            pipeLine.push({
                $match: {
                    $or: orArray
                }
            });

            pipeLine.push({
                $group: {
                    _id: null,
                    ids: {$push: '$_id'}
                }
            });

            aggregation = PersonnelModel.aggregate(pipeLine);

            aggregation.exec(function (err, result) {
                var error;

                if (err) {
                    return waterFallCb(err);
                }

                if (!result[0]) {
                    error = new Error();
                    error.message = 'users not found';

                    return waterFallCb(error);
                }

                if (activityObject.itemType === CONTENT_TYPES.PERSONNEL || activityObject.itemType === CONTENT_TYPES.PLANOGRAM) {
                    result[0].ids.push(activityObject.itemId);
                }

                waterFallCb(null, result[0].ids);
            });
        }

        if (activityObject.assignedTo && activityObject.assignedTo.length) {
            waterFallTasks.push(firstPartWaterFall);
        }

        waterFallTasks.push(secondPartWaterFall);

        async.waterfall(waterFallTasks, function (err, result) {
            if (err) {
                return cb(err);
            }

            cb(null, result);
        });
    }

    function addAction(userId, cb) {
        var actionKey = actionKeyTemplate({userId: userId});

        redis.cacheStore.incrementAndGet(actionKey, function (err, number) {
            if (err) {
                return cb(err);
            }
            if (!number) {
                number = 0;
            }

            cb(null, number);
        });
    }

    this.addObject = function (options, cb) {
        var waterfallFunctionsArray;
        var typeFilter;

        function saveObject(wCb) {
            var activityModel = new ActivityModel(options);

            activityModel.save(function (err, activity) {
                if (err) {
                    return wCb(err);
                }

                wCb(null, activity);
            });
        }

        /*function getUserLocationsAndLevelW(wCb) {
         getUserLocationsAndLevel(options.itemId, function (err, user) {
         if (err) {
         return wCb(err);
         }

         options.country = user.country;
         options.region = user.region;
         options.subRegion = user.subRegion;
         options.branch = user.branch;
         options.accessRoleLevel = user.accessRoleLevel;
         options.itemName = user.itemName;

         wCb(null);
         });
         }

         function getDomainLocationsRecursive(domainId, domainObject, callback) {
         var aggregation;

         if (!domainObject) {
         domainObject = {
         country  : [],
         region   : [],
         subRegion: [],
         branch   : []
         };
         }

         aggregation = DomainModel.aggregate([
         {
         $match: {_id: domainId}
         }
         ]);

         aggregation.exec(function (err, result) {
         var error;

         if (err) {
         return callback(err);
         }

         if (!result[0]) {
         error = new Error();
         error.message = 'domain not found';
         return callback(error);
         }

         if (!options.itemName) {
         options.itemName = result[0].name;
         }

         domainObject[result[0].type].push(result[0]._id);

         if (!options.itemDetails) {
         options.itemDetails = result[0].type;
         }

         if (!options.accessRoleLevel) {
         options.accessRoleLevel = domainToLevel[options.itemDetails];
         }
         if (result[0].parent) {
         return getDomainLocationsRecursive(result[0].parent, domainObject, callback);
         }

         callback(null, domainObject);
         });
         }

         function getObjectivesLocationsLevelAndAssignedTo(callback) {
         var projectObject = {};
         var ObjectivesId = ObjectId(options.itemId);
         var $defProjection = {
         _id       : 1,
         editedBy  : 1,
         createdBy : 1,
         country   : 1,
         region    : 1,
         subRegion : 1,
         branch    : 1,
         title     : 1,
         assignedTo: 1,
         status    : 1
         };
         var fieldName = options.actionType === ACTIVITY_TYPES.CREATED ? 'createdBy' : 'editedBy';
         var aggregateHelper = new AggregationHelper($defProjection);
         var pipeLine = [
         {
         $match: {_id: ObjectivesId}
         }
         ];
         var aggregation;

         pipeLine.push({
         $lookup: {
         from        : 'personnels',
         localField  : fieldName + '.user',
         foreignField: '_id',
         as          : fieldName + '.user'
         }
         });

         projectObject[fieldName] = {
         user: {$arrayElemAt: ['$' + fieldName + '.user', 0]},
         date: 1
         };

         pipeLine.push({
         $project: aggregateHelper.getProjection(projectObject)
         });

         pipeLine.push({
         $lookup: {
         from        : 'accessRoles',
         localField  : fieldName + '.user.accessRole',
         foreignField: '_id',
         as          : 'accessRole'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         accessRole: {$arrayElemAt: ['$accessRole.level', 0]}
         })
         });

         aggregation = ObjectivesModel.aggregate(pipeLine);

         aggregation.exec(function (err, result) {
         var error;

         if (err) {
         return callback(err);
         }

         if (!result[0]) {
         error = new Error();
         error.message = 'objectives not found';
         return callback(error);
         }

         if (result[0].status === 'draft') {
         error = new Error();
         error.message = 'objectives is draft';
         return callback(error);
         }

         result = result[0];

         options.itemDetails = '';
         options.accessRoleLevel = result.accessRole;
         options.country = result.country ? result.country : [];
         options.region = result.region ? result.region : [];
         options.subRegion = result.subRegion ? result.subRegion : [];
         options.retailSegment = result.retailSegment ? result.retailSegment : [];
         options.outlet = result.outlet ? result.outlet : [];
         options.branch = result.branch ? result.branch : [];
         options.assignedTo = result.assignedTo;
         options.itemName = result.title;

         callback(null);

         });

         }

         function getRetailSegmentLocationsLevelAndAssignedTo(callback) {
         var outletId = ObjectId(options.itemId);

         var $defProjection = {
         _id       : 1,
         editedBy  : 1,
         name      : 1,
         subRegions: 1,
         region    : 1
         };
         var aggregateHelper = new AggregationHelper($defProjection);
         var aggregation;
         var pipeLine = [
         {
         $match: {_id: outletId}
         }
         ];

         pipeLine.push({
         $lookup: {
         from        : 'personnels',
         localField  : 'editedBy.user',
         foreignField: '_id',
         as          : 'editedBy.user'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         editedBy: {
         user: {$arrayElemAt: ['$editedBy.user', 0]},
         date: 1
         }
         })
         });

         pipeLine.push(
         {
         $lookup: {
         from        : 'accessRoles',
         localField  : 'editedBy.user.accessRole',
         foreignField: '_id',
         as          : 'accessRole'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         accessRole: {$arrayElemAt: ['$accessRole.level', 0]}
         })
         });

         pipeLine.push(
         {
         $unwind: {
         path                      : '$subRegions',
         preserveNullAndEmptyArrays: true
         }
         });
         pipeLine.push(
         {
         $lookup: {
         from        : 'domains',
         localField  : 'subRegions',
         foreignField: '_id',
         as          : 'subRegions'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         subRegions: {$arrayElemAt: ['$subRegions', 0]}
         })
         });

         pipeLine.push(
         {
         $project: {
         _id       : 1,
         editedBy  : 1,
         name      : 1,
         region    : '$subRegions.parent',
         subRegions: '$subRegions._id'

         }
         });
         pipeLine.push(
         {
         $lookup: {
         from        : 'domains',
         localField  : 'region',
         foreignField: '_id',
         as          : 'region'
         }
         });
         pipeLine.push({
         $project: aggregateHelper.getProjection({
         region: {$arrayElemAt: ['$region', 0]}
         })
         });

         pipeLine.push({
         $project: {
         _id       : 1,
         editedBy  : 1,
         name      : 1,
         subRegions: 1,
         country   : '$region.parent',
         region    : '$region._id'

         }
         });
         pipeLine.push(
         {
         $group: {

         _id: {
         _id           : '$_id',
         name          : '$name',
         editedBy      : '$editedBy',
         retailSegments: '$retailSegments'
         },

         subRegions: {$push: '$subRegions'},
         country   : {$push: '$country'},
         region    : {$push: '$region'}
         }
         });

         pipeLine.push({
         $project: {
         _id       : '$_id._id',
         editedBy  : '$_id.editedBy',
         name      : '$_id.name',
         region    : 1,
         subRegions: 1,
         country   : 1
         }
         });
         pipeLine.push({
         $lookup: {
         from        : 'branches',
         localField  : '_id',
         foreignField: 'retailSegment',
         as          : 'branches'
         }
         });
         pipeLine.push({
         $project: {
         _id       : 1,
         editedBy  : 1,
         name      : 1,
         region    : 1,
         subRegions: 1,
         country   : 1,
         branches  : '$branches._id'
         }
         });

         aggregation = RetailSegmentModel.aggregate(pipeLine);

         aggregation.exec(function (err, result) {
         var error;

         if (err) {
         return callback(err);
         }

         if (!result[0]) {
         error = new Error();
         error.message = 'retailSegment not found';
         return callback(error);
         }
         options.country = result[0].country;
         options.region = result[0].region;
         options.subRegion = result[0].subRegions;
         options.branch = result[0].branches;
         options.itemDetails = '';
         options.itemName = result[0].name;
         options.accessRoleLevel = 11;
         options.retailSegment = result[0]._id;
         callback(null);
         });

         }

         function getOutletLocationsLevelAndAssignedTo(callback) {
         var outletId = ObjectId(options.itemId);

         var $defProjection = {
         _id           : 1,
         editedBy      : 1,
         name          : 1,
         subRegions    : 1,
         region        : 1,
         retailSegments: 1
         };
         var aggregateHelper = new AggregationHelper($defProjection);
         var aggregation;
         var pipeLine = [
         {
         $match: {_id: outletId}
         }
         ];

         pipeLine.push({
         $lookup: {
         from        : 'personnels',
         localField  : 'editedBy.user',
         foreignField: '_id',
         as          : 'editedBy.user'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         editedBy: {
         user: {$arrayElemAt: ['$editedBy.user', 0]},
         date: 1
         }
         })
         });

         pipeLine.push(
         {
         $lookup: {
         from        : 'accessRoles',
         localField  : 'editedBy.user.accessRole',
         foreignField: '_id',
         as          : 'accessRole'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         accessRole: {$arrayElemAt: ['$accessRole.level', 0]}
         })
         });

         pipeLine.push(
         {
         $unwind: {
         path                      : '$subRegions',
         preserveNullAndEmptyArrays: true
         }
         });
         pipeLine.push(
         {
         $lookup: {
         from        : 'domains',
         localField  : 'subRegions',
         foreignField: '_id',
         as          : 'subRegions'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         subRegions: {$arrayElemAt: ['$subRegions', 0]}
         })
         });

         pipeLine.push(
         {
         $project: {
         _id           : 1,
         editedBy      : 1,
         name          : 1,
         retailSegments: 1,
         region        : '$subRegions.parent',
         subRegions    : '$subRegions._id'

         }
         });
         pipeLine.push(
         {
         $lookup: {
         from        : 'domains',
         localField  : 'region',
         foreignField: '_id',
         as          : 'region'
         }
         });
         pipeLine.push({
         $project: aggregateHelper.getProjection({
         region: {$arrayElemAt: ['$region', 0]}
         })
         });

         pipeLine.push({
         $project: {
         _id           : 1,
         editedBy      : 1,
         name          : 1,
         retailSegments: 1,
         subRegions    : 1,
         country       : '$region.parent',
         region        : '$region._id'

         }
         });
         pipeLine.push(
         {
         $group: {

         _id: {
         _id           : '$_id',
         name          : '$name',
         editedBy      : '$editedBy',
         retailSegments: '$retailSegments'
         },

         subRegions: {$push: '$subRegions'},
         country   : {$push: '$country'},
         region    : {$push: '$region'}
         }
         });

         pipeLine.push({
         $project: {
         _id           : '$_id._id',
         editedBy      : '$_id.editedBy',
         name          : '$_id.name',
         retailSegments: '$_id.retailSegments',
         region        : 1,
         subRegions    : 1,
         country       : 1
         }
         });
         pipeLine.push({
         $lookup: {
         from        : 'branches',
         localField  : '_id',
         foreignField: 'outlet',
         as          : 'branches'
         }
         });
         pipeLine.push({
         $project: {
         _id           : 1,
         editedBy      : 1,
         name          : 1,
         retailSegments: 1,
         region        : 1,
         subRegions    : 1,
         country       : 1,
         branches      : '$branches._id'
         }
         });

         aggregation = OutletModel.aggregate(pipeLine);

         aggregation.exec(function (err, result) {
         var error;

         if (err) {
         return callback(err);
         }

         if (!result[0]) {
         error = new Error();
         error.message = 'outlet not found';
         return callback(error);
         }
         options.country = result[0].country;
         options.region = result[0].region;
         options.subRegion = result[0].subRegions;
         options.branch = result[0].branches;
         options.itemDetails = '';
         options.itemName = result[0].name;
         options.accessRoleLevel = 11;
         options.outlet = result[0]._id;
         options.retailSegment = result[0].retailSegments;
         callback(null);
         });

         }

         function getItemVariantLocationsLevelAndAssignedTo(callback) {
         var variantId = ObjectId(options.itemId);
         var $defProjection = {
         _id     : 1,
         editedBy: 1,
         name    : 1
         };
         var aggregateHelper = new AggregationHelper($defProjection);
         var aggregation;
         var pipeLine = [
         {
         $match: {_id: variantId}
         }
         ];

         pipeLine.push({
         $lookup: {
         from        : 'personnels',
         localField  : 'editedBy.user',
         foreignField: '_id',
         as          : 'editedBy.user'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         editedBy: {
         user: {$arrayElemAt: ['$editedBy.user', 0]},
         date: 1
         }
         })
         });

         pipeLine.push(
         {
         $lookup: {
         from        : 'accessRoles',
         localField  : 'editedBy.user.accessRole',
         foreignField: '_id',
         as          : 'accessRole'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         accessRole: {$arrayElemAt: ['$accessRole.level', 0]}
         })
         });
         aggregation = VariantModel.aggregate(pipeLine);

         aggregation.exec(function (err, result) {
         var error;

         if (err) {
         return callback(err);
         }

         if (!result[0]) {
         error = new Error();
         error.message = 'variant not found';
         return callback(error);
         }
         options.country = [];
         options.region = [];
         options.subRegion = [];
         options.branch = [];
         options.itemName = result[0].name;
         options.itemDetails = 'competitorVariant';
         options.accessRoleLevel = result[0].accessRole;
         callback(null);

         });

         }

         function getCompetitorVariantLocationsLevelAndAssignedTo(callback) {
         var CompetitorVariantId = ObjectId(options.itemId);
         var $defProjection = {
         _id     : 1,
         editedBy: 1,
         name    : 1
         };
         var aggregateHelper = new AggregationHelper($defProjection);
         var aggregation;
         var pipeLine = [
         {
         $match: {_id: CompetitorVariantId}
         }
         ];

         pipeLine.push({
         $lookup: {
         from        : 'personnels',
         localField  : 'editedBy.user',
         foreignField: '_id',
         as          : 'editedBy.user'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         editedBy: {
         user: {$arrayElemAt: ['$editedBy.user', 0]},
         date: 1
         }
         })
         });

         pipeLine.push(
         {
         $lookup: {
         from        : 'accessRoles',
         localField  : 'editedBy.user.accessRole',
         foreignField: '_id',
         as          : 'accessRole'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         accessRole: {$arrayElemAt: ['$accessRole.level', 0]}
         })
         });
         aggregation = CompetitorVariantModel.aggregate(pipeLine);

         aggregation.exec(function (err, result) {
         var error;

         if (err) {
         return callback(err);
         }

         if (!result[0]) {
         error = new Error();
         error.message = 'variant not found';
         return callback(error);
         }
         options.country = [];
         options.region = [];
         options.subRegion = [];
         options.branch = [];
         options.itemName = result[0].name;
         options.itemDetails = 'competitorVariant';
         options.accessRoleLevel = result[0].accessRole;
         callback(null);

         });

         }

         function getBrandLocationsLevelAndAssignedTo(callback) {
         var BrandId = ObjectId(options.itemId);
         var $defProjection = {
         _id     : 1,
         editedBy: 1,
         name    : 1
         };
         var aggregateHelper = new AggregationHelper($defProjection);
         var aggregation;
         var pipeLine = [
         {
         $match: {_id: BrandId}
         }
         ];

         pipeLine.push({
         $lookup: {
         from        : 'personnels',
         localField  : 'editedBy.user',
         foreignField: '_id',
         as          : 'editedBy.user'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         editedBy: {
         user: {$arrayElemAt: ['$editedBy.user', 0]},
         date: 1
         }
         })
         });

         pipeLine.push(
         {
         $lookup: {
         from        : 'accessRoles',
         localField  : 'editedBy.user.accessRole',
         foreignField: '_id',
         as          : 'accessRole'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         accessRole: {$arrayElemAt: ['$accessRole.level', 0]}
         })
         });
         aggregation = BrandModel.aggregate(pipeLine);

         aggregation.exec(function (err, result) {
         var error;

         if (err) {
         return callback(err);
         }

         if (!result[0]) {
         error = new Error();
         error.message = 'brand not found';
         return callback(error);
         }
         options.country = [];
         options.region = [];
         options.subRegion = [];
         options.branch = [];
         options.itemName = result[0].name;
         options.itemDetails = 'brand';
         options.accessRoleLevel = result[0].accessRole;
         callback(null);

         });

         }

         function getCompetitorListLocationsLevelAndAssignedTo(callback) {
         var CompetitorItemId = ObjectId(options.itemId);
         var $defProjection = {
         _id     : 1,
         editedBy: 1,
         country : 1,
         name    : 1
         };
         var aggregateHelper = new AggregationHelper($defProjection);
         var aggregation;
         var pipeLine = [
         {
         $match: {_id: CompetitorItemId}
         }
         ];

         pipeLine.push({
         $lookup: {
         from        : 'personnels',
         localField  : 'editedBy.user',
         foreignField: '_id',
         as          : 'editedBy.user'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         editedBy: {
         user: {$arrayElemAt: ['$editedBy.user', 0]},
         date: 1
         }
         })
         });

         pipeLine.push({
         $lookup: {
         from        : 'accessRoles',
         localField  : 'editedBy.user.accessRole',
         foreignField: '_id',
         as          : 'accessRole'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         accessRole: {$arrayElemAt: ['$accessRole.level', 0]}
         })
         });

         aggregation = CompetitorListModel.aggregate(pipeLine);

         aggregation.exec(function (err, result) {
         var error;

         if (err) {
         return callback(err);
         }

         if (!result[0]) {
         error = new Error();
         error.message = 'competitorItem not found';
         return callback(error);
         }
         options.country = [];
         if (result[0].country && result[0].country.length) {
         options.country = [result[0].country];
         }
         options.region = [];
         options.subRegion = [];
         options.branch = [];
         options.itemName = result[0].name;
         options.accessRoleLevel = result[0].accessRole;
         callback(null);

         });
         }

         function getPlanogramLocationsAndLevel(callback) {
         var projectObject = {};
         var fieldName = options.actionType === ACTIVITY_TYPES.CREATED ? 'createdBy' : 'editedBy';
         var PlanogramId = ObjectId(options.itemId);
         var $defProjection = {
         _id            : 1,
         editedBy       : 1,
         createdBy      : 1,
         country        : 1,
         retailSegment  : 1,
         configuration  : 1,
         configurations : 1,
         accessRoleLevel: 1
         };

         var aggregateHelper = new AggregationHelper($defProjection);
         var aggregation;
         var pipeLine = [
         {
         $match: {_id: PlanogramId}
         }
         ];

         pipeLine.push({
         $lookup: {
         from        : 'personnels',
         localField  : fieldName + '.user',
         foreignField: '_id',
         as          : fieldName + '.user'
         }
         });

         projectObject[fieldName] = {
         user: {$arrayElemAt: ['$' + fieldName + '.user', 0]},
         date: 1
         };

         pipeLine.push({
         $project: aggregateHelper.getProjection(projectObject)
         });

         pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
         from             : 'retailSegments',
         key              : 'retailSegment',
         isArray          : false,
         addMainProjection: ['configurations'],
         addProjection    : ['archived']
         }));

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         configuration: {
         $filter: {
         input: '$configurations',
         as   : 'configuration',
         cond : {$eq: ['$$configuration._id', '$configuration']}
         }
         }
         })
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         configuration: {$arrayElemAt: ['$configuration', 0]}
         })
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         configuration: {
         _id : 1,
         name: '$configuration.configuration'
         }
         })
         });

         pipeLine.push(
         {
         $lookup: {
         from        : 'accessRoles',
         localField  : fieldName + '.user.accessRole',
         foreignField: '_id',
         as          : 'accessRole'
         }
         }
         );

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         accessRole: {$arrayElemAt: ['$accessRole.level', 0]}
         })
         });

         aggregation = PlanogramModel.aggregate(pipeLine);

         aggregation.exec(function (err, result) {
         var error;

         if (err) {
         return callback(err);
         }

         if (!result[0]) {
         error = new Error();
         error.message = 'planogram not found';
         return callback(error);
         }
         options.country = [];
         if (result[0].country) {
         options.country = [result[0].country];
         }
         options.region = [];
         options.subRegion = [];
         options.branch = [];
         options.itemName = {
         en: result[0].configuration ? result[0].configuration.name : '',
         ar: result[0].configuration ? result[0].configuration.name : ''
         };
         options.accessRoleLevel = result[0].accessRole;
         callback(null);

         });

         }

         function getItemLocationsAndLevel(callback) {
         var itemId = ObjectId(options.itemId);
         var $defProjection = {
         _id     : 1,
         editedBy: 1,
         country : 1,
         name    : 1,
         location: 1
         };
         var aggregateHelper = new AggregationHelper($defProjection);
         var aggregation;
         var pipeLine = [
         {
         $match: {_id: itemId}
         }
         ];

         pipeLine.push({
         $lookup: {
         from        : 'personnels',
         localField  : 'editedBy.user',
         foreignField: '_id',
         as          : 'editedBy.user'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         editedBy: {
         user: {$arrayElemAt: ['$editedBy.user', 0]},
         date: 1
         }
         })
         });

         pipeLine.push(
         {
         $lookup: {
         from        : 'accessRoles',
         localField  : 'editedBy.user.accessRole',
         foreignField: '_id',
         as          : 'accessRole'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         accessRole: {$arrayElemAt: ['$accessRole.level', 0]}
         })
         });
         aggregation = ItemModel.aggregate(pipeLine);

         aggregation.exec(function (err, result) {
         var error;

         if (err) {
         return callback(err);
         }

         if (!result[0]) {
         error = new Error();
         error.message = 'item not found';
         return callback(error);
         }
         options.country = [];
         options.region = [];
         options.subRegion = [];
         options.branch = [];
         result[0].location.forEach(function (location) {
         options.country.push(location.country);
         options.retailSegment.push(location.retailSegment);
         options.outlet.push(location.outlet);
         });
         options.region = [];
         options.subRegion = [];
         options.branch = [];
         options.itemName = result[0].name;
         options.accessRoleLevel = result[0].accessRole;
         callback(null);
         });
         }

         function getBranchLocations(callback) {
         var branchId = ObjectId(options.itemId);
         var aggregation = BranchModel.aggregate([
         {
         $match: {_id: branchId}
         }
         ]);

         aggregation.exec(function (err, result) {
         var error;

         if (err) {
         return callback(err);
         }

         if (!result[0]) {
         error = new Error();
         error.message = 'branch not found';
         return callback(error);
         }

         if (!options.itemDetails) {
         options.itemDetails = 'branch';
         options.accessRoleLevel = 5;
         }

         getDomainLocationsRecursive(result[0].subRegion, null, function (err, branchObject) {
         if (err) {
         return callback(err);
         }

         branchObject.branch.push(branchId);
         options.country = branchObject.country;
         options.region = branchObject.region;
         options.subRegion = branchObject.subRegion;
         options.branch = branchObject.branch;

         callback(null);
         });
         });
         }

         function getPriceSurveyLocationsAndLevel(callback) {
         var projectObject = {};
         var priceSurveyId = ObjectId(options.itemId);
         var fieldName = options.actionType === ACTIVITY_TYPES.CREATED ? 'createdBy' : 'editedBy';
         var $defProjection = {
         _id            : 1,
         editedBy       : 1,
         createdBy      : 1,
         country        : 1,
         region         : 1,
         subRegion      : 1,
         retailSegment  : 1,
         outlet         : 1,
         branch         : 1,
         accessRoleLevel: 1

         };
         var aggregateHelper = new AggregationHelper($defProjection);
         var aggregation;
         var pipeLine = [
         {
         $match: {_id: priceSurveyId}
         }
         ];

         pipeLine.push({
         $lookup: {
         from        : 'personnels',
         localField  : fieldName + '.user',
         foreignField: '_id',
         as          : fieldName + '.user'
         }
         });

         projectObject[fieldName] = {
         user: {$arrayElemAt: ['$' + fieldName + '.user', 0]},
         date: 1
         };

         pipeLine.push({
         $project: aggregateHelper.getProjection(projectObject)
         });

         pipeLine.push({
         $lookup: {
         from        : 'accessRoles',
         localField  : fieldName + '.user.accessRole',
         foreignField: '_id',
         as          : 'accessRole'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         accessRole: {$arrayElemAt: ['$accessRole.level', 0]}
         })
         });

         aggregation = PriceSurveyModel.aggregate(pipeLine);

         aggregation.exec(function (err, result) {
         var error;

         if (err) {
         return callback(err);
         }

         if (!result[0]) {
         error = new Error();
         error.message = 'price survey not found';
         return callback(error);
         }

         result = result[0];

         options.itemDetails = '';
         options.accessRoleLevel = result.accessRole;
         options.country = result.country;
         options.region = result.region;
         options.subRegion = result.subRegion;
         options.retailSegment = result.retailSegment;
         options.outlet = result.outlet;
         options.branch = result.branch;

         callback(null);
         });
         }

         function getCompetitorBrandingLocationsAndLevel(callback) {
         var projectObject = {};
         var competitorBrandingId = ObjectId(options.itemId);
         var fieldName = options.actionType === ACTIVITY_TYPES.CREATED ? 'createdBy' : 'editedBy';
         var $defProjection = {
         _id            : 1,
         editedBy       : 1,
         createdBy      : 1,
         country        : 1,
         region         : 1,
         subRegion      : 1,
         retailSegment  : 1,
         outlet         : 1,
         branch         : 1,
         accessRoleLevel: 1

         };
         var aggregateHelper = new AggregationHelper($defProjection);
         var aggregation;
         var pipeLine = [
         {
         $match: {_id: competitorBrandingId}
         }
         ];

         pipeLine.push({
         $lookup: {
         from        : 'personnels',
         localField  : fieldName + '.user',
         foreignField: '_id',
         as          : fieldName + '.user'
         }
         });

         projectObject[fieldName] = {
         user: {$arrayElemAt: ['$' + fieldName + '.user', 0]},
         date: 1
         };

         pipeLine.push({
         $project: aggregateHelper.getProjection(projectObject)
         });

         pipeLine.push({
         $lookup: {
         from        : 'accessRoles',
         localField  : fieldName + '.user.accessRole',
         foreignField: '_id',
         as          : 'accessRole'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         accessRole: {$arrayElemAt: ['$accessRole.level', 0]}
         })
         });

         aggregation = CompetitorBrandingModel.aggregate(pipeLine);

         aggregation.exec(function (err, result) {
         var error;

         if (err) {
         return callback(err);
         }

         if (!result[0]) {
         error = new Error();
         error.message = 'competitor branding not found';
         return callback(error);
         }

         result = result[0];

         options.itemDetails = '';
         options.accessRoleLevel = result.accessRole;
         options.country = result.country;
         options.region = result.region;
         options.subRegion = result.subRegion;
         options.retailSegment = result.retailSegment;
         options.outlet = result.outlet;
         options.branch = result.branch;

         callback(null);
         });
         }

         function getCompetitorPromotionLocationsAndLevel(callback) {
         var projectObject = {};
         var competitorPromotionId = ObjectId(options.itemId);
         var fieldName = options.actionType === ACTIVITY_TYPES.CREATED ? 'createdBy' : 'editedBy';
         var $defProjection = {
         _id            : 1,
         editedBy       : 1,
         createdBy      : 1,
         country        : 1,
         region         : 1,
         subRegion      : 1,
         retailSegment  : 1,
         outlet         : 1,
         branch         : 1,
         accessRoleLevel: 1

         };
         var aggregateHelper = new AggregationHelper($defProjection);
         var aggregation;
         var pipeLine = [
         {
         $match: {_id: competitorPromotionId}
         }
         ];

         pipeLine.push({
         $lookup: {
         from        : 'personnels',
         localField  : fieldName + '.user',
         foreignField: '_id',
         as          : fieldName + '.user'
         }
         });

         projectObject[fieldName] = {
         user: {$arrayElemAt: ['$' + fieldName + '.user', 0]},
         date: 1
         };

         pipeLine.push({
         $project: aggregateHelper.getProjection(projectObject)
         });

         pipeLine.push({
         $lookup: {
         from        : 'accessRoles',
         localField  : fieldName + '.user.accessRole',
         foreignField: '_id',
         as          : 'accessRole'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         accessRole: {$arrayElemAt: ['$accessRole.level', 0]}
         })
         });

         aggregation = CompetitorPromotionModel.aggregate(pipeLine);

         aggregation.exec(function (err, result) {
         var error;

         if (err) {
         return callback(err);
         }

         if (!result[0]) {
         error = new Error();
         error.message = 'competitor promotion not found';
         return callback(error);
         }

         result = result[0];

         options.itemDetails = '';
         options.accessRoleLevel = result.accessRole;
         options.country = result.country;
         options.region = result.region;
         options.subRegion = result.subRegion;
         options.retailSegment = result.retailSegment;
         options.outlet = result.outlet;
         options.branch = result.branch;

         callback(null);
         });
         }

         function getPromotionLocationsAndLevel(callback) {
         var projectObject = {};
         var promotionId = ObjectId(options.itemId);
         var fieldName = options.actionType === ACTIVITY_TYPES.CREATED ? 'createdBy' : 'editedBy';
         var $defProjection = {
         _id            : 1,
         editedBy       : 1,
         createdBy      : 1,
         country        : 1,
         region         : 1,
         subRegion      : 1,
         retailSegment  : 1,
         outlet         : 1,
         branch         : 1,
         accessRoleLevel: 1

         };
         var aggregateHelper = new AggregationHelper($defProjection);
         var aggregation;
         var pipeLine = [
         {
         $match: {_id: promotionId}
         }
         ];

         pipeLine.push({
         $lookup: {
         from        : 'personnels',
         localField  : fieldName + '.user',
         foreignField: '_id',
         as          : fieldName + '.user'
         }
         });

         projectObject[fieldName] = {
         user: {$arrayElemAt: ['$' + fieldName + '.user', 0]},
         date: 1
         };

         pipeLine.push({
         $project: aggregateHelper.getProjection(projectObject)
         });

         pipeLine.push({
         $lookup: {
         from        : 'accessRoles',
         localField  : fieldName + '.user.accessRole',
         foreignField: '_id',
         as          : 'accessRole'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         accessRole: {$arrayElemAt: ['$accessRole.level', 0]}
         })
         });

         aggregation = PromotionModel.aggregate(pipeLine);

         aggregation.exec(function (err, result) {
         var error;

         if (err) {
         return callback(err);
         }

         if (!result[0]) {
         error = new Error();
         error.message = 'promotion not found';
         return callback(error);
         }

         result = result[0];

         options.itemDetails = '';
         options.accessRoleLevel = result.accessRole;
         options.country = result.country;
         options.region = result.region;
         options.subRegion = result.subRegion;
         options.retailSegment = result.retailSegment;
         options.outlet = result.outlet;
         options.branch = result.branch;

         callback(null);
         });
         }

         function getAchievementFormLocationsAndLevel(callback) {
         var projectObject = {};
         var achievementFormId = ObjectId(options.itemId);
         var fieldName = options.actionType === ACTIVITY_TYPES.CREATED ? 'createdBy' : 'editedBy';
         var $defProjection = {
         _id            : 1,
         editedBy       : 1,
         createdBy      : 1,
         country        : 1,
         region         : 1,
         subRegion      : 1,
         retailSegment  : 1,
         outlet         : 1,
         branch         : 1,
         accessRoleLevel: 1

         };
         var aggregateHelper = new AggregationHelper($defProjection);
         var aggregation;
         var pipeLine = [
         {
         $match: {_id: achievementFormId}
         }
         ];

         pipeLine.push({
         $lookup: {
         from        : 'personnels',
         localField  : fieldName + '.user',
         foreignField: '_id',
         as          : fieldName + '.user'
         }
         });

         projectObject[fieldName] = {
         user: {$arrayElemAt: ['$' + fieldName + '.user', 0]},
         date: 1
         };

         pipeLine.push({
         $project: aggregateHelper.getProjection(projectObject)
         });

         pipeLine.push({
         $lookup: {
         from        : 'accessRoles',
         localField  : fieldName + '.user.accessRole',
         foreignField: '_id',
         as          : 'accessRole'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         accessRole: {$arrayElemAt: ['$accessRole.level', 0]}
         })
         });

         aggregation = AchievementFormModel.aggregate(pipeLine);

         aggregation.exec(function (err, result) {
         var error;

         if (err) {
         return callback(err);
         }

         if (!result[0]) {
         error = new Error();
         error.message = 'achievement form not found';
         return callback(error);
         }

         result = result[0];

         options.itemDetails = '';
         options.accessRoleLevel = result.accessRole;
         options.country = result.country;
         options.region = result.region;
         options.subRegion = result.subRegion;
         options.retailSegment = result.retailSegment;
         options.outlet = result.outlet;
         options.branch = result.branch;

         callback(null);
         });
         }

         function getNewProductLaunchLocationsAndLevel(callback) {
         var projectObject = {};
         var newProductLaunchId = ObjectId(options.itemId);
         var fieldName = options.actionType === ACTIVITY_TYPES.CREATED ? 'createdBy' : 'editedBy';
         var $defProjection = {
         _id            : 1,
         editedBy       : 1,
         createdBy      : 1,
         country        : 1,
         region         : 1,
         subRegion      : 1,
         retailSegment  : 1,
         outlet         : 1,
         branch         : 1,
         accessRoleLevel: 1

         };
         var aggregateHelper = new AggregationHelper($defProjection);
         var aggregation;
         var pipeLine = [
         {
         $match: {_id: newProductLaunchId}
         }
         ];

         pipeLine.push({
         $lookup: {
         from        : 'personnels',
         localField  : fieldName + '.user',
         foreignField: '_id',
         as          : fieldName + '.user'
         }
         });

         projectObject[fieldName] = {
         user: {$arrayElemAt: ['$' + fieldName + '.user', 0]},
         date: 1
         };

         pipeLine.push({
         $project: aggregateHelper.getProjection(projectObject)
         });

         pipeLine.push({
         $lookup: {
         from        : 'accessRoles',
         localField  : fieldName + '.user.accessRole',
         foreignField: '_id',
         as          : 'accessRole'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         accessRole: {$arrayElemAt: ['$accessRole.level', 0]}
         })
         });

         aggregation = NewProductLaunchModel.aggregate(pipeLine);

         aggregation.exec(function (err, result) {
         var error;

         if (err) {
         return callback(err);
         }

         if (!result[0]) {
         error = new Error();
         error.message = 'new product launch not found';
         return callback(error);
         }

         result = result[0];

         options.itemDetails = '';
         options.accessRoleLevel = result.accessRole;
         options.country = result.country;
         options.region = result.region;
         options.subRegion = result.subRegion;
         options.retailSegment = result.retailSegment;
         options.outlet = result.outlet;
         options.branch = result.branch;

         callback(null);
         });
         }

         function getShelfShareLocationsAndLevel(callback) {
         var projectObject = {};
         var shelfShareId = ObjectId(options.itemId);
         var fieldName = options.actionType === ACTIVITY_TYPES.CREATED ? 'createdBy' : 'editedBy';
         var $defProjection = {
         _id            : 1,
         editedBy       : 1,
         createdBy      : 1,
         country        : 1,
         region         : 1,
         subRegion      : 1,
         retailSegment  : 1,
         outlet         : 1,
         branch         : 1,
         accessRoleLevel: 1

         };
         var aggregateHelper = new AggregationHelper($defProjection);
         var aggregation;
         var pipeLine = [
         {
         $match: {_id: shelfShareId}
         }
         ];

         pipeLine.push({
         $lookup: {
         from        : 'personnels',
         localField  : fieldName + '.user',
         foreignField: '_id',
         as          : fieldName + '.user'
         }
         });

         projectObject[fieldName] = {
         user: {$arrayElemAt: ['$' + fieldName + '.user', 0]},
         date: 1
         };

         pipeLine.push({
         $project: aggregateHelper.getProjection(projectObject)
         });

         pipeLine.push({
         $lookup: {
         from        : 'accessRoles',
         localField  : fieldName + '.user.accessRole',
         foreignField: '_id',
         as          : 'accessRole'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         accessRole: {$arrayElemAt: ['$accessRole.level', 0]}
         })
         });

         aggregation = ShelfShareModel.aggregate(pipeLine);

         aggregation.exec(function (err, result) {
         var error;

         if (err) {
         return callback(err);
         }

         if (!result[0]) {
         error = new Error();
         error.message = 'shelf share not found';
         return callback(error);
         }

         result = result[0];

         options.itemDetails = '';
         options.accessRoleLevel = result.accessRole;
         options.country = result.country;
         options.region = result.region;
         options.subRegion = result.subRegion;
         options.retailSegment = result.retailSegment;
         options.outlet = result.outlet;
         options.branch = result.branch;

         callback(null);
         });
         }

         function getContractsSecondaryLocationsAndLevel(callback) {
         var projectObject = {};
         var contractsSecondaryId = ObjectId(options.itemId);
         var fieldName = options.actionType === ACTIVITY_TYPES.CREATED ? 'createdBy' : 'editedBy';
         var $defProjection = {
         _id            : 1,
         editedBy       : 1,
         createdBy      : 1,
         country        : 1,
         region         : 1,
         subRegion      : 1,
         retailSegment  : 1,
         outlet         : 1,
         branch         : 1,
         accessRoleLevel: 1

         };
         var aggregateHelper = new AggregationHelper($defProjection);
         var aggregation;
         var pipeLine = [
         {
         $match: {_id: contractsSecondaryId}
         }
         ];

         pipeLine.push({
         $lookup: {
         from        : 'personnels',
         localField  : fieldName + '.user',
         foreignField: '_id',
         as          : fieldName + '.user'
         }
         });

         projectObject[fieldName] = {
         user: {$arrayElemAt: ['$' + fieldName + '.user', 0]},
         date: 1
         };

         pipeLine.push({
         $project: aggregateHelper.getProjection(projectObject)
         });

         pipeLine.push({
         $lookup: {
         from        : 'accessRoles',
         localField  : fieldName + '.user.accessRole',
         foreignField: '_id',
         as          : 'accessRole'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         accessRole: {$arrayElemAt: ['$accessRole.level', 0]}
         })
         });

         aggregation = ContractsSecondaryModel.aggregate(pipeLine);

         aggregation.exec(function (err, result) {
         var error;

         if (err) {
         return callback(err);
         }

         if (!result[0]) {
         error = new Error();
         error.message = 'shelf share not found';
         return callback(error);
         }

         result = result[0];

         options.itemDetails = '';
         options.accessRoleLevel = result.accessRole;
         options.country = result.country;
         options.region = result.region;
         options.subRegion = result.subRegion;
         options.retailSegment = result.retailSegment;
         options.outlet = result.outlet;
         options.branch = result.branch;

         callback(null);
         });
         }

         function getContractsYearlyLocationsAndLevel(callback) {
         var projectObject = {};
         var contractsYearlyId = ObjectId(options.itemId);
         var fieldName = options.actionType === ACTIVITY_TYPES.CREATED ? 'createdBy' : 'editedBy';
         var $defProjection = {
         _id            : 1,
         editedBy       : 1,
         createdBy      : 1,
         country        : 1,
         region         : 1,
         subRegion      : 1,
         retailSegment  : 1,
         outlet         : 1,
         branch         : 1,
         accessRoleLevel: 1

         };
         var aggregateHelper = new AggregationHelper($defProjection);
         var aggregation;
         var pipeLine = [
         {
         $match: {_id: contractsYearlyId}
         }
         ];

         pipeLine.push({
         $lookup: {
         from        : 'personnels',
         localField  : fieldName + '.user',
         foreignField: '_id',
         as          : fieldName + '.user'
         }
         });

         projectObject[fieldName] = {
         user: {$arrayElemAt: ['$' + fieldName + '.user', 0]},
         date: 1
         };

         pipeLine.push({
         $project: aggregateHelper.getProjection(projectObject)
         });

         pipeLine.push({
         $lookup: {
         from        : 'accessRoles',
         localField  : fieldName + '.user.accessRole',
         foreignField: '_id',
         as          : 'accessRole'
         }
         });

         pipeLine.push({
         $project: aggregateHelper.getProjection({
         accessRole: {$arrayElemAt: ['$accessRole.level', 0]}
         })
         });

         aggregation = ContractsYearlyModel.aggregate(pipeLine);

         aggregation.exec(function (err, result) {
         var error;

         if (err) {
         return callback(err);
         }

         if (!result[0]) {
         error = new Error();
         error.message = 'shelf share not found';
         return callback(error);
         }

         result = result[0];

         options.itemDetails = '';
         options.accessRoleLevel = result.accessRole;
         options.country = result.country;
         options.region = result.region;
         options.subRegion = result.subRegion;
         options.retailSegment = result.retailSegment;
         options.outlet = result.outlet;
         options.branch = result.branch;

         callback(null);
         });
         }

         function getDomainLocations(callback) {

         getDomainLocationsRecursive(ObjectId(options.itemId), null, function (err, result) {
         if (err) {
         return callback(err);
         }

         options.country = result.country;
         options.region = result.region;
         options.subRegion = result.subRegion;
         options.branch = result.branch;
         callback(null);

         });
         }*/

        function getUsersByLocationAndLevelW(options, respondObject, wCb) {
            var parallelTasks = {
                userIdsSocket: async.apply(getUsersByLocationAndLevel, options)
            };

            if (options.itemType === CONTENT_TYPES.PERSONNEL
                || options.itemType === CONTENT_TYPES.PLANOGRAM
                || options.itemType === CONTENT_TYPES.NOTIFICATIONS) {
                parallelTasks.userIdsPush = async.apply(getUsersByLocationAndLevel, options);
            }

            async.parallel(parallelTasks, function (err, results) {
                if (err) {
                    return wCb(err);
                }

                results.userIdsSocket.push(ObjectId(options.person));
                results.userIdsSocket = _.uniqWith(results.userIdsSocket, _.isEqual);

                if (results.userIdsPush) {
                    results.userIdsPush.push(ObjectId(options.person));
                    results.userIdsPush = _.uniqWith(results.userIdsPush, _.isEqual);
                }

                wCb(null, results, respondObject);
            });
        }

        function getSocketByUserIdsAndAddActions(results, respondObject, wCb) {
            var socketArray = [];

            var userIds = results.userIdsPush || results.userIdsSocket;

            var arrayOfStrings = results.userIdsSocket.fromObjectID();

            async.each(userIds, function (userId, eachCb) {

                addAction(userId, function (err, number) {
                    var copyObject;

                    if (err) {
                        return eachCb(err);
                    }

                    copyObject = _.clone(respondObject);
                    copyObject.badge = number;

                    pushes.sendPushes(userId, 'newActivity', copyObject, function (err, respond) {
                        if (err) {
                            logWriter.log('activity', err);
                        }
                    });

                    if (arrayOfStrings.indexOf(userId.toString()) !== -1) {
                        getSocketsByUserId(userId, function (err, sockets) {
                            var localSocketArray = [];

                            if (err) {
                                return eachCb(err);
                            }

                            sockets.forEach(function (socket) {
                                localSocketArray.push({
                                    socketId: socket,
                                    object  : copyObject
                                });
                            });
                            socketArray = _.concat(socketArray, localSocketArray);
                            eachCb(null);
                        });
                    } else {
                        eachCb(null);
                    }
                });
            }, function (err) {
                if (err) {
                    return wCb(err);
                }

                wCb(null, socketArray);
            });
        }

        function emitMessageToSocket(socketIds, wCb) {
            async.each(socketIds, function (socket, eachCb) {
                app.get('io').to(socket.socketId.split(':')[2]).emit('message', socket.object);
                eachCb(null);
            }, function (err) {
                if (err) {
                    return wCb(err);
                }

                wCb(null);
            });
        }

        waterfallFunctionsArray = [
            saveObject,
            getResultSendObject,
            getUsersByLocationAndLevelW,
            getSocketByUserIdsAndAddActions,
            emitMessageToSocket
        ];

        typeFilter = {
            /*personnel: function () {
             waterfallFunctionsArray.unshift(getUserLocationsAndLevelW);
             },*/

            /*domain: function () {
             waterfallFunctionsArray.unshift(getDomainLocations);
             },*/

            /*branch: function () {
             waterfallFunctionsArray.unshift(getBranchLocations);
             },*/

            /*item: function () {
             waterfallFunctionsArray.unshift(getItemLocationsAndLevel);
             },*/

            /*planogram: function () {
             waterfallFunctionsArray.unshift(getPlanogramLocationsAndLevel);
             },*/

            /*objectives: function () {
             waterfallFunctionsArray.unshift(getObjectivesLocationsLevelAndAssignedTo);
             },*/

            /*inStoreTasks: function () {
             waterfallFunctionsArray.unshift(getObjectivesLocationsLevelAndAssignedTo);
             },*/

            /*competitorItem: function () {
             waterfallFunctionsArray.unshift(getCompetitorListLocationsLevelAndAssignedTo);
             },*/

            /*brand: function () {
             waterfallFunctionsArray.unshift(getBrandLocationsLevelAndAssignedTo);
             },*/

            /*competitorVariant: function () {
             waterfallFunctionsArray.unshift(getCompetitorVariantLocationsLevelAndAssignedTo);
             },*/

            /*itemVariant: function () {
             waterfallFunctionsArray.unshift(getItemVariantLocationsLevelAndAssignedTo);
             },*/

            /*outlet: function () {
             waterfallFunctionsArray.unshift(getOutletLocationsLevelAndAssignedTo);
             },*/

            /*retailSegment: function () {
             waterfallFunctionsArray.unshift(getRetailSegmentLocationsLevelAndAssignedTo);
             },*/

            /*priceSurvey: function () {
             waterfallFunctionsArray.unshift(getPriceSurveyLocationsAndLevel);
             },*/

            /*competitorBranding: function () {
             waterfallFunctionsArray.unshift(getCompetitorBrandingLocationsAndLevel);
             },*/

            /*competitorPromotion: function () {
             waterfallFunctionsArray.unshift(getCompetitorPromotionLocationsAndLevel);
             },*/

            /*promotions: function () {
             waterfallFunctionsArray.unshift(getPromotionLocationsAndLevel);
             },*/

            /*achievementForm: function () {
             waterfallFunctionsArray.unshift(getAchievementFormLocationsAndLevel);
             },*/

            /*newProductLaunch: function () {
             waterfallFunctionsArray.unshift(getNewProductLaunchLocationsAndLevel);
             },*/

            /*shelfShare: function () {
             waterfallFunctionsArray.unshift(getShelfShareLocationsAndLevel);
             },*/

            /*contractsSecondary: function () {
             waterfallFunctionsArray.unshift(getContractsSecondaryLocationsAndLevel);
             },

             contractsYearly: function () {
             waterfallFunctionsArray.unshift(getContractsYearlyLocationsAndLevel);
             }*/

        };

        /*if (typeFilter[options.itemType]) {
         typeFilter[options.itemType]();
         }*/

        if ([CONTENT_TYPES.DOMAIN, CONTENT_TYPES.OUTLET, CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.BRANCH].indexOf(options.itemType) === -1) {
            waterfallFunctionsArray.unshift(async.apply(getActivityInfo, options));
        } else {
            waterfallFunctionsArray.unshift(async.apply(getDomainActivityInfo, options));
        }

        async.waterfall(waterfallFunctionsArray, function (err, result) {
            if (err) {
                return logWriter.log('activity', err);
            }

            cb(null);
        });
    };

};

module.exports = ActivityHelper;
