var ActivityHelper = function (db, redis, app) {
    'use strict';

    var async = require('async');
    var logger = require('../utils/logger');
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
    const ActivityModel = require('./../types/activityList/model');
    const PersonnelModel = require('./../types/personnel/model');
    var access = require('../helpers/access')(db);

    var levelsByLevel = {
        1: [
            ACL_CONSTANTS.MASTER_ADMIN,
            ACL_CONSTANTS.MASTER_UPLOADER,
            ACL_CONSTANTS.VIRTUAL
        ],
        2: [
            ACL_CONSTANTS.MASTER_ADMIN,
            ACL_CONSTANTS.MASTER_UPLOADER,
            ACL_CONSTANTS.VIRTUAL
        ],
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

    var $defProjections = {};
    var models = {};

    var schemas = mongoose.Schemas;
    var schemaModelName;

    for (var key in schemas) {
        schemaModelName = key;
        models[key] = db.model(schemaModelName, schemas[schemaModelName]);
    }
    models[CONTENT_TYPES.OBJECTIVES] =  models[CONTENT_TYPES.INSTORETASKS] = require('../types/objective/model');
    models[CONTENT_TYPES.QUESTIONNARIES] = require('../types/questionnaries/model');

    $defProjections[CONTENT_TYPES.OBJECTIVES]
        = $defProjections[CONTENT_TYPES.INSTORETASKS]
        = {
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
        _id       : 1,
        editedBy  : 1,
        accessRole: 1,
        createdBy : 1,
        country   : 1,
        region    : 1,
        subRegion : 1,
        branch    : 1,
        firstName : 1,
        lastName  : 1,
        level     : 1
    };
    $defProjections[CONTENT_TYPES.NOTIFICATIONS] = {
        _id       : 1,
        editedBy  : 1,
        createdBy : 1,
        country   : 1,
        region    : 1,
        subRegion : 1,
        branch    : 1,
        name      : 1,
        recipients: 1
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
    $defProjections[CONTENT_TYPES.CONTRACTSYEARLY]
        = $defProjections[CONTENT_TYPES.CONTRACTSSECONDARY]
        = $defProjections[CONTENT_TYPES.PROMOTIONS]
        = $defProjections[CONTENT_TYPES.COMPETITORBRANDING]
        = $defProjections[CONTENT_TYPES.COMPETITORPROMOTION]
        = $defProjections[CONTENT_TYPES.ACHIEVEMENTFORM]
        = $defProjections[CONTENT_TYPES.NEWPRODUCTLAUNCH]
        = $defProjections[CONTENT_TYPES.PRICESURVEY]
        = $defProjections[CONTENT_TYPES.SHELFSHARES]
        = $defProjections[CONTENT_TYPES.BRANDINGANDDISPLAY]
        = {
        _id          : 1,
        editedBy     : 1,
        createdBy    : 1,
        country      : 1,
        region       : 1,
        subRegion    : 1,
        retailSegment: 1,
        outlet       : 1,
        branch       : 1,
        level        : 1,
        status       : 1
    };
    $defProjections[CONTENT_TYPES.BRAND]
        = $defProjections[CONTENT_TYPES.COMPETITORVARIANT]
        = $defProjections[CONTENT_TYPES.VARIANT]
        = {
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
    $defProjections[CONTENT_TYPES.DOCUMENTS] = {
        _id      : 1,
        createdBy: 1,
        editedBy : 1,
        title    : 1,
        level    : 1
    };
    $defProjections[CONTENT_TYPES.QUESTIONNARIES] = {
        _id          : 1,
        createdBy    : 1,
        editedBy     : 1,
        title        : 1,
        level        : 1,
        status       : 1,
        country      : 1,
        region       : 1,
        subRegion    : 1,
        retailSegment: 1,
        branch       : 1,
        personnels   : 1

    };

    function getPersonnelsByLocation(options, cb) {
        if (!options || !Object.keys(options).length) {
            return cb(null, null);
        }
        var pipeLine = [];
        var defProjectionPersonnel = {
            _id       : 1,
            accessRole: 1
        };
        var aggregateHelper = new AggregationHelper(defProjectionPersonnel);
        var aggregation;

        if (options.country) {
            pipeLine.push({
                $match: {
                    $or: [
                        {
                            country: {
                                $in: options.country
                            }
                        },
                        {
                            country: {
                                $size: 0
                            }
                        }
                    ]
                }
            });
        }
        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'accessRoles',
            key          : 'accessRole',
            isArray      : false,
            addProjection: ['level']
        }));

        if (options.level) {
            pipeLine.push({
                $match: {
                    'accessRole.level': {
                        $lt: options.level
                    }
                }
            });
        }

        pipeLine.push({
            $group: {
                _id       : null,
                personnels: {$addToSet: '$_id'}
            }
        });

        aggregation = PersonnelModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return cb(err);
            }

            result = result && result[0] ? result[0].personnels : null;

            cb(null, result);
        })


    }

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
        var waterFallTasks = [];
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
            options.accessRoleLevel = 11; // result.level || 0;

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
        };

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

        if (options.itemType !== CONTENT_TYPES.PERSONNEL) {
            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from             : 'accessRoles',
                key              : fieldName + '.user.accessRole',
                isArray          : false,
                addMainProjection: ['level']
            }));
        } else {
            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from             : 'accessRoles',
                key              : 'accessRole',
                isArray          : false,
                addMainProjection: ['level']
            }));
        }

        logger.info('Model that triggers when creating new activity:', options.itemType);
        aggregation = models[options.itemType].aggregate(pipeLine);

        aggregation.exec(function (err, result) {
            var error;
            var locationObject;
            var searchOptions = {};
            var level;
            var country;
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

            level = result.level === ACL_CONSTANTS.MASTER_ADMIN ? ACL_CONSTANTS.AREA_MANAGER : result.level;
            if (result.country) {
                country = Array.isArray(result.country) ? result.country : [result.country];
            }

            if ([CONTENT_TYPES.CONTRACTSSECONDARY, CONTENT_TYPES.CONTRACTSYEARLY].indexOf(options.itemType) !== -1) {
                searchOptions.country = country;
                searchOptions.level = level;
            }

            getPersonnelsByLocation(searchOptions, function (err, personnelsResult) {
                if (err) {
                    return waterFallCB(err);
                }

                if (personnelsResult) {
                    options.personnels = _.without(personnelsResult.fromObjectID(), options.createdBy.user);
                    options.personnels = options.personnels.objectID();
                    /*options.personnels = personnelsResult;*/
                }

                if (options.itemType === CONTENT_TYPES.NOTIFICATIONS) {
                    options.personnels = result.recipients;
                }

                if (options.itemType === CONTENT_TYPES.QUESTIONNARIES) {
                    options.personnels = result.personnels;
                }

                if (!options.itemDetails) {
                    options.itemDetails = (contentTypesForDetails.indexOf(options.itemType) !== -1) ? options.itemType : '';
                }

                options.accessRoleLevel = result.level || 0;

                if (options.itemType === CONTENT_TYPES.CONTRACTSYEARLY || options.itemType === CONTENT_TYPES.CONTRACTSSECONDARY) {
                    options.accessRoleLevel = 11;
                }

                locationObject = getLocationValue(result, domainsFields);

                options = _.extend(options, locationObject);

                options.assignedTo = result.assignedTo;

                switch (options.itemType) {
                    case CONTENT_TYPES.DOCUMENTS:
                        itemName = {
                            en: result.title
                        };
                        break;
                    case CONTENT_TYPES.QUESTIONNARIES:
                    case CONTENT_TYPES.OBJECTIVES:
                    case CONTENT_TYPES.INSTORETASKS:
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
            itemName   : 1,
            personnels : 1
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

    function getUsersByLocationAndLevel(activityObject, forPushes, cb) {
        var regionsMathArray = {};
        var aggregation;
        var pipeLine = [];
        var orArray = [];
        var coverParallelTasks = [];
        var waterFallTasks = [];
        var locationName;

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

        if (activityObject.itemType === CONTENT_TYPES.NOTIFICATIONS
            || activityObject.itemType === CONTENT_TYPES.CONTRACTSYEARLY
            || activityObject.itemType === CONTENT_TYPES.PROMOTIONS
            || activityObject.itemType === CONTENT_TYPES.BRANDINGANDDISPLAY
            || activityObject.itemType === CONTENT_TYPES.QUESTIONNARIES) {
            levelQuery = {};
        }

        if (activityObject.itemType === CONTENT_TYPES.QUESTIONNARIES) {
            if (activityObject.branch && activityObject.branch.length) {
                locationName = 'branch';
            } else if (activityObject.outlet && activityObject.outlet.length) {
                locationName = 'outlet';
            } else if (activityObject.retailSegment && activityObject.retailSegment.length) {
                locationName = 'retailSegment';
            } else if (activityObject.subRegion && activityObject.subRegion.length) {
                locationName = 'subRegion';
            } else if (activityObject.region && activityObject.region.length) {
                locationName = 'region';
            } else if (activityObject.country && activityObject.country.length) {
                locationName = 'country';
            }

            regionsMathArray = {};
            if (locationName) {
                regionsMathArray[locationName] = {$in: activityObject[locationName]};
            }
        }

        if (forPushes && typeof forPushes !== 'function') {
            levelQuery = {};
            regionsMathArray = {country: {$in: activityObject.country}};
        } else {
            cb = forPushes;
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

            if (activityObject.personnels && activityObject.personnels.length) {
                pipeLine.push({
                    $match: {
                        _id: {
                            $in: activityObject.personnels
                        }
                    }
                });
            } else {
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
            }

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

        function saveObject(wCb) {
            var activityModel = new ActivityModel(options);

            activityModel.save(function (err, activity) {
                if (err) {
                    return wCb(err);
                }

                wCb(null, activity);
            });
        }

        function getUsersByLocationAndLevelW(options, respondObject, wCb) {
            var parallelTasks = {
                userIdsSocket: async.apply(getUsersByLocationAndLevel, options)
            };

            if ([CONTENT_TYPES.ITEM, CONTENT_TYPES.PERSONNEL, CONTENT_TYPES.PLANOGRAM,
                    CONTENT_TYPES.COMPETITORITEM,
                    CONTENT_TYPES.PRICESURVEY, CONTENT_TYPES.SHELFSHARES,
                    CONTENT_TYPES.NEWPRODUCTLAUNCH].indexOf(options.itemType) !== -1) {

                parallelTasks.userIdsPush = async.apply(getUsersByLocationAndLevel, options, true);
            }

            async.parallel(parallelTasks, function (err, results) {
                if (err) {
                    return wCb(err);
                }

                if (options.person) {
                    results.userIdsSocket.push(ObjectId(options.person));
                }
                results.userIdsSocket = _.uniqWith(results.userIdsSocket, _.isEqual);

                if (results.userIdsPush) {
                    if (options.person) {
                        results.userIdsPush.push(ObjectId(options.person));
                    }
                    results.userIdsPush = _.uniqWith(results.userIdsPush, _.isEqual);
                }

                if ([CONTENT_TYPES.CONTRACTSYEARLY, CONTENT_TYPES.CONTRACTSSECONDARY].indexOf(options.itemType) !== -1) {
                    if (!results.userIdsPush) {
                        results.userIdsPush = _.union([ObjectId(options.createdBy.user)], results.userIdsSocket);
                    } else {
                        results.userIdsPush.push(ObjectId(options.createdBy.user));
                    }

                    results.userIdsPush = _.uniqBy(results.userIdsPush, 'id');
                }

                wCb(null, results, respondObject);
            });
        }

        function getSocketByUserIdsAndAddActions(results, respondObject, wCb) {
            var socketArray = [];

            var userIds = results.userIdsPush || results.userIdsSocket;

            var arrayOfStrings = results.userIdsSocket.fromObjectID();

            async.each(userIds, function (userId, eachCb) {
                var copyObject;
                copyObject = _.clone(respondObject);

                if (arrayOfStrings.indexOf(userId.toString()) !== -1) {
                    addAction(userId, function (err, number) {

                        if (err) {
                            return eachCb(err);
                        }
                        copyObject.badge = number;
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

                            pushes.sendPushes(userId, 'newActivity', copyObject, function (err, respond) {
                                if (err) {
                                    logWriter.log('activity', err);
                                }
                            });

                            eachCb(null);
                        });
                    });
                } else {
                    pushes.sendPushes(userId, 'newActivity', copyObject, function (err, respond) {
                        if (err) {
                            logWriter.log('activity', err);
                        }

                        eachCb(null);
                    });
                }
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
