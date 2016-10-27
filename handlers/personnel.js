var Personnel = function (db, redis, event) {
    var mongoose = require('mongoose');
    var ACL_CONSTANTS = require('../constants/aclRolesNames');
    var ACL_MODULES = require('../constants/aclModulesNames');
    var RESPONSES_CONSTANTS = require('../constants/responses');
    var CONSTANTS = require('../constants/mainConstants');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var ACTIVITY_TYPES = require('../constants/activityTypes');
    var REGEXP = require('../public/js/constants/validation.js');
    var PERSONNEL_STATUSES = require('../public/js/constants/personnelStatuses.js');
    var validator = require('validator');
    var bcrypt = require('bcryptjs');
    var crypto = require('crypto');
    var access = require('../helpers/access')(db);
    var generator = require('../helpers/randomPass.js');
    var Mailer = require('../helpers/mailer');
    var SMS = require('../helpers/smsSender');
    var FilterMapper = require('../helpers/filterMapper');
    var async = require('async');
    var GetImagesHelper = require('../helpers/getImages');
    var getImagesHelper = new GetImagesHelper(db);
    var personnelSchema = mongoose.Schemas[CONTENT_TYPES.PERSONNEL];
    var PersonnelModel = db.model(CONTENT_TYPES.PERSONNEL, personnelSchema);
    var accessRoleSchema = mongoose.Schemas[CONTENT_TYPES.ACCESSROLE];
    var AccessRoleModel = db.model(CONTENT_TYPES.ACCESSROLE, accessRoleSchema);
    var SessionModel = db.model('session', mongoose.Schemas.session);
    var xssFilters = require('xss-filters');
    var ObjectId = mongoose.Types.ObjectId;
    var Archiver = require('../helpers/archiver');
    var AggregationHelper = require('../helpers/aggregationCreater');
    var archiver = new Archiver(PersonnelModel);
    var _ = require('lodash');
    var bodyValidator = require('../helpers/bodyValidator');
    var logWriter = require('../helpers/logWriter.js');
    var SomeEvents = require('../helpers/someEvents');
    var someEvents = new SomeEvents();

    var $defProjection = {
        _id             : 1,
        position        : 1,
        avgRating       : 1,
        manager         : 1,
        lastAccess      : 1,
        firstName       : 1,
        lastName        : 1,
        email           : 1,
        phoneNumber     : 1,
        accessRole      : 1,
        createdBy       : 1,
        editedBy        : 1,
        vacation        : 1,
        status          : 1,
        region          : 1,
        subRegion       : 1,
        retailSegment   : 1,
        outlet          : 1,
        branch          : 1,
        country         : 1,
        currentLanguage : 1,
        super           : 1,
        archived        : 1,
        temp            : 1,
        confirmed       : 1,
        translated      : 1,
        dateJoined      : 1,
        beforeAccess    : 1,
        lasMonthEvaluate: 1,
        covered         : 1,
        token           : 1
    };

    var convertDomainsToObjectIdArray = function (body) {
        if (body.country) {
            body.country = body.country.objectID();
        }

        if (body.region) {
            body.region = body.region.objectID();
        }

        if (body.subRegion) {
            body.subRegion = body.subRegion.objectID();
        }

        if (body.retailSegment) {
            body.retailSegment = body.retailSegment.objectID();
        }

        if (body.outlet) {
            body.outlet = body.outlet.objectID();
        }

        if (body.branch) {
            body.branch = body.branch.objectID();
        }
    };

    var unselectable = function (currentLevel, context, instoreObjective) {
        var obj = {
            1: [],
            2: ['country'],
            3: ['country', 'region'],
            4: ['country', 'region', 'subRegion']
        };
        var index;
        var value;

        if (instoreObjective) {
            return {$literal: false};
        }

        if (obj[currentLevel]) {
            index = obj[currentLevel].indexOf(context);
            value = false;

            if (index !== -1) {
                value = true;
            }
            return {$literal: value};
        }

        return {$literal: false};
    };

    var pushCurrentUserCovered = function (pipeLine) {

        pipeLine.push({
            $lookup: {
                from        : 'personnels',
                localField  : '_id',
                foreignField: 'vacation.cover',
                as          : 'covered'
            }
        });

        pipeLine.push({
            $unwind: {
                path                      : '$covered',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeLine.push({
            $project: {
                _id            : 1,
                position       : 1,
                avgRating      : 1,
                manager        : 1,
                lastAccess     : 1,
                beforeAccess   : 1,
                firstName      : 1,
                lastName       : 1,
                email          : 1,
                phoneNumber    : 1,
                accessRole     : 1,
                dateJoined     : 1,
                createdBy      : 1,
                covered        : {
                    accessRole: 1,
                    onLeave   : '$covered.vacation.onLeave',
                    _id       : 1
                },
                vacation       : 1,
                status         : 1,
                region         : 1,
                subRegion      : 1,
                retailSegment  : 1,
                outlet         : 1,
                branch         : 1,
                country        : 1,
                currentLanguage: 1,
                super          : 1,
                archived       : 1,
                temp           : 1,
                confirmed      : 1,
                translated     : 1
            }
        });

        pipeLine.push({
            $lookup: {
                from        : 'accessRoles',
                localField  : 'covered.accessRole',
                foreignField: '_id',
                as          : 'covered.accessRole'
            }
        });

        pipeLine.push({
            $project: {
                _id            : 1,
                position       : 1,
                avgRating      : 1,
                manager        : 1,
                lastAccess     : 1,
                beforeAccess   : 1,
                firstName      : 1,
                lastName       : 1,
                email          : 1,
                phoneNumber    : 1,
                accessRole     : 1,
                dateJoined     : 1,
                createdBy      : 1,
                covered        : {
                    _id        : 1,
                    accessRoles: {
                        $arrayElemAt: [
                            '$covered.accessRole',
                            0
                        ]
                    },
                    onLeave    : 1
                },
                status         : 1,
                vacation       : 1,
                region         : 1,
                subRegion      : 1,
                retailSegment  : 1,
                outlet         : 1,
                branch         : 1,
                country        : 1,
                currentLanguage: 1,
                super          : 1,
                archived       : 1,
                temp           : 1,
                confirmed      : 1,
                translated     : 1
            }
        });

        pipeLine.push({
            $project: {
                _id            : 1,
                position       : 1,
                avgRating      : 1,
                manager        : 1,
                lastAccess     : 1,
                beforeAccess   : 1,
                firstName      : 1,
                lastName       : 1,
                dateJoined     : 1,
                email          : 1,
                phoneNumber    : 1,
                accessRole     : 1,
                createdBy      : 1,
                covered        : {
                    _id        : 1,
                    accessRoles: {
                        _id      : 1,
                        editedBy : 1,
                        createdBy: 1,
                        name     : 1,
                        __v      : 1,
                        level    : 1
                    },
                    onLeave    : 1
                },
                status         : 1,
                vacation       : 1,
                region         : 1,
                subRegion      : 1,
                retailSegment  : 1,
                outlet         : 1,
                branch         : 1,
                country        : 1,
                currentLanguage: 1,
                super          : 1,
                archived       : 1,
                temp           : 1,
                confirmed      : 1,
                translated     : 1
            }
        });

        pipeLine.push({
            $group: {
                _id            : '$_id',
                position       : {
                    $first: '$position'
                },
                avgRating      : {
                    $first: '$avgRating'
                },
                manager        : {
                    $first: '$manager'
                },
                lastAccess     : {
                    $first: '$lastAccess'
                },
                beforeAccess   : {
                    $first: '$beforeAccess'
                },
                firstName      : {
                    $first: '$firstName'
                },
                lastName       : {
                    $first: '$lastName'
                },
                email          : {
                    $first: '$email'
                },
                phoneNumber    : {
                    $first: '$phoneNumber'
                },
                accessRole     : {
                    $first: '$accessRole'
                },
                dateJoined     : {
                    $first: '$dateJoined'
                },
                createdBy      : {
                    $first: '$createdBy'
                },
                vacation       : {
                    $first: '$vacation'
                },
                status         : {
                    $first: '$status'
                },
                region         : {
                    $first: '$region'
                },
                subRegion      : {
                    $first: '$subRegion'
                },
                retailSegment  : {
                    $first: '$retailSegment'
                },
                outlet         : {
                    $first: '$outlet'
                },
                branch         : {
                    $first: '$branch'
                },
                country        : {
                    $first: '$country'
                },
                currentLanguage: {
                    $first: '$currentLanguage'
                },
                super          : {
                    $first: '$super'
                },
                archived       : {
                    $first: '$archived'
                },
                temp           : {
                    $first: '$temp'
                },
                confirmed      : {
                    $first: '$confirmed'
                },
                translated     : {
                    $first: '$translated'
                },
                covered        : {
                    $addToSet: '$covered'
                }
            }
        });

        return pipeLine;
    };

    var personnelFindByIdAndPopulate = function (options, callback) {
        var id = options.id || '';
        var isCurrent = options.isCurrent || false;
        var queryObject = {_id: ObjectId(id)};
        var isMobile = options.isMobile || false;

        var aggregateHelper = new AggregationHelper($defProjection);
        var pipeLine = [];
        var aggregation;

        var domainsArray = ['country', 'region', 'subRegion'];

        pipeLine.push({
            $match: queryObject
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'positions',
            key    : 'position',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'accessRoles',
            key          : 'accessRole',
            isArray      : false,
            addProjection: 'level'
        }));

        domainsArray.forEach(function (element) {
            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from: 'domains',
                key : element
            }));
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from             : 'branches',
            key              : 'branch',
            addMainProjection: ['retailSegment', 'outlet']
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
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            nameFields     : ['firstName', 'lastName'],
            includeSiblings: {createdBy: {date: 1}}
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'personnels',
            key          : 'manager',
            isArray      : false,
            addProjection: ['firstName', 'lastName']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'vacation.cover',
            isArray        : false,
            addProjection  : ['firstName', 'lastName', 'accessRole', 'vacation'],
            includeSiblings: {vacation: {onLeave: 1}}
        }));

        if (isCurrent) {
            pipeLine = pushCurrentUserCovered(pipeLine);
        }

        aggregation = PersonnelModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, result) {
            if (err) {
                return callback(err);
            }
            if (!result || !result.length) {
                return callback(null, {});
            }
            var coveredObject = {};
            var personnel;
            var ids = [result[0]._id];
            var options = {
                data: {}
            };
            if (isMobile) {
                coveredObject = [];
            }
            personnel = result[0];

            if (personnel.firstName) {
                personnel.firstName = {
                    en: _.unescape(personnel.firstName.en),
                    ar: _.unescape(personnel.firstName.ar)
                }
            }
            if (personnel.lastName) {
                personnel.lastName = {
                    en: _.unescape(personnel.lastName.en),
                    ar: _.unescape(personnel.lastName.ar)
                }
            }
            if (personnel && personnel.covered && !isMobile) {
                personnel.covered.forEach(function (value) {
                    if (value.onLeave) {
                        coveredObject[value._id] = value.accessRoles;
                    }
                });
                personnel.covered = coveredObject;

            }

            options.data[CONTENT_TYPES.PERSONNEL] = ids;

            getImagesHelper.getImages(options, function (err, result) {
                var optionsForImplement = {
                    response  : personnel,
                    imgsObject: result,
                    fields    : {
                        personnel: []
                    }
                };
                getImagesHelper.setIntoResult(optionsForImplement, function (response) {
                    callback(null, response);
                });
            });
        });
    };

    function consoleLogENV(message) {
        if (process.env.NODE_ENV !== 'production') {
            console.log(message);
        }
    }

    this.getForDD = function (req, res, next) {
        function queryRun() {
            var query = req.query;
            var queryObject = query || {};

            if (queryObject.outlet) {
                queryObject.outlet = ObjectId(queryObject.outlet);
            }

            PersonnelModel.find(queryObject, '_id firstName lastName fullName phoneNumber email').exec(function (err, result) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.PERSONNEL, function (err, allowed) {
            var customErr;

            if (err) {
                return next(err);
            }
            if (!allowed) {
                customErr = new Error();
                customErr.status = 403;

                return next(customErr);
            }

            queryRun();
        });
    };

    this.getForTree = function (req, res, next) {
        function queryRun() {
            var query = req.query;
            var currentLevel = req.session.level;
            var level;
            var queryObject = query || {};
            var pipeLine = [];
            var $matchObject = {};
            var aggregation;
            var aggregateHelper = new AggregationHelper($defProjection);
            var currentLanguage = queryObject.currentLanguage;
            var pipeArray = [];
            var element;
            var error;
            var instoreObjective = req.query.instoreObjective;

            if (!queryObject.ids || !(queryObject.ids instanceof Array) || !currentLanguage) {
                error = new Error('Not enough params');
                error.status = 400;

                return next(error);
            }

            async.waterfall([

                function (cb) {
                    PersonnelModel
                        .findById(queryObject.ids[0])
                        .populate([{path: 'accessRole', select: 'level'}])
                        .exec(function (err, personnelModel) {
                            if (err) {
                                return cb(err, null);
                            }

                            if (!personnelModel) {
                                error = new Error('User not found');
                                error.status = 400;

                                return cb(error, null);
                            }

                            level = personnelModel.get('accessRole.level');

                            if (!level) {
                                error = new Error('Can\'t do that');
                                error.status = 400;

                                return cb(err, null);
                            }

                            cb(null, level);
                        });
                },

                function (level, cb) {
                    if (level === ACL_CONSTANTS.MASTER_ADMIN) {
                        return cb(null, []);
                    }

                    //show all tree for level > 4
                    if (level > ACL_CONSTANTS.SALES_MAN) {
                        level = ACL_CONSTANTS.SALES_MAN;
                    }

                    queryObject.ids = queryObject.ids.objectID();

                    $matchObject._id = {$in: queryObject.ids};

                    pipeLine.push({
                        $match: $matchObject
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
                            path                      : '$branch',
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
                        $project: aggregateHelper.getProjection({
                            country: {
                                _id         : {$arrayElemAt: ['$country._id', 0]},
                                title       : {$arrayElemAt: ['$country.name.' + currentLanguage, 0]},
                                expanded    : {$literal: true},
                                selected    : {$literal: false},
                                unselectable: unselectable(currentLevel, 'country', instoreObjective),
                                contentType : {$literal: 'country'},
                                key         : {$arrayElemAt: ['$country._id', 0]}
                            }
                        })
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
                        $project: aggregateHelper.getProjection({
                            region: {
                                _id         : {$arrayElemAt: ['$region._id', 0]},
                                title       : {$arrayElemAt: ['$region.name.' + currentLanguage, 0]},
                                expanded    : {$literal: true},
                                selected    : {$literal: false},
                                unselectable: unselectable(currentLevel, 'region', instoreObjective),
                                contentType : {$literal: 'region'},
                                key         : {$arrayElemAt: ['$region._id', 0]}
                            }
                        })
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
                        $project: aggregateHelper.getProjection({
                            subRegion: {
                                _id         : {$arrayElemAt: ['$subRegion._id', 0]},
                                title       : {$arrayElemAt: ['$subRegion.name.' + currentLanguage, 0]},
                                expanded    : {$literal: true},
                                selected    : {$literal: false},
                                unselectable: unselectable(currentLevel, 'subRegion', instoreObjective),
                                contentType : {$literal: 'subRegion'},
                                key         : {$arrayElemAt: ['$subRegion._id', 0]}
                            }
                        })
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
                        $project: aggregateHelper.getProjection({
                            branch       : {
                                _id        : {$arrayElemAt: ['$branch._id', 0]},
                                title      : {$arrayElemAt: ['$branch.name.' + currentLanguage, 0]},
                                expanded   : {$literal: true},
                                selected   : {$literal: false},
                                contentType: {$literal: 'branch'},
                                key        : {$arrayElemAt: ['$branch._id', 0]}
                            },
                            retailSegment: {$arrayElemAt: ['$branch.retailSegment', 0]},
                            outlet       : {$arrayElemAt: ['$branch.outlet', 0]}
                        })
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
                        $project: aggregateHelper.getProjection({
                            retailSegment: {
                                _id        : {$arrayElemAt: ['$retailSegment._id', 0]},
                                title      : {$arrayElemAt: ['$retailSegment.name.' + currentLanguage, 0]},
                                expanded   : {$literal: true},
                                selected   : {$literal: false},
                                contentType: {$literal: 'retailSegment'},
                                key        : {$arrayElemAt: ['$retailSegment._id', 0]}
                            }
                        })
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
                        $project: aggregateHelper.getProjection({
                            outlet: {
                                _id        : {$arrayElemAt: ['$outlet._id', 0]},
                                title      : {$arrayElemAt: ['$outlet.name.' + currentLanguage, 0]},
                                expanded   : {$literal: true},
                                selected   : {$literal: false},
                                contentType: {$literal: 'outlet'},
                                key        : {$arrayElemAt: ['$outlet._id', 0]}
                            }
                        })
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

                    //=============add some conditions for tree===========

                    pipeArray.push({
                        $group: {
                            _id         : '$country._id',
                            title       : {$first: '$country.title'},
                            expanded    : {$first: '$country.expanded'},
                            selected    : {$first: '$country.selected'},
                            unselectable: {$first: '$country.unselectable'},
                            contentType : {$first: '$country.contentType'},
                            key         : {$first: '$country.key'},
                            children    : {
                                $addToSet: {
                                    _id         : '$region._id',
                                    title       : '$region.title',
                                    expanded    : '$region.expanded',
                                    selected    : '$region.selected',
                                    unselectable: '$region.unselectable',
                                    contentType : '$region.contentType',
                                    key         : '$region.key',
                                    children    : '$children'
                                }
                            }
                        }
                    });

                    pipeArray.push({
                        $group: {
                            _id     : '$region._id',
                            region  : {$first: '$region'},
                            country : {$first: '$country'},
                            children: {
                                $addToSet: {
                                    _id         : '$subRegion._id',
                                    title       : '$subRegion.title',
                                    expanded    : '$subRegion.expanded',
                                    selected    : '$subRegion.selected',
                                    unselectable: '$subRegion.unselectable',
                                    contentType : '$subRegion.contentType',
                                    key         : '$subRegion.key',
                                    children    : '$children'
                                }
                            }
                        }
                    });

                    pipeArray.push({
                        $group: {
                            _id      : '$subRegion._id',
                            subRegion: {$first: '$subRegion'},
                            country  : {$first: '$country'},
                            region   : {$first: '$region'},
                            children : {
                                $addToSet: {
                                    _id        : '$retailSegment._id',
                                    title      : '$retailSegment.title',
                                    expanded   : '$retailSegment.expanded',
                                    selected   : '$retailSegment.selected',
                                    contentType: '$retailSegment.contentType',
                                    key        : '$retailSegment.key',
                                    children   : '$children'
                                }
                            }
                        }
                    });

                    pipeArray.push({
                        $group: {
                            _id          : '$retailSegment._id',
                            retailSegment: {$first: '$retailSegment'},
                            country      : {$first: '$country'},
                            region       : {$first: '$region'},
                            subRegion    : {$first: '$subRegion'},
                            children     : {
                                $addToSet: {
                                    _id        : '$outlet._id',
                                    title      : '$outlet.title',
                                    expanded   : '$outlet.expanded',
                                    selected   : '$outlet.selected',
                                    contentType: '$outlet.contentType',
                                    key        : '$outlet.key',
                                    children   : '$children'
                                }
                            }
                        }
                    });

                    pipeArray.push({
                        $group: {
                            _id          : '$outlet._id',
                            outlet       : {$first: '$outlet'},
                            country      : {$first: '$country'},
                            region       : {$first: '$region'},
                            subRegion    : {$first: '$subRegion'},
                            retailSegment: {$first: '$retailSegment'},
                            children     : {
                                $addToSet: {
                                    _id        : '$branch._id',
                                    title      : '$branch.title',
                                    expanded   : '$branch.expanded',
                                    selected   : '$branch.selected',
                                    contentType: '$branch.contentType',
                                    key        : '$branch.key'
                                }
                            }
                        }
                    });

                    //==============================

                    if (level < ACL_CONSTANTS.SALES_MAN) {
                        for (var i = level - 1; i > 0; i--) {
                            element = pipeArray[i - 1];

                            if (i === level - 1) {
                                delete element.$group.children;
                            }

                            pipeLine.push(element);
                        }
                    } else {
                        for (var i = level; i > 0; i--) {
                            element = pipeArray[i - 1];

                            pipeLine.push(element);
                        }
                    }

                    aggregation = PersonnelModel.aggregate(pipeLine);

                    aggregation.options = {
                        allowDiskUse: true
                    };

                    aggregation.exec(function (err, result) {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, result);
                    });
                }

            ], function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.PERSONNEL, function (err, allowed) {
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

    this.getStatusForDD = function (req, res, next) {
        function queryRun() {
            PersonnelModel.distinct('status', '_id firstName lastName fullName phoneNumber email').exec(function (err, result) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.PERSONNEL, function (err, allowed) {
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

    this.createSuper = function (req, res, next) {
        var body = req.body;
        var email = body.email;
        var isEmailValid = false;
        var mailer = new Mailer();
        var personnelModel;
        var error;
        var accessRoleModel;

        var salt = bcrypt.genSaltSync(10);

        var createdBy = {
            user: req.session.uId,
            date: new Date()
        };

        if (email) {
            isEmailValid = REGEXP.EMAIL_REGEXP.test(email);
        }

        if (!isEmailValid) {
            error = new Error();
            error.status = 400;
            return next(error);
        }

        email = validator.escape(email);
        email = xssFilters.inHTMLData(email);

        body.email = email.toLowerCase();
        body.super = true;
        body.createdBy = createdBy;
        body.editedBy = createdBy;
        body.token = generator.generate();
        body.status = PERSONNEL_STATUSES.INACTIVE._id;

        body.pass = bcrypt.hashSync(body.pass, salt);

        body.firstName = {en: 'Super'};
        body.lastName = {en: 'Admin'};

        PersonnelModel.findOne({super: true}, function (err, result) {
            if (err) {
                return console.log(err);
            }

            if (!result) {
                async.waterfall([
                    function (cb) {
                        accessRoleModel = new AccessRoleModel({
                            name : {
                                en: 'Super Admin',
                                ar: 'Super Admin'
                            },
                            level: 0
                        });

                        accessRoleModel.save(function (err, accessRole) {
                            if (err) {
                                return cb(err);
                            }

                            return cb(null, accessRole);
                        });
                    },
                    function (accessRole, cb) {
                        body.accessRole = accessRole._id;

                        personnelModel = new PersonnelModel(body);
                        personnelModel.save(function (err, personnel) {
                            if (err) {
                                return cb(err);
                            }

                            mailer.confirmNewUserRegistration(personnel);
                            return cb(null, personnel);
                        });
                    }
                ], function (err, result) {
                    if (err) {
                        return next(err);
                    }

                    res.status(201).send(result._id);
                });

            } else if (result.email === body.email) {
                res.status(400).send('email not unique');
            } else {
                res.status(400).send('admin is already created');
            }
        });
    };

    this.create = function (req, res, next) {
        function queryRun(body) {
            var phone = body.phoneNumber;
            var isPhoneValid = phone === '' || false;
            var Domain = db.model(CONTENT_TYPES.DOMAIN, mongoose.Schemas[CONTENT_TYPES.DOMAIN]);
            var createdBy = {
                user: req.session.uId,
                date: new Date()
            };
            var personnelModel;
            var error;
            var options;
            var email;
            var isEmailValid;

            if (body.personnel) {
                body.manager = body.personnel;
            }

            if (body.email) {
                email = body.email;
                isEmailValid = email === '' || false;
            }

            if (email && !isEmailValid) {
                email = validator.escape(email);
                email = xssFilters.inHTMLData(email);
                email = email.toLowerCase();
                isEmailValid = REGEXP.EMAIL_REGEXP.test(email);
            }

            if (phone && !isPhoneValid) {
                phone = validator.escape(phone);
                phone = xssFilters.inHTMLData(phone);
                isPhoneValid = REGEXP.PHONE_REGEXP.test(phone);
            }

            if ((/*!email &&*/ !phone) /*|| !isEmailValid */ || !isPhoneValid) {
                error = new Error();
                error.status = 400;
                return next(error);
            }

            if (email) {
                body.email = email;
            }
            body.phoneNumber = phone;

            convertDomainsToObjectIdArray(body);

            body.status = body.temp ? PERSONNEL_STATUSES.TEMP._id : PERSONNEL_STATUSES.SENDPASS._id;

            if (body.firstName) {
                body.firstName = {
                    en: _.escape(body.firstName.en),
                    ar: _.escape(body.firstName.ar)
                };
            }
            if (body.lastName) {
                body.lastName = {
                    en: _.escape(body.lastName.en),
                    ar: _.escape(body.lastName.ar)
                };
            }

            if (!body.imageSrc) {
                delete body.imageSrc;
            }

            body.createdBy = createdBy;
            body.editedBy = createdBy;

            personnelModel = new PersonnelModel(body);

            async.waterfall([
                function (waterfallCb) {
                    var query = {
                        $or: []
                    };

                    if (body.email) {
                        query.$or.push({email: body.email});
                    }

                    if (body.phoneNumber) {
                        query.$or.push({phoneNumber: body.phoneNumber});
                    }

                    PersonnelModel.findOne(query, function (err, personnel) {
                        if (err || personnel) {
                            return waterfallCb(err || new Error('Employee with such credentials already exists'));
                        }

                        waterfallCb(null);
                    });
                },
                function (waterfallCb) {
                    personnelModel.save(function (err, personnel) {
                        if (err) {
                            return waterfallCb(err);
                        }

                        event.emit('activityChange', {
                            module    : ACL_MODULES.PERSONNEL,
                            actionType: ACTIVITY_TYPES.CREATED,
                            createdBy : body.createdBy,
                            itemId    : personnel._id,
                            itemType  : CONTENT_TYPES.PERSONNEL
                        });

                        options = {id: personnel._id};

                        waterfallCb(null, options);
                    });
                },
                function (options, waterfallCb) {
                    personnelFindByIdAndPopulate(options, function (err, personnel) {
                        if (err) {
                            return waterfallCb(err);
                        }

                        waterfallCb(null, personnel);
                    });
                }
            ], function (err, personnel) {
                if (err) {
                    return next(err);
                }

                res.status(201).send(personnel);
            });
        }

        access.getWriteAccess(req, ACL_MODULES.PERSONNEL, function (err, allowed) {
            var body = req.body;
            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.PERSONNEL, 'create', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.login = function (req, res, next) {
        var session = req.session;
        var body = req.body;
        var login = body.login;
        var pass = body.pass;
        var query;
        var isEmailValid;
        var isPhoneValid;

        var lastAccess;
        var error;

        var currentLanguage;
        var notAllowedLevelsCMS = [
            ACL_CONSTANTS.SALES_MAN,
            ACL_CONSTANTS.MERCHANDISER,
            ACL_CONSTANTS.CASH_VAN
        ];
        var notAllowedLevelsMobile = [
            ACL_CONSTANTS.MASTER_UPLOADER,
            ACL_CONSTANTS.COUNTRY_UPLOADER
        ];

        var locationsByLevel = {
            2: 'country',
            3: 'region',
            4: 'subRegion',
            5: 'branch',
            6: 'branch',
            7: 'branch',
            9: 'country'
        };

        if (login && login.charAt(0) === '+') {
            login = login.substring(1);
        }

        if (login) {
            isEmailValid = REGEXP.EMAIL_REGEXP.test(login);
            isPhoneValid = REGEXP.PHONE_REGEXP.test(login);
        }

        if (!login || !pass || (!isEmailValid && !isPhoneValid)) {
            error = new Error();
            error.status = 400;

            return next(error);
        }

        login = validator.escape(login);
        login = xssFilters.inHTMLData(login);
        login = login.toLowerCase();

        query = PersonnelModel
            .findOne({
                $or: [{email: login}, {phoneNumber: login}]
            })
            .populate([{path: 'accessRole', select: 'level name'}, {path: 'position', select: 'name'}]);

        query.exec(function (err, personnel) {
            var level;
            var locationField;
            var $setObject;

            if (err) {
                return next(err);
            }

            if (!personnel || !bcrypt.compareSync(pass, personnel.pass)) {
                error = new Error();
                error.status = 401;

                return next(error);
            }

            if (!personnel.confirmed && !personnel.super) {
                error = new Error('Your account is not confirmed. Please check your email or phone.');
                error.status = 400;

                return next(error);
            }

            if (personnel.vacation.onLeave && (personnel.accessRole.level > 4)) {
                error = new Error('You cannot access the app while being on leave');
                error.status = 400;

                return next(error);
            }

            if (personnel.archived) {
                error = new Error('Your account is blocked. Please contact with administration.');
                error.status = 400;

                return next(error);
            }

            level = personnel.accessRole ? personnel.accessRole.level : null;

            if (notAllowedLevelsCMS.indexOf(level) !== -1 && !req.isMobile) {
                error = new Error('You can not login to CMS.');
                error.status = 403;

                return next(error);
            } else if (notAllowedLevelsMobile.indexOf(level) !== -1 && req.isMobile) {
                error = new Error('You can not login from application.');
                error.status = 403;

                return next(error);
            }

            locationField = locationsByLevel[level];

            if (locationField && !personnel[locationField].length) {
                error = new Error('You have no location. Please contact with administration.');
                error.status = 403;

                return next(error);
            }

            session.loggedIn = true;
            session.uId = personnel._id;

            if (personnel.accessRole) {
                session.level = personnel.accessRole.level;
            } else {
                session.level = null;
            }

            session.uName = personnel.login;
            lastAccess = new Date();
            session.lastAccess = lastAccess;

            if (body.rememberMe === 'true') {
                session.rememberMe = true;
            } else {
                delete session.rememberMe;
                session.cookie.expires = false;
            }

            currentLanguage = personnel.currentLanguage || 'en';
            res.cookie('currentLanguage', currentLanguage);

            $setObject = {
                beforeAccess: personnel.lastAccess,
                lastAccess  : lastAccess
            };

            if (personnel.status !== PERSONNEL_STATUSES.ONLEAVE._id) {
                $setObject.status = PERSONNEL_STATUSES.LOGIN._id
            }

            PersonnelModel.findByIdAndUpdate(personnel._id, {
                $set: $setObject
            }, {
                select: {
                    _id         : 1,
                    accessRole  : 1,
                    position    : 1,
                    firstName   : 1,
                    lastName    : 1,
                    lastAccess  : 1,
                    beforeAccess: 1
                }
            }, function (err, result) {
                if (err) {
                    return next(err);
                }

                result.accessRole = personnel.accessRole;
                result.position = personnel.position;

                res.status(200).send(result);
            });

        });
    };

    this.remove = function (req, res, next) {
        var id = req.params.id;
        var error;
        var query;

        //if (req.session.uId === id) {
        //    error = new Error();
        //    error.status = 400;
        //
        //    return next(error);
        //}

        /*access.getDeleteAccess(req, res, next, mid, function (access) {
         if (!access) {
         error = new Error();
         error.status = 403;

         return next(error);
         }*/

        query = PersonnelModel.remove({_id: id});
        query.exec(function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).send();
        });
        /*});*/
    };

    this.deviceId = function (req, res, next) {
        var body = req.body;
        var error;

        if (!req.session.loggedIn) {
            error = new Error();
            error.status = 401;
            error.message = 'Unauthorized';
            return next(error);
        }
        if (!req.isMobile) {
            error = new Error();
            error.status = 400;
            error.message = 'device is not mobile';
            return next(error);
        }
        if (!body.deviceId) {
            error = new Error();
            error.status = 400;
            error.message = 'deviceId is required';
            return next(error);
        }

        req.session.deviceId = body.deviceId;

        res.status(200).send({message: 'OK Set'});
    };

    this.archive = function (req, res, next) {
        function queryRun() {
            var idsToArchive = req.body.ids.objectID();
            var archived = req.body.archived === 'false' ? false : !!req.body.archived;
            var uId = req.session.uId;
            var options = [
                {
                    idsToArchive   : idsToArchive,
                    keyForCondition: '_id',
                    archived       : archived,
                    topArchived    : archived,
                    model          : PersonnelModel
                }
            ];

            archiver.archive(uId, options, function (err) {
                var type = ACTIVITY_TYPES.ARCHIVED;

                if (err) {
                    return next(err);
                }
                if (!req.body.archived) {
                    type = ACTIVITY_TYPES.UNARCHIVED;
                }

                req.body.editedBy = {
                    user: req.session.uId,
                    date: Date.now()
                };

                async.eachSeries(idsToArchive, function (item, callback) {
                    event.emit('activityChange', {
                        module    : 6,
                        actionType: type,
                        createdBy : req.body.editedBy,
                        itemId    : item,
                        itemType  : CONTENT_TYPES.PERSONNEL
                    });
                    callback();

                }, function (err) {
                    if (err) {
                        logWriter.log('personnel archived', err);
                    }
                });

                if (archived) {
                    someEvents.personnelArchived({
                        ids    : idsToArchive,
                        Session: SessionModel
                    });
                }

                res.status(200).send();
            });
        }

        access.getArchiveAccess(req, ACL_MODULES.PERSONNEL, function (err, allowed) {
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

    this.getById = function (req, res, next) {
        var options = {};

        function queryRun() {
            var id = req.params.id || req.session.uId;
            options = {id: id};

            options.isMobile = req.isMobile;

            if (id === req.session.uId) {
                options.isCurrent = true;
            }

            personnelFindByIdAndPopulate(options, function (err, response) {
                if (err) {
                    return next(err);
                }

                if (!Object.keys(response).length) {
                    err = new Error(500);
                    return next(err);
                }

                var key = 'notificationCount' + '#' + response._id;

                redis.cacheStore.readFromStorage(key, function (err, value) {
                    var valueJSON;
                    if (err) {
                        return next(err);
                    }

                    valueJSON = value ? JSON.parse(value) : 0;

                    response.notificationCount = valueJSON;

                    next({status: 200, body: response});
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.PERSONNEL, function (err, allowed) {
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

    function getAllPipeline(options) {
        var isMobile = options.isMobile || false;
        var aggregateHelper = options.aggregateHelper;
        var queryObject = options.queryObject;
        var onLeaveId = options.onLeaveId;
        var translated = options.translated;
        var translateFields = options.translateFields;
        var language = options.language;
        var domainsArray = options.domainsArray;
        var queryObjectAfterLookup = options.queryObjectAfterLookup;
        var searchFieldsArray = options.searchFieldsArray;
        var filterSearch = options.filterSearch;
        var supervisorFilter = +options.supervisorFilter;
        var skip = options.skip;
        var limit = options.limit;
        var sort = options.sort;
        var forSync = options.forSync;
        var pipeLine = [];
        var accessLevels;
        var mobileMatch;
        var queryObjectTemp;

        if (options.level !== 0) {
            queryObject.super = {
                $ne: true
            };
        }

        if (isMobile) {
            if (!queryObject['accessRole.level']) {
                queryObject['accessRole.level'] = {$lt: ACL_CONSTANTS.MASTER_UPLOADER};
            }
        }

        if (options.level > 1 && !isMobile) {
            queryObject._id = queryObject._id || {};
            queryObject._id.$ne = ObjectId(options.uId);
        }

        if (onLeaveId) {
            pipeLine.push({
                $match: {
                    _id: {
                        $ne: ObjectId(onLeaveId)
                    }
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'accessRoles',
            key          : 'accessRole',
            isArray      : false,
            addProjection: 'level'
        }));

        if (!isMobile) {
            if (queryObject.lasMonthEvaluate) {
                queryObject['accessRole.level'] = {
                    $nin: [
                        ACL_CONSTANTS.MASTER_UPLOADER,
                        ACL_CONSTANTS.COUNTRY_UPLOADER,
                        ACL_CONSTANTS.MASTER_ADMIN,
                        ACL_CONSTANTS.COUNTRY_ADMIN
                    ]
                };
            }

            if (queryObject.hasOwnProperty('archived') && (!queryObject.archived || !queryObject.archived.$in[0])) {
                queryObjectTemp = _.omit(queryObject, '_id', 'status', 'lasMonthEvaluate');
                queryObject = _.pick(queryObject, '_id', 'status', 'lasMonthEvaluate');
                queryObject.$or = [queryObjectTemp, {temp: true}];
            }

            pipeLine.push({
                $match: queryObject
            });
        } else {
            pipeLine.push({
                $match: _.pick(queryObject, '$or', 'super', 'accessRole.level')
            });
        }

        if (isMobile) {
            if (queryObject.country) {
                mobileMatch = {
                    $match: {
                        $or: [
                            {
                                country: queryObject.country
                            },
                            {
                                country           : {$eq: []},
                                'accessRole.level': ACL_CONSTANTS.MASTER_ADMIN
                            },
                            {
                                temp: true //TODO, limit by country for mobile
                            }
                        ]

                    }
                };

                pipeLine.push(mobileMatch);
            }
        }

        if (translated && translated.length === 1) {
            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    translated: aggregateHelper.translatedCond(language, translateFields, translated[0])
                })
            });

            pipeLine.push({
                $match: {
                    translated: true
                }
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'positions',
            key    : 'position',
            isArray: false
        }));

        if (supervisorFilter) {
            switch (supervisorFilter) {
                case ACL_CONSTANTS.MASTER_ADMIN:
                    accessLevels = [-1];
                    break;
                case ACL_CONSTANTS.COUNTRY_ADMIN:
                    accessLevels = [ACL_CONSTANTS.MASTER_ADMIN];
                    break;
                case ACL_CONSTANTS.AREA_MANAGER:
                    accessLevels = [
                        ACL_CONSTANTS.MASTER_ADMIN,
                        ACL_CONSTANTS.COUNTRY_ADMIN
                    ];
                    break;
                case ACL_CONSTANTS.AREA_IN_CHARGE:
                    accessLevels = [
                        ACL_CONSTANTS.MASTER_ADMIN,
                        ACL_CONSTANTS.COUNTRY_ADMIN,
                        ACL_CONSTANTS.AREA_MANAGER
                    ];
                    break;
                case ACL_CONSTANTS.SALES_MAN:
                case ACL_CONSTANTS.MERCHANDISER:
                case ACL_CONSTANTS.CASH_VAN:
                    accessLevels = [
                        ACL_CONSTANTS.MASTER_ADMIN,
                        ACL_CONSTANTS.COUNTRY_ADMIN,
                        ACL_CONSTANTS.AREA_MANAGER,
                        ACL_CONSTANTS.AREA_IN_CHARGE
                    ];
                    break;
                case ACL_CONSTANTS.MASTER_UPLOADER:
                    accessLevels = [ACL_CONSTANTS.MASTER_ADMIN];
                    break;
                case ACL_CONSTANTS.COUNTRY_UPLOADER:
                    accessLevels = [
                        ACL_CONSTANTS.MASTER_ADMIN,
                        ACL_CONSTANTS.COUNTRY_ADMIN
                    ];
                    break;
            }

            pipeLine.push({
                $match: {
                    'accessRole.level': {$in: accessLevels}
                }
            });
        }

        domainsArray.forEach(function (element) {
            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from: 'domains',
                key : element
            }));
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from             : 'branches',
            key              : 'branch',
            addMainProjection: ['retailSegment', 'outlet']
        }));

        if (!forSync) {
            pipeLine.push({
                $match: queryObjectAfterLookup
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'retailSegments',
            key : 'retailSegment'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'outlets',
            key : 'outlet'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'createdBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
            includeSiblings: {createdBy: {date: 1}}
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'personnels',
            key            : 'editedBy.user',
            isArray        : false,
            addProjection  : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
            includeSiblings: {editedBy: {date: 1}}
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

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from           : 'accessRoles',
            key            : 'editedBy.user.accessRole',
            isArray        : false,
            addProjection  : ['_id', 'name', 'level'],
            includeSiblings: {
                editedBy: {
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
            key            : 'editedBy.user.position',
            isArray        : false,
            includeSiblings: {
                editedBy: {
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
                avgRating: {
                    monthly: {
                        $let: {
                            vars: {
                                valAdjusted: {
                                    $add: [
                                        '$avgRating.monthly',
                                        {$cond: [{$gte: ['$avgRating.monthly', 0]}, 0.5, -0.5]}
                                    ]
                                }
                            },
                            in  : {
                                $subtract: ['$$valAdjusted', {$mod: ['$$valAdjusted', 1]}]
                            }
                        }
                    }
                }
            })
        });

        pipeLine.push({
            $lookup: {
                from        : 'personnels',
                localField  : 'manager',
                foreignField: '_id',
                as          : 'manager'
            }
        });

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                manager: {$arrayElemAt: ['$manager', 0]}
            })
        });

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                manager: {
                    _id      : '$manager._id',
                    firstName: '$manager.firstName',
                    lastName : '$manager.lastName'
                }
            })
        });

        pipeLine.push({
            $lookup: {
                from        : 'personnels',
                localField  : 'vacation.cover',
                foreignField: '_id',
                as          : 'vacation.cover'
            }
        });

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                vacation: {
                    cover  : {$arrayElemAt: ['$vacation.cover', 0]},
                    onLeave: 1
                }
            })
        });

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                vacation: {
                    cover  : {
                        _id      : '$vacation.cover._id',
                        firstName: '$vacation.cover.firstName',
                        lastName : '$vacation.cover.lastName'
                    },
                    onLeave: 1
                },
                lastDate: {
                    $ifNull: [
                        '$editedBy.date',
                        '$createdBy.date'
                    ]
                }
            })
        });

        pipeLine.push({
            $unwind: {
                path                      : '$country',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeLine.push({
            $group: {
                _id            : '$_id',
                position       : {$first: '$position'},
                avgRating      : {$first: '$avgRating'},
                manager        : {$first: '$manager'},
                lastAccess     : {$first: '$lastAccess'},
                beforeAccess   : {$first: '$beforeAccess'},
                firstName      : {$first: '$firstName'},
                lastName       : {$first: '$lastName'},
                email          : {$first: '$email'},
                phoneNumber    : {$first: '$phoneNumber'},
                accessRole     : {$first: '$accessRole'},
                dateJoined     : {$first: '$dateJoined'},
                createdBy      : {$first: '$createdBy'},
                editedBy       : {$first: '$editedBy'},
                vacation       : {$first: '$vacation'},
                status         : {$first: '$status'},
                region         : {$first: '$region'},
                subRegion      : {$first: '$subRegion'},
                retailSegment  : {$first: '$retailSegment'},
                outlet         : {$first: '$outlet'},
                branch         : {$first: '$branch'},
                country        : {$addToSet: '$country'},
                currentLanguage: {$first: '$currentLanguage'},
                super          : {$first: '$super'},
                archived       : {$first: '$archived'},
                temp           : {$first: '$temp'},
                confirmed      : {$first: '$confirmed'},
                translated     : {$first: '$translated'},
                covered        : {$first: '$covered'}
            }
        });

        if (sort['firstNameUpper.en'] || sort['firstNameUpper.ar']) {
            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    firstNameUpper: {
                        en: {
                            $toUpper: '$firstName.en'
                        },
                        ar: {
                            $toUpper: '$firstName.ar'
                        }
                    }
                })
            });
        }

        if (sort['lastNameUpper.en'] || sort['lastNameUpper.ar']) {
            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    lastNameUpper: {
                        en: {
                            $toUpper: '$lastName.en'
                        },
                        ar: {
                            $toUpper: '$lastName.ar'
                        }
                    }
                })
            });
        }

        /*pipeLine.push({
         $sort: sort
         });

         if (!isMobile) {
         pipeLine.push({
         $match: aggregateHelper.getSearchMatch(searchFieldsArray, filterSearch)
         });
         }

         pipeLine = _.union(pipeLine, aggregateHelper.setTotal());

         if (limit && limit !== -1) {
         pipeLine.push({
         $skip: skip
         });

         pipeLine.push({
         $limit: limit
         });
         }

         pipeLine = _.union(pipeLine, aggregateHelper.groupForUi());*/

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile         : isMobile,
            searchFieldsArray: searchFieldsArray,
            filterSearch     : filterSearch,
            skip             : skip,
            limit            : limit,
            sort             : sort
        }));

        return pipeLine;
    }

    this.getAllForSync = function (req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var isMobile = req.isMobile;
            var filter = query.filter || {};
            var lastLogOut = new Date(query.lastLogOut);
            var filterMapper = new FilterMapper();
            var queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.PERSONNEL,
                filter     : filter,
                personnel  : personnel
            });
            var aggregateHelper = new AggregationHelper($defProjection, queryObject);
            var supervisorFilter = query.supervisorFilter;
            var pipeLine;
            var aggregation;
            var ids;
            var key;
            var splitKey;
            var domainsArray = ['country', 'region', 'subRegion'];
            var sort = query.sort || {
                    lastDate: -1
                };

            for (key in sort) {
                splitKey = key.split('.');
                if (splitKey[0] === 'firstName' || splitKey[0] === 'lastName') {
                    sort[splitKey[0] + 'Upper.' + splitKey[1]] = sort[key];
                    delete sort[key];
                }
            }

            if (query._ids) {
                ids = query._ids.split(',');
                ids = _.map(ids, function (id) {
                    return ObjectId(id);
                });
                queryObject._id = {
                    $in: ids
                };
            }
            aggregateHelper.setSyncQuery(queryObject, lastLogOut);

            pipeLine = getAllPipeline({
                aggregateHelper : aggregateHelper,
                domainsArray    : domainsArray,
                queryObject     : queryObject,
                forSync         : true,
                isMobile        : isMobile,
                sort            : sort,
                level           : req.session.level,
                supervisorFilter: supervisorFilter
            });

            aggregation = PersonnelModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec(function (err, response) {
                if (err) {
                    return next(err);
                }
                var personnelLevel = personnel.accessRole.level;
                var personnelLocation;
                var keyName;
                var options = {
                    data: {}
                };
                var ids;

                response = response && response[0] ? response[0] : {data: [], total: 0};

                ids = _.map(response.data, '_id');

                options.data[CONTENT_TYPES.PERSONNEL] = ids;

                getImagesHelper.getImages(options, function (err, result) {
                    var optionsForImplement = {
                        response  : response,
                        imgsObject: result,
                        fields    : {
                            personnel: []
                        }
                    };
                    getImagesHelper.setIntoResult(optionsForImplement, function (response) {
                        response.data = _.map(response.data, function (element) {
                            if (element.firstName) {
                                element.firstName = {
                                    ar: _.unescape(element.firstName.ar),
                                    en: _.unescape(element.firstName.en)
                                };
                            }
                            if (element.lastName) {
                                element.lastName = {
                                    ar: _.unescape(element.lastName.ar),
                                    en: _.unescape(element.lastName.en)
                                };
                            }

                            return element;
                        });

                        if (req.isMobile) {
                            async.eachLimit(response, 100, function (element, callback) {
                                switch (personnelLevel) {
                                    case ACL_CONSTANTS.COUNTRY_ADMIN:
                                        personnelLocation = personnel.country;
                                        keyName = 'country';
                                        break;
                                    case ACL_CONSTANTS.AREA_MANAGER:
                                        personnelLocation = personnel.region;
                                        keyName = 'region';
                                        break;
                                    case ACL_CONSTANTS.AREA_IN_CHARGE:
                                        personnelLocation = personnel.subRegion;
                                        keyName = 'subRegion';
                                        break;
                                    case ACL_CONSTANTS.SALES_MAN:
                                    case ACL_CONSTANTS.MERCHANDISER:
                                    case ACL_CONSTANTS.CASH_VAN:
                                        personnelLocation = personnel.branch;
                                        keyName = 'branch';
                                        break;
                                }
                                ;

                                if (element.level < personnelLevel || !_.intersection(personnelLocation, element[keyName].length)) {
                                    delete element.avgRating;
                                }
                                callback();
                            }, function (err) {
                                // return res.status(200).send(response);
                                return next({status: 200, body: response});
                            });
                        } else {
                            res.status(200).send(response);
                        }
                    });
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.PERSONNEL, function (err, allowed, personnel) {
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

    this.getAll = function (req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var isMobile = req.isMobile;
            var page = query.page || 1;
            var limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
            var skip = (page - 1) * limit;
            var supervisorFilter = query.supervisorFilter;

            var language = req.cookies.currentLanguage;
            var translateFields = ['firstName', 'lastName'];
            var translated;

            var filterMapper = new FilterMapper();
            var filter = query.filter || {};
            var filterSearch = filter.globalSearch || '';
            var onLeaveId = filter.onLeaveId;

            var queryObject;
            var queryObjectTemp;
            var queryObjectAfterLookup = {};
            var key;
            var splitKey;

            var sort = query.sort || {
                    lastDate: -1
                };

            var aggregateHelper;

            var pipeLine;
            var aggregation;
            var domainsArray = ['country', 'region', 'subRegion'];
            var searchFieldsArray = [
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
                'phoneNumber'
            ];

            for (key in sort) {
                sort[key] = parseInt(sort[key], 10);
                splitKey = key.split('.');
                if (splitKey[0] === 'firstName' || splitKey[0] === 'lastName') {
                    sort[splitKey[0] + 'Upper.' + splitKey[1]] = sort[key];
                    delete sort[key];
                }
            }

            translated = filter.translated ? filter.translated.values : [];

            delete filter.globalSearch;
            delete filter.onLeaveId;
            delete filter.translated;

            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.PERSONNEL,
                filter     : filter,
                personnel  : personnel
            });

            if (isMobile) {
                delete queryObject.region;
                delete queryObject.subRegion;
                delete queryObject.retailSegment;
                delete queryObject.outlet;
                delete queryObject.branch;

                if (queryObject.country) {
                    queryObject.country.$in.push(null);
                }
            }

            aggregateHelper = new AggregationHelper($defProjection, queryObject);

            if (queryObject.retailSegment) {
                queryObjectAfterLookup.retailSegment = queryObject.retailSegment;
                delete queryObject.retailSegment;
            }

            if (queryObject.outlet) {
                queryObjectAfterLookup.outlet = queryObject.outlet;
                delete queryObject.outlet;
            }

            if (!queryObject.hasOwnProperty('archived') && !isMobile) {
                queryObject.archived = false;
            }

            pipeLine = getAllPipeline({
                queryObject           : queryObject,
                onLeaveId             : onLeaveId,
                aggregateHelper       : aggregateHelper,
                translated            : translated,
                translateFields       : translateFields,
                language              : language,
                domainsArray          : domainsArray,
                queryObjectAfterLookup: queryObjectAfterLookup,
                searchFieldsArray     : searchFieldsArray,
                filterSearch          : filterSearch,
                limit                 : limit,
                skip                  : skip,
                sort                  : sort,
                level                 : req.session.level,
                uId                   : req.session.uId,
                isMobile              : isMobile,
                supervisorFilter      : supervisorFilter
            });

            aggregation = PersonnelModel.aggregate(pipeLine);

            aggregation.options = {
                allowDiskUse: true
            };

            aggregation.exec(function (err, response) {
                if (err) {
                    return next(err);
                }
                var personnelLevel = personnel.accessRole.level;
                var personnelLocation;
                var keyName;
                var options = {
                    data: {}
                };
                var ids;

                response = response && response[0] ? response[0] : {data: [], total: 0};

                ids = _.map(response.data, '_id');

                options.data[CONTENT_TYPES.PERSONNEL] = ids;

                getImagesHelper.getImages(options, function (err, result) {
                    var optionsForImplement = {
                        response  : response,
                        imgsObject: result,
                        fields    : {
                            personnel: []
                        }
                    };
                    getImagesHelper.setIntoResult(optionsForImplement, function (response) {
                        response.data = _.map(response.data, function (element) {
                            if (element.firstName) {
                                element.firstName = {
                                    ar: _.unescape(element.firstName.ar),
                                    en: _.unescape(element.firstName.en)
                                };
                            }
                            if (element.lastName) {
                                element.lastName = {
                                    ar: _.unescape(element.lastName.ar),
                                    en: _.unescape(element.lastName.en)
                                };
                            }

                            return element;
                        });

                        if (req.isMobile) {
                            async.eachLimit(response, 100, function (element, callback) {
                                switch (personnelLevel) {
                                    case ACL_CONSTANTS.COUNTRY_ADMIN:
                                        personnelLocation = personnel.country;
                                        keyName = 'country';
                                        break;
                                    case ACL_CONSTANTS.AREA_MANAGER:
                                        personnelLocation = personnel.region;
                                        keyName = 'region';
                                        break;
                                    case ACL_CONSTANTS.AREA_IN_CHARGE:
                                        personnelLocation = personnel.subRegion;
                                        keyName = 'subRegion';
                                        break;
                                    case ACL_CONSTANTS.SALES_MAN:
                                    case ACL_CONSTANTS.MERCHANDISER:
                                    case ACL_CONSTANTS.CASH_VAN:
                                        personnelLocation = personnel.branch;
                                        keyName = 'branch';
                                        break;
                                }

                                if (element.level < personnelLevel || !_.intersection(personnelLocation, element[keyName].length)) {
                                    delete element.avgRating;
                                }
                                callback();
                            }, function (err) {
                                // return res.status(200).send(response);
                                return next({status: 200, body: response});
                            });
                        } else {
                            res.status(200).send(response);
                        }
                    });
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.PERSONNEL, function (err, allowed, personnel) {
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

    this.getPersonnelTasks = function (req, res, next) {
        function queryRun(personnel) {
            var query = req.query;
            var filter = query.filter || {};

            var OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
            var OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;

            var $defProjection = {
                _id              : 1,
                title            : 1,
                companyObjective : 1,
                description      : 1,
                objectiveType    : 1,
                priority         : 1,
                status           : 1,
                assignedTo       : 1,
                complete         : 1,
                parent           : 1,
                level            : 1,
                countSubTasks    : 1,
                completedSubTasks: 1,
                dateStart        : 1,
                dateEnd          : 1,
                dateClosed       : 1,
                comments         : 1,
                attachments      : 1,
                editedBy         : 1,
                createdBy        : 1,
                country          : 1,
                region           : 1,
                subRegion        : 1,
                retailSegment    : 1,
                outlet           : 1,
                branch           : 1,
                location         : 1,
                form             : 1,
                history          : 1,
                efforts          : 1,
                context          : 1,
                creationDate     : 1,
                updateDate       : 1
            };

            var page = query.page || 1;
            var limit = query.count * 1 || parseInt(CONSTANTS.LIST_COUNT, 10);
            var skip = (page - 1) * limit;
            var isMobile = req.isMobile;
            var aggregateHelper;
            var filterMapper = new FilterMapper();
            var filterSearch = filter.globalSearch || '';
            var queryObject;
            var positionFilter = {};
            var ids;
            var uId = req.session.uId;
            var pipeLine;
            var typeFilter;

            var searchFieldsArray = [
                'title.en',
                'title.ar',
                'description.en',
                'description.ar',
                'objectiveType',
                'priority',
                'status',
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
                'createdBy.user.firstName.en',
                'createdBy.user.lastName.en',
                'createdBy.user.firstName.ar',
                'createdBy.user.lastName.ar',
                'createdBy.user.position.name.en',
                'createdBy.user.position.name.ar',
                'assignedTo.firstName.en',
                'assignedTo.lastName.en',
                'assignedTo.firstName.ar',
                'assignedTo.lastName.ar',
                'assignedTo.position.name.ar',
                'assignedTo.position.name.en'
            ];
            delete filter.globalSearch;

            function getAllPipeLine(options) {
                var aggregateHelper = options.aggregateHelper;
                var queryObject = options.queryObject;
                var positionFilter = options.positionFilter;
                var isMobile = options.isMobile;
                var skip = options.skip;
                var limit = options.limit;
                var id = options.id;
                var searchFieldsArray = options.searchFieldsArray;
                var filterSearch = options.filterSearch;
                var forSync = options.forSync;

                var pipeLine = [];

                pipeLine.push({
                    $match: queryObject
                });

                pipeLine.push({
                    $match: {
                        $or: [
                            {
                                assignedTo: {$nin: [id]}
                            },
                            {
                                assignedTo: {$in: [id]},
                                status    : {$nin: [OBJECTIVE_STATUSES.DRAFT]}
                            }
                        ]
                    }
                });

                if (typeFilter) {
                    pipeLine.push({
                        $match: {
                            $and: [
                                {
                                    objectiveType: typeFilter
                                },
                                {
                                    context: {
                                        $in: [CONTENT_TYPES.OBJECTIVES]
                                    }
                                }
                            ]
                        }
                    });
                }

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from         : 'personnels',
                    key          : 'assignedTo',
                    addProjection: ['firstName', 'lastName'].concat(isMobile ? [] : ['position', 'accessRole'])
                }));

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from         : 'files',
                    key          : 'attachments',
                    addProjection: ['contentType', 'originalName', 'createdBy']
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
                    from: 'retailSegments',
                    key : 'retailSegment'
                }));

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from: 'outlets',
                    key : 'outlet'
                }));

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from: 'branches',
                    key : 'branch'
                }));

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from           : 'personnels',
                    key            : 'createdBy.user',
                    isArray        : false,
                    addProjection  : ['_id', 'firstName', 'lastName'].concat(isMobile ? [] : ['position', 'accessRole']),
                    includeSiblings: {createdBy: {date: 1}}
                }));

                pipeLine.push({
                    $unwind: {
                        path                      : '$assignedTo',
                        preserveNullAndEmptyArrays: true
                    }
                });

                if (positionFilter) {
                    pipeLine.push({
                        $match: positionFilter
                    });
                }

                if (!isMobile) {
                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from           : 'accessRoles',
                        key            : 'assignedTo.accessRole',
                        isArray        : false,
                        addProjection  : ['_id', 'name', 'level'],
                        includeSiblings: {
                            assignedTo: {
                                _id      : 1,
                                position : 1,
                                firstName: 1,
                                lastName : 1
                            }
                        }
                    }));

                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from           : 'positions',
                        key            : 'assignedTo.position',
                        isArray        : false,
                        includeSiblings: {
                            assignedTo: {
                                _id       : 1,
                                accessRole: 1,
                                firstName : 1,
                                lastName  : 1
                            }
                        }
                    }));
                }

                pipeLine.push({
                    $group: aggregateHelper.getGroupObject({
                        assignedTo: {$addToSet: '$assignedTo'}
                    })
                });

                if (!isMobile) {
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
                }

                pipeLine.push({
                    $project: aggregateHelper.getProjection({
                        lastDate: {
                            $ifNull: [
                                '$editedBy.date',
                                '$createdBy.date'
                            ]
                        }
                    })
                });

                pipeLine.push({
                    $sort: {
                        lastDate: -1
                    }
                });

                if (isMobile) {
                    pipeLine.push({
                        $project: aggregateHelper.getProjection({
                            creationDate: '$createdBy.date',
                            updateDate  : '$editedBy.date'
                        })
                    });
                }

                if (!forSync) {
                    pipeLine.push({
                        $match: aggregateHelper.getSearchMatch(searchFieldsArray, filterSearch)
                    });
                }

                pipeLine = _.union(pipeLine, aggregateHelper.setTotal());

                if (limit && limit !== -1) {
                    pipeLine.push({
                        $skip: skip
                    });
                    pipeLine.push({
                        $limit: limit
                    });
                }

                pipeLine = _.union(pipeLine, aggregateHelper.groupForUi());

                return pipeLine;
            }

            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.INSTORETASKS,
                filter     : query.filter || {}
            });

            if (query._ids) {
                ids = query._ids.split(',');
                ids = _.map(ids, function (id) {
                    return ObjectId(id);
                });
                queryObject._id = {
                    $in: ids
                };
            }

            if (queryObject.position && queryObject.position.$in) {
                positionFilter = {
                    $or: [
                        {
                            'assignedTo.position': queryObject.position
                        },
                        {
                            'createdBy.user.position': queryObject.position
                        }
                    ]
                };

                delete queryObject.position;
            }

            if (queryObject.objectiveType) {
                typeFilter = queryObject.objectiveType;
                delete queryObject.objectiveType;
            }

            aggregateHelper = new AggregationHelper($defProjection, queryObject);

            pipeLine = getAllPipeLine({
                aggregateHelper  : aggregateHelper,
                queryObject      : queryObject,
                positionFilter   : positionFilter,
                isMobile         : isMobile,
                searchFieldsArray: searchFieldsArray,
                filterSearch     : filterSearch,
                skip             : skip,
                limit            : limit,
                id               : ObjectId(uId)
            });

            db.collection('objectives').aggregate(pipeLine, function (err, response) {
                var idsPersonnel = [];
                var idsFile = [];
                var options = {
                    data: {}
                };
                if (err) {
                    return next(err);
                }

                response = response && response[0] ? response[0] : {data: [], total: 0};

                if (!response.data.length) {
                    return next({status: 200, body: response});
                }

                response.data = _.map(response.data, function (model) {
                    if (model.title) {
                        model.title = {
                            en: model.title.en ? _.unescape(model.title.en) : '',
                            ar: model.title.ar ? _.unescape(model.title.ar) : ''
                        };
                    }
                    if (model.description) {
                        model.description = {
                            en: model.description.en ? _.unescape(model.description.en) : '',
                            ar: model.description.ar ? _.unescape(model.description.ar) : ''
                        };
                    }
                    if (model.companyObjective) {
                        model.companyObjective = {
                            en: model.companyObjective.en ? _.unescape(model.companyObjective.en) : '',
                            ar: model.companyObjective.ar ? _.unescape(model.companyObjective.ar) : ''
                        };
                    }

                    idsFile = _.union(idsFile, _.map(model.attachments, '_id'));
                    idsPersonnel.push(model.createdBy.user._id);
                    idsPersonnel = _.union(idsPersonnel, _.map(model.assignedTo, '_id'));

                    return model;
                });

                idsPersonnel = _.uniqBy(idsPersonnel, 'id');
                options.data[CONTENT_TYPES.PERSONNEL] = idsPersonnel;
                options.data[CONTENT_TYPES.FILES] = idsFile;

                getImagesHelper.getImages(options, function (err, result) {
                    var fieldNames = {};
                    var setOptions;
                    if (err) {
                        return next(err);
                    }

                    setOptions = {
                        response  : response,
                        imgsObject: result
                    };
                    fieldNames[CONTENT_TYPES.PERSONNEL] = [['assignedTo'], 'createdBy.user'];
                    fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
                    setOptions.fields = fieldNames;

                    getImagesHelper.setIntoResult(setOptions, function (response) {
                        next({status: 200, body: response});
                    })
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.PERSONNEL, function (err, allowed, personnel) {
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

    this.update = function (req, res, next) {
        function queryRun(body) {
            var id = req.params.id;
            var currentUserId = req.session.uId;
            var currentLanguage = req.cookies.currentLanguage;

            var pass = generator.generate(8);
            var token = generator.generate();
            var mailer = new Mailer();
            var smsSender = new SMS();
            var salt = bcrypt.genSaltSync(10);
            var hash;
            var messageOptions;
            var error;
            var coveredUserId;
            var waterFallTasks = [];

            var email;
            var isEmailValid;
            var phone;
            var isPhoneValid;

            convertDomainsToObjectIdArray(body);

            if (body.firstName) {
                body.firstName = {
                    en: _.escape(body.firstName.en),
                    ar: _.escape(body.firstName.ar)
                }
            }
            if (body.lastName) {
                body.lastName = {
                    en: _.escape(body.lastName.en),
                    ar: _.escape(body.lastName.ar)
                }
            }

            if (body.oldPass || body.newPass) {
                if (currentUserId !== id) {
                    error = new Error('You can\'t change not own password');
                    error.status = 400;

                    return next(error);
                }
            }

            if (body.lastAccess) {
                body.lastAccess = new Date(body.lastAccess);
            }

            if (body.sendPass && !(body.oldPass || body.newPass)) {
                hash = bcrypt.hashSync(pass, salt);
                body.pass = hash;
                body.token = token;
            }

            if (body.vacation) {
                if (body.vacation.onLeave) {
                    body.status = PERSONNEL_STATUSES.ONLEAVE._id;

                    if (!body.vacation.cover) {
                        body.vacation.cover = null;
                    }
                } else {
                    body.vacation.cover = null;

                    if (body.lastAccess) {
                        body.status = PERSONNEL_STATUSES.LOGIN._id;
                    } else if (body.confirmed) {
                        body.status = PERSONNEL_STATUSES.NEVERLOGIN._id;
                    } else if (body.temp) {
                        body.status = PERSONNEL_STATUSES.TEMP._id;
                    } else {
                        body.status = PERSONNEL_STATUSES.SENDPASS._id;
                    }
                }
            }

            if (body.email) {
                email = body.email;
                isEmailValid = email === '' || false;
            }

            if (body.phoneNumber) {
                phone = body.phoneNumber;
                isPhoneValid = phone === '' || false;
            }
            if (email && !isEmailValid) {
                email = validator.escape(email);
                email = xssFilters.inHTMLData(email);
                email = email.toLowerCase();
                isEmailValid = REGEXP.EMAIL_REGEXP.test(email);
                body.email = email;
            }

            if (phone && !isPhoneValid) {
                phone = validator.escape(phone);
                phone = xssFilters.inHTMLData(phone);
                isPhoneValid = REGEXP.PHONE_REGEXP.test(phone);
                body.phoneNumber = phone;
            }

            if ((email && !isEmailValid) || (phone && !isPhoneValid)) {
                error = new Error('Email/phone validation fail');
                error.status = 400;

                return next(error);
            }

            body.editedBy = {
                user: req.session.uId,
                date: new Date()
            };

            function findById(personnelId, waterFallCb) {
                PersonnelModel
                    .findById(personnelId)
                    .lean()
                    .exec(function (err, model) {
                        var error;
                        var oldAccessRole;

                        if (err) {
                            return waterFallCb(err);
                        }

                        if (!model) {
                            error = new Error('Personnel not found');
                            error.status = 400;

                            return waterFallCb(error);
                        }

                        if (!model.temp) {
                            oldAccessRole = model.accessRole.toString();
                        }

                        if ((body.accessRole && oldAccessRole !== body.accessRole) || body.archived) {
                            someEvents.personnelArchived({
                                ids    : id,
                                Session: SessionModel
                            });
                        }

                        return waterFallCb(null, model);
                    });
            }

            function updateCover(model, callBack) {
                var id = model._id;
                var data = {
                    position : model.position || null,
                    country  : model.country || null,
                    region   : model.region || null,
                    subRegion: model.subRegion || null,
                    branch   : model.branch || null
                };

                PersonnelModel.findByIdAndUpdate(id, data, function (err, result) {
                    if (err) {
                        return callBack(err);
                    }

                    callBack(null, result);
                });
            }

            function updateUsers(model, waterFallCb) {
                var currentUserIdNew = model._id;
                var coverUserId;
                var coverBeforeUserId;
                var error;

                var parallelTasks = {
                    currentUser: function (parallelCb) {
                        if (body.newPass && body.oldPass) {
                            if (bcrypt.compareSync(body.oldPass, model.pass)) {
                                hash = bcrypt.hashSync(body.newPass, salt);
                                body.pass = hash;
                            } else {
                                error = new Error();
                                error.status = 432;

                                return parallelCb(error);
                            }
                        }

                        PersonnelModel.findByIdAndUpdate(currentUserIdNew, body, {new: true}, function (err, updatedModel) {
                            if (err) {
                                return parallelCb(err);
                            }

                            parallelCb(null, updatedModel.toObject());
                        });
                    }
                };

                coverUserId = body.vacation ? body.vacation.cover : null;
                coverBeforeUserId = model.vacation && model.vacation.cover ? model.vacation.cover : null;

                if (coverBeforeUserId && body.vacation) {
                    parallelTasks.coverBeforeUser = function (parallelCb) {
                        PersonnelModel
                            .findById(coverBeforeUserId)
                            .lean()
                            .exec(function (err, resultModel) {
                                if (err) {
                                    consoleLogENV(err);
                                }

                                if (!resultModel.temp) {
                                    event.emit('notOnLeave', {
                                        coveredUserId: coverBeforeUserId.toString()
                                    });

                                    return parallelCb(null, {});
                                }

                                updateCover({
                                    _id: coverBeforeUserId
                                }, function (err, model) {
                                    if (err) {
                                        consoleLogENV(err);
                                    }

                                    coveredUserId = model._id;

                                    event.emit('notOnLeave', {
                                        coveredUserId: coveredUserId
                                    });

                                    parallelCb(null, model);
                                });
                            });
                    };
                }

                if (coverUserId) {
                    parallelTasks.coverUser = function (parallelCb) {
                        PersonnelModel
                            .findById(coverUserId)
                            .lean()
                            .exec(function (err, resultModel) {
                                if (err) {
                                    consoleLogENV(err);
                                }

                                if (!resultModel.temp) {
                                    event.emit('notOnLeave', {
                                        coveredUserId: coverUserId.toString()
                                    });

                                    return parallelCb(null, {});
                                }

                                updateCover({
                                    _id      : coverUserId,
                                    country  : model.country,
                                    region   : model.region,
                                    subRegion: model.subRegion,
                                    branch   : model.branch,
                                    position : model.position
                                }, function (err, model) {
                                    if (err) {
                                        consoleLogENV(err);
                                    }

                                    coveredUserId = model._id;

                                    event.emit('notOnLeave', {
                                        coveredUserId: coveredUserId
                                    });

                                    parallelCb(null, model);
                                });
                            });

                    };
                }

                async.parallel(parallelTasks, function (err, results) {
                    if (err) {
                        return waterFallCb(err);
                    }

                    waterFallCb(null, results.currentUser);
                });
            }

            function getUserForUi(model, waterFallCb) {
                var options = {
                    id: model._id
                };

                personnelFindByIdAndPopulate(options, function (err, personnel) {
                    if (err) {
                        return waterFallCb(err);
                    }

                    if (body.vacation) {
                        event.emit('notOnLeave', {
                            userOnLeave: id
                        });
                    }

                    waterFallCb(null, personnel);
                });
            }

            waterFallTasks.push(async.apply(findById, id));
            waterFallTasks.push(updateUsers);
            waterFallTasks.push(getUserForUi);

            async.waterfall(waterFallTasks, function (err, result) {
                var personnelObject = result;

                if (err) {
                    return next(err);
                }

                if (!body.currentLanguage && !body.newPass) {
                    event.emit('activityChange', {
                        module    : ACL_MODULES.PERSONNEL,
                        actionType: ACTIVITY_TYPES.UPDATED,
                        createdBy : body.editedBy,
                        itemId    : id,
                        itemType  : CONTENT_TYPES.PERSONNEL
                    });
                }

                if (body.sendPass) {
                    messageOptions = {
                        firstName  : personnelObject.firstName,
                        lastName   : personnelObject.lastName,
                        email      : personnelObject.email,
                        phoneNumber: '+' + personnelObject.phoneNumber,
                        password   : pass,
                        token      : personnelObject.token,
                        language   : currentLanguage
                    };

                    if (body.type === 'email') {
                        mailer.confirmNewUserRegistration(messageOptions);

                        res.status(200).send(result);
                    } else {
                        smsSender.sendNewPassword(messageOptions, res, function (err, message) {
                            if (err) {
                                console.dir(err);

                                return next(err);
                            }

                            res.status(200).send(result);
                        });
                    }
                } else {
                    res.status(200).send(result);
                }
            });
        }

        access.getEditAccess(req, ACL_MODULES.PERSONNEL, function (err, allowed) {
            var body = req.body;

            if (err) {
                return next(err);
            }
            if (!allowed) {
                err = new Error();
                err.status = 403;

                return next(err);
            }

            bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.PERSONNEL, 'update', function (err, saveData) {
                if (err) {
                    return next(err);
                }

                queryRun(saveData);
            });
        });
    };

    this.forgotPassword = function (req, res, next) {
        var body = req.body;
        var login = body.login;
        var option = body.ifPhone;
        var forgotToken;
        var error;
        var mailer = new Mailer();
        var smsSender = new SMS();
        var isValid;

        if (option === 'true') {
            isValid = REGEXP.PHONE_REGEXP.test(login);
            forgotToken = generator.generateOnlyNumbersToken(6);
        } else {
            isValid = REGEXP.EMAIL_REGEXP.test(login);
            forgotToken = generator.generate();
        }

        if (!isValid) {
            error = new Error();
            error.status = 400;

            return next(error);
        }

        login = validator.escape(login);
        login = xssFilters.inHTMLData(login);
        login = login.toLowerCase();

        PersonnelModel
            .findOne({
                $or: [{email: login}, {phoneNumber: login}]
            })
            .lean()
            .exec(function (err, result) {
                if (err) {
                    return next(err);
                }

                if (!result) {
                    error = new Error();
                    error.status = 401;

                    return next(error);
                }

                PersonnelModel.findOneAndUpdate(
                    {
                        $or: [{email: login}, {phoneNumber: login}]
                    },
                    {
                        $set: {forgotToken: forgotToken}
                    },
                    {
                        new: true
                    },
                    function (err, result) {
                        if (err) {
                            return next(err);
                        }

                        var resultJSON;
                        var smsOptions;

                        if (result) {
                            if (option === 'true') {
                                resultJSON = result.toJSON();
                                smsOptions = {
                                    phoneNumber: '+' + resultJSON.phoneNumber,
                                    resetCode  : resultJSON.forgotToken
                                };

                                smsSender.forgotPassword(smsOptions, res, function (err, message) {
                                    if (err) {
                                        return next(err);
                                    }
                                });
                            } else {
                                mailer.forgotPassword(result);
                            }
                        }
                        res.status(200).send();
                    });
            });
    };

    this.confirm = function (req, res, next) {
        var token = req.params.token;

        var query = PersonnelModel.findOneAndUpdate({
            token: token
        }, {
            token    : '',
            status   : PERSONNEL_STATUSES.NEVERLOGIN._id,
            confirmed: new Date()
        });

        query.exec(function (err) {
            if (err) {
                return next(err);
            }
            res.redirect(302, process.env.HOST + '/#login/confirmed');
        });
    };

    this.checkVerifCode = function (req, res, next) {
        var body = req.body;
        var phoneNumber = body.phone;
        var code = body.code;
        var error;

        var url = process.env.HOST + '/passwordChange/' + code;

        PersonnelModel.findOne(
            {
                phoneNumber: phoneNumber
            },
            function (err, result) {
                if (err) {
                    return next(err);
                }

                if (!result) {
                    error = new Error();
                    error.status = 400;

                    return next(error);
                }
                if (result.forgotToken !== code) {
                    error = new Error();
                    error.status = 401;

                    return next(error);
                }

                res.status(200).send(url);
            });

    };

    this.changePassword = function (req, res, next) {
        var forgotToken = req.params.forgotToken;
        var currentLanguage;
        var body = req.body;
        var pass = body.pass;
        var message;
        var title;
        var objToSend;
        var url;
        var salt = bcrypt.genSaltSync(10);

        pass = bcrypt.hashSync(pass, salt);

        async.waterfall([updatePass, deleteToken], function (err, result) {
            if (err) {
                return next(err);
            }
            if (result) {
                currentLanguage = result.currentLanguage;
            } else {
                currentLanguage = 'en';
            }
            message = RESPONSES_CONSTANTS.PASSWORD_CHANGE_SUCCESS[currentLanguage];
            title = RESPONSES_CONSTANTS.PASSWORD_CHANGE_TITLE[currentLanguage];
            objToSend = {
                message: message,
                title  : title
            };
            url = process.env.HOST + '/passwordChangeNotification/' + JSON.stringify(objToSend);

            res.status(200).send(url);
        });

        function updatePass(callback) {

            PersonnelModel.findOneAndUpdate(
                {
                    forgotToken: forgotToken
                },
                {
                    $set: {pass: pass}
                },
                {
                    new: true
                },
                function (err, result) {
                    if (err) {
                        return callback(err);
                    }

                    callback(null, result);
                });
        }

        function deleteToken(result, callback) {
            var error;

            if (!result) {
                error = new Error();
                error.status = 400;

                return callback(error);
            }

            PersonnelModel.findOneAndUpdate(
                {
                    forgotToken: forgotToken
                },
                {
                    $set: {forgotToken: ''}
                },
                {
                    new: true
                },
                function (err, result) {
                    if (err) {
                        return callback(err);
                    }

                    callback(null, result);
                });
        }
    };

    this.existSuperAdmin = function (req, res, next) {
        PersonnelModel.findOne({super: true}, function (err, user) {
            if (err) {
                return next(err);
            }

            if (user) {
                res.status(200).send('exist');
            } else {
                res.status(200).send('unExist');
            }
        });
    };
};

module.exports = Personnel;