const ActivityLog = require('./../stories/push-notifications/activityLog');

const PasswordManager = require('./../helpers/passwordManager');
const ObjectiveModel = require('./../types/objective/model');

const Personnel = function () {
    const mongoose = require('mongoose');
    const ACL_CONSTANTS = require('../constants/aclRolesNames');
    const ACL_MODULES = require('../constants/aclModulesNames');
    const RESPONSES_CONSTANTS = require('../constants/responses');
    const CONSTANTS = require('../constants/mainConstants');
    const CONTENT_TYPES = require('../public/js/constants/contentType.js');
    const ERROR_MESSAGES = require('../constants/errorMessages');
    const REGEXP = require('../public/js/constants/validation.js');
    const PERSONNEL_STATUSES = require('../public/js/constants/personnelStatuses.js');
    const validator = require('validator');
    const bcrypt = require('bcryptjs');
    const crypto = require('crypto');
    const access = require('../helpers/access')();
    const generator = require('../helpers/randomPass.js');
    const errorSender = require('../utils/errorSender');
    const mailer = require('../helpers/mailer');
    const smsSender = require('../helpers/smsSender');
    const FilterMapper = require('../helpers/filterMapper');
    const async = require('async');
    const PersonnelModel = require('./../types/personnel/model');
    const AccessRoleModel = require('./../types/accessRole/model');
    const DomainModel = require('./../types/domain/model');
    const BranchModel = require('./../types/branch/model');
    const SessionModel = require('./../types/session/model');
    const xssFilters = require('xss-filters');
    const ObjectId = mongoose.Types.ObjectId;
    const Archiver = require('../helpers/archiver');
    const AggregationHelper = require('../helpers/aggregationCreater');
    const archiver = new Archiver(PersonnelModel);
    const _ = require('lodash');
    const bodyValidator = require('../helpers/bodyValidator');
    const logWriter = require('../helpers/logWriter.js');
    const SomeEvents = require('../helpers/someEvents');
    const someEvents = new SomeEvents();
    const config = require('../config');
    const redisClient = require('../helpers/redisClient');
    const PreviewModel = require('./../stories/preview/model.business');

    const $defProjection = {
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
        editedBy: 1,
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
        dateJoined: 1,
        beforeAccess: 1,
        lasMonthEvaluate: 1,
        covered: 1,
        token: 1,
        imageSrc: 1,
    };

    const convertDomainsToObjectIdArray = function(body) {
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

    const unselectable = function(currentLevel, context, instoreObjective) {
        const obj = {
            1: [],
            2: ['country'],
            3: ['country', 'region'],
            4: ['country', 'region', 'subRegion'],
        };
        let index;
        let value;

        if (instoreObjective) {
            return { $literal: false };
        }

        if (obj[currentLevel]) {
            index = obj[currentLevel].indexOf(context);
            value = false;

            if (index !== -1) {
                value = true;
            }
            return { $literal: value };
        }

        return { $literal: false };
    };

    const personnelFindByIdAndPopulate = (options, callback) => {
        const id = ObjectId(options.id);
        const { isMobile } = options;

        const pipeline = [{
            $match: {
                _id: id,
            },
        }, {
            $lookup: {
                from: 'accessRoles',
                localField: 'accessRole',
                foreignField: '_id',
                as: 'accessRole',
            },
        }, {
            $lookup: {
                from: 'positions',
                localField: 'position',
                foreignField: '_id',
                as: 'position',
            },
        }, {
            $lookup: {
                from: 'domains',
                localField: 'country',
                foreignField: '_id',
                as: 'country',
            },
        }, {
            $addFields: {
                'country.imageSrc': null,
            },
        }, {
            $lookup: {
                from: 'domains',
                localField: 'region',
                foreignField: '_id',
                as: 'region',
            },
        }, {
            $addFields: {
                'region.imageSrc': null,
            },
        }, {
            $lookup: {
                from: 'domains',
                localField: 'subRegion',
                foreignField: '_id',
                as: 'subRegion',
            },
        }, {
            $addFields: {
                'subRegion.imageSrc': null,
            },
        }, {
            $lookup: {
                from: 'branches',
                localField: 'branch',
                foreignField: '_id',
                as: 'branch',
            },
        }, {
            $addFields: {
                'branch.imageSrc': null,
            },
        }, {
            $lookup: {
                from: 'personnels',
                localField: 'createdBy.user',
                foreignField: '_id',
                as: 'createdBy.user',
            },
        }, {
            $lookup: {
                from: 'personnels',
                localField: 'manager',
                foreignField: '_id',
                as: 'manager',
            },
        }, {
            $addFields: {
                pass: null,
                accessRole: {
                    $let: {
                        vars: {
                            accessRole: {
                                $arrayElemAt: ['$accessRole', 0],
                            },
                        },
                        in: {
                            _id: '$$accessRole._id',
                            name: '$$accessRole.name',
                            level: '$$accessRole.level',
                        },
                    },
                },
                position: {
                    $let: {
                        vars: {
                            position: {
                                $arrayElemAt: ['$position', 0],
                            },
                        },
                        in: {
                            _id: '$$position._id',
                            name: '$$position.name',
                        },
                    },
                },
                'createdBy.user': {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: '$createdBy.user',
                            }, 0],
                        },
                        then: {
                            $let: {
                                vars: {
                                    createdBy: {
                                        $arrayElemAt: ['$createdBy.user', 0],
                                    },
                                },
                                in: {
                                    _id: '$$createdBy._id',
                                    firstName: '$$createdBy.firstName',
                                    lastName: '$$createdBy.lastName',
                                    accessRole: '$$createdBy.accessRole',
                                    position: '$$createdBy.position',
                                },
                            },
                        },
                        else: null,
                    },
                },
                manager: {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: '$manager',
                            }, 0],
                        },
                        then: {
                            $let: {
                                vars: {
                                    manager: {
                                        $arrayElemAt: ['$manager', 0],
                                    },
                                },
                                in: {
                                    _id: '$$manager._id',
                                    firstName: '$$manager.firstName',
                                    lastName: '$$manager.lastName',
                                    accessRole: '$$manager.accessRole',
                                    position: '$$manager.position',
                                },
                            },
                        },
                        else: null,
                    },
                },
            },
        }, {
            $lookup: {
                from: 'personnels',
                localField: '_id',
                foreignField: 'vacation.cover',
                as: 'covered',
            },
        }, {
            $addFields: {
                covered: {
                    $map: {
                        input: '$covered',
                        as: 'item',
                        in: {
                            _id: '$$item._id',
                            firstName: '$$item.firstName',
                            lastName: '$$item.lastName',
                            accessRole: '$$item.accessRole',
                            position: '$$item.position',
                            onLeave: '$$item.vacation.onLeave',
                        },
                    },
                },
            },
        }, {
            $lookup: {
                from: 'personnels',
                localField: 'vacation.cover',
                foreignField: '_id',
                as: 'cover',
            },
        }, {
            $addFields: {
                cover: {
                    $cond: {
                        if: {
                            $gt: [{
                                $size: '$cover',
                            }, 0],
                        },
                        then: {
                            $let: {
                                vars: {
                                    cover: {
                                        $arrayElemAt: ['$cover', 0],
                                    },
                                },
                                in: {
                                    _id: '$$cover._id',
                                    firstName: '$$cover.firstName',
                                    lastName: '$$cover.lastName',
                                    position: '$$cover.position',
                                    accessRole: '$$cover.accessRole',
                                    onLeave: '$$cover.vacation.onLeave',
                                },
                            },
                        },
                        else: null,
                    },
                },
            },
        }, {
            $addFields: {
                'vacation.cover': '$cover',
            },
        }];

        PersonnelModel.aggregate(pipeline)
            .exec((err, result) => {
                if (err) {
                    return callback(err);
                }

                const personnel = result.length > 0 ?
                    result.slice().pop() : {};

                /*
                * warning: mobile app accepts set Personnel
                *          but CMS accepts Object with keys which are Personnel ID
                *          and as value covered Personnel
                * */
                if (!isMobile && personnel.covered) {
                    personnel.covered = _.keyBy(personnel.covered, covered => covered._id.toString());
                }

                callback(null, personnel);
            });
    };

    this.getForDD = function(req, res, next) {
        function queryRun() {
            const query = req.query;
            const queryObject = query || {};

            if (queryObject.outlet) {
                queryObject.outlet = ObjectId(queryObject.outlet);
            }

            PersonnelModel.find(queryObject, '_id firstName lastName fullName phoneNumber email').exec((err, result) => {
                if (err) {
                    return next(err);
                }
                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.PERSONNEL, (err, allowed) => {
            if (err) {
                return next(err);
            }
            if (!allowed) {
                return errorSender.forbidden(next);
            }

            queryRun();
        });
    };

    this.getForTree = function(req, res, next) {
        function queryRun() {
            const query = req.query;
            const currentLevel = req.session.level;
            let level;
            const queryObject = query || {};
            const pipeLine = [];
            const $matchObject = {};
            let aggregation;
            const aggregateHelper = new AggregationHelper($defProjection);
            const currentLanguage = queryObject.currentLanguage;
            const pipeArray = [];
            let element;
            let error;
            const instoreObjective = req.query.instoreObjective;

            if (!queryObject.ids || !(queryObject.ids instanceof Array) || !currentLanguage) {
                return errorSender.badRequest(next, ERROR_MESSAGES.NOT_ENOUGH_PARAMS);
            }

            async.waterfall([

                function(cb) {
                    PersonnelModel
                        .findById(queryObject.ids[0])
                        .populate([{
                            path: 'accessRole',
                            select: 'level',
                        }])
                        .exec((err, personnelModel) => {
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

                            if (level === ACL_CONSTANTS.AREA_IN_CHARGE && personnelModel.get('branch') && personnelModel.get('branch').length) {
                                level = ACL_CONSTANTS.SALES_MAN;
                            }

                            cb(null, level);
                        });
                },

                function(level, cb) {
                    if (level === ACL_CONSTANTS.MASTER_ADMIN) {
                        return cb(null, []);
                    }

                    // show all tree for level > 4
                    if (level > ACL_CONSTANTS.SALES_MAN) {
                        level = ACL_CONSTANTS.SALES_MAN;
                    }

                    queryObject.ids = queryObject.ids.objectID();

                    $matchObject._id = { $in: queryObject.ids };

                    pipeLine.push({
                        $match: $matchObject,
                    });

                    pipeLine.push({
                        $unwind: {
                            path: '$country',
                            preserveNullAndEmptyArrays: true,
                        },
                    });

                    pipeLine.push({
                        $unwind: {
                            path: '$region',
                            preserveNullAndEmptyArrays: true,
                        },
                    });

                    pipeLine.push({
                        $unwind: {
                            path: '$subRegion',
                            preserveNullAndEmptyArrays: true,
                        },
                    });

                    pipeLine.push({
                        $unwind: {
                            path: '$branch',
                            preserveNullAndEmptyArrays: true,
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
                        $project: aggregateHelper.getProjection({
                            country: {
                                _id: { $arrayElemAt: ['$country._id', 0] },
                                title: { $arrayElemAt: [`$country.name.${currentLanguage}`, 0] },
                                expanded: { $literal: true },
                                selected: { $literal: false },
                                unselectable: unselectable(currentLevel, 'country', instoreObjective),
                                contentType: { $literal: 'country' },
                                key: { $arrayElemAt: ['$country._id', 0] },
                            },
                        }),
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
                        $project: aggregateHelper.getProjection({
                            region: {
                                _id: { $arrayElemAt: ['$region._id', 0] },
                                title: { $arrayElemAt: [`$region.name.${currentLanguage}`, 0] },
                                expanded: { $literal: true },
                                selected: { $literal: false },
                                unselectable: unselectable(currentLevel, 'region', instoreObjective),
                                contentType: { $literal: 'region' },
                                key: { $arrayElemAt: ['$region._id', 0] },
                            },
                        }),
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
                        $project: aggregateHelper.getProjection({
                            subRegion: {
                                _id: { $arrayElemAt: ['$subRegion._id', 0] },
                                title: { $arrayElemAt: [`$subRegion.name.${currentLanguage}`, 0] },
                                expanded: { $literal: true },
                                selected: { $literal: false },
                                unselectable: unselectable(currentLevel, 'subRegion', instoreObjective),
                                contentType: { $literal: 'subRegion' },
                                key: { $arrayElemAt: ['$subRegion._id', 0] },
                            },
                        }),
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
                        $project: aggregateHelper.getProjection({
                            branch: {
                                _id: { $arrayElemAt: ['$branch._id', 0] },
                                title: { $arrayElemAt: [`$branch.name.${currentLanguage}`, 0] },
                                expanded: { $literal: true },
                                selected: { $literal: false },
                                contentType: { $literal: 'branch' },
                                key: { $arrayElemAt: ['$branch._id', 0] },
                            },
                            retailSegment: { $arrayElemAt: ['$branch.retailSegment', 0] },
                            outlet: { $arrayElemAt: ['$branch.outlet', 0] },
                        }),
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
                        $project: aggregateHelper.getProjection({
                            retailSegment: {
                                _id: { $arrayElemAt: ['$retailSegment._id', 0] },
                                title: { $arrayElemAt: [`$retailSegment.name.${currentLanguage}`, 0] },
                                expanded: { $literal: true },
                                selected: { $literal: false },
                                contentType: { $literal: 'retailSegment' },
                                key: { $arrayElemAt: ['$retailSegment._id', 0] },
                            },
                        }),
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
                        $project: aggregateHelper.getProjection({
                            outlet: {
                                _id: { $arrayElemAt: ['$outlet._id', 0] },
                                title: { $arrayElemAt: [`$outlet.name.${currentLanguage}`, 0] },
                                expanded: { $literal: true },
                                selected: { $literal: false },
                                contentType: { $literal: 'outlet' },
                                key: { $arrayElemAt: ['$outlet._id', 0] },
                            },
                        }),
                    });

                    pipeLine.push({
                        $unwind: {
                            path: '$country',
                            preserveNullAndEmptyArrays: true,
                        },
                    });

                    pipeLine.push({
                        $unwind: {
                            path: '$region',
                            preserveNullAndEmptyArrays: true,
                        },
                    });

                    pipeLine.push({
                        $unwind: {
                            path: '$subRegion',
                            preserveNullAndEmptyArrays: true,
                        },
                    });

                    pipeLine.push({
                        $unwind: {
                            path: '$retailSegment',
                            preserveNullAndEmptyArrays: true,
                        },
                    });

                    pipeLine.push({
                        $unwind: {
                            path: '$outlet',
                            preserveNullAndEmptyArrays: true,
                        },
                    });

                    pipeLine.push({
                        $unwind: {
                            path: '$branch',
                            preserveNullAndEmptyArrays: true,
                        },
                    });

                    //= ============add some conditions for tree===========

                    pipeArray.push({
                        $group: {
                            _id: '$country._id',
                            title: { $first: '$country.title' },
                            expanded: { $first: '$country.expanded' },
                            selected: { $first: '$country.selected' },
                            unselectable: { $first: '$country.unselectable' },
                            contentType: { $first: '$country.contentType' },
                            key: { $first: '$country.key' },
                            children: {
                                $addToSet: {
                                    _id: '$region._id',
                                    title: '$region.title',
                                    expanded: '$region.expanded',
                                    selected: '$region.selected',
                                    unselectable: '$region.unselectable',
                                    contentType: '$region.contentType',
                                    key: '$region.key',
                                    children: '$children',
                                },
                            },
                        },
                    });

                    pipeArray.push({
                        $group: {
                            _id: '$region._id',
                            region: { $first: '$region' },
                            country: { $first: '$country' },
                            children: {
                                $addToSet: {
                                    _id: '$subRegion._id',
                                    title: '$subRegion.title',
                                    expanded: '$subRegion.expanded',
                                    selected: '$subRegion.selected',
                                    unselectable: '$subRegion.unselectable',
                                    contentType: '$subRegion.contentType',
                                    key: '$subRegion.key',
                                    children: '$children',
                                },
                            },
                        },
                    });

                    pipeArray.push({
                        $group: {
                            _id: '$subRegion._id',
                            subRegion: { $first: '$subRegion' },
                            country: { $first: '$country' },
                            region: { $first: '$region' },
                            children: {
                                $addToSet: {
                                    _id: '$retailSegment._id',
                                    title: '$retailSegment.title',
                                    expanded: '$retailSegment.expanded',
                                    selected: '$retailSegment.selected',
                                    contentType: '$retailSegment.contentType',
                                    key: '$retailSegment.key',
                                    children: '$children',
                                },
                            },
                        },
                    });

                    pipeArray.push({
                        $group: {
                            _id: '$retailSegment._id',
                            retailSegment: { $first: '$retailSegment' },
                            country: { $first: '$country' },
                            region: { $first: '$region' },
                            subRegion: { $first: '$subRegion' },
                            children: {
                                $addToSet: {
                                    _id: '$outlet._id',
                                    title: '$outlet.title',
                                    expanded: '$outlet.expanded',
                                    selected: '$outlet.selected',
                                    contentType: '$outlet.contentType',
                                    key: '$outlet.key',
                                    children: '$children',
                                },
                            },
                        },
                    });

                    pipeArray.push({
                        $group: {
                            _id: '$outlet._id',
                            outlet: { $first: '$outlet' },
                            country: { $first: '$country' },
                            region: { $first: '$region' },
                            subRegion: { $first: '$subRegion' },
                            retailSegment: { $first: '$retailSegment' },
                            children: {
                                $addToSet: {
                                    _id: '$branch._id',
                                    title: '$branch.title',
                                    expanded: '$branch.expanded',
                                    selected: '$branch.selected',
                                    contentType: '$branch.contentType',
                                    key: '$branch.key',
                                },
                            },
                        },
                    });

                    //= =============================

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
                        allowDiskUse: true,
                    };

                    aggregation.exec((err, result) => {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, result);
                    });
                },

            ], (err, result) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.PERSONNEL, (err, allowed) => {
            if (err) {
                return next(err);
            }
            if (!allowed) {
                return errorSender.forbidden(next);
            }

            queryRun();
        });
    };

    this.getStatusForDD = function(req, res, next) {
        function queryRun() {
            PersonnelModel.distinct('status', '_id firstName lastName fullName phoneNumber email').exec((err, result) => {
                if (err) {
                    return next(err);
                }
                res.status(200).send(result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.PERSONNEL, (err, allowed) => {
            if (err) {
                return next(err);
            }

            if (!allowed) {
                return errorSender.forbidden(next);
            }

            queryRun();
        });
    };

    this.createSuper = function(req, res, next) {
        const body = req.body;
        const password = body.pass;

        let email = body.email;
        let isEmailValid = false;

        if (email) {
            isEmailValid = REGEXP.EMAIL_REGEXP.test(email);
        }

        if (!isEmailValid) {
            return errorSender.badRequest(next, ERROR_MESSAGES.EMAIL_IS_NOT_VALID);
        }

        email = validator.escape(email);
        email = xssFilters.inHTMLData(email);

        const createdBy = {
            user: req.session.uId,
            date: new Date(),
        };
        const salt = bcrypt.genSaltSync(10);
        const su = {
            firstName: { en: 'Super' },
            lastName: { en: 'Admin' },
            email: email.toLowerCase(),
            super: true,
            createdBy,
            editedBy: createdBy,
            token: generator.generate(),
            status: PERSONNEL_STATUSES.INACTIVE._id,
            pass: bcrypt.hashSync(password, salt),
        };

        PersonnelModel.findOne({ super: true }, (err, result) => {
            if (err) {
                return res.status(400).send('Query is invalid');
            }

            if (result) {
                return res.status(400).send('Admin already exists');
            }

            async.waterfall([

                (cb) => {
                    AccessRoleModel.findOne({
                        level: 0,
                    }, cb);
                },

                (accessRole, cb) => {
                    if (!accessRole) {
                        return cb('Super access role not existing.');
                    }

                    su.accessRole = accessRole._id;

                    const personnelModel = new PersonnelModel();

                    personnelModel.set(su);
                    personnelModel.save((err, model, numAffected) => {
                        cb(err, model);
                    });
                },

                // SU only one, email should be sent in waterfall
                (personnelModel, cb) => {
                    const personnel = personnelModel.toJSON();
                    const options = {
                        firstName: personnel.firstName,
                        lastName: personnel.lastName,
                        password,
                        email: personnel.email,
                    };
                    const personnelId = personnel._id;

                    mailer.confirmNewUserRegistration(options, (err) => {
                        if (err) {
                            return next(err);
                        }

                        cb(null, personnelId);
                    });
                },

            ], (err, personnelId) => {
                if (err) {
                    return next(err);
                }

                res.status(201).send(personnelId);
            });
        });
    };

    this.create = function(req, res, next) {
        const body = req.body;
        const accessLevel = req.session.level;
        const uId = req.session.uId;
        const isMobile = req.isMobile;

        function queryRun(body, callback) {
            let phone = body.phoneNumber;
            let isPhoneValid = phone === '' || false;
            const createdBy = {
                user: req.session.uId,
                date: new Date(),
            };
            let email;
            let isEmailValid;

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

            if ((/*! email &&*/ !phone) /* || !isEmailValid */ || !isPhoneValid) {
                const error = new Error();

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
                    ar: _.escape(body.firstName.ar),
                };
            }
            if (body.lastName) {
                body.lastName = {
                    en: _.escape(body.lastName.en),
                    ar: _.escape(body.lastName.ar),
                };
            }

            const imageSrc = body.imageSrc;

            delete body.imageSrc;

            body.createdBy = createdBy;
            body.editedBy = createdBy;

            async.waterfall([

                (cb) => {
                    const query = {
                        $or: [],
                    };

                    if (body.email) {
                        query.$or.push({ email: body.email });
                    }

                    if (body.phoneNumber) {
                        query.$or.push({ phoneNumber: body.phoneNumber });
                    }

                    PersonnelModel.findOne(query, cb);
                },

                (personnel, cb) => {
                    if (personnel) {
                        return res.status(400).send('User with such credentials already exist');
                    }

                    const personnelModel = new PersonnelModel();

                    personnelModel.set(body);
                    personnelModel.save((err, model, numAffected) => {
                        cb(err, model);
                    });
                },

                (personnel, cb) => {
                    const personnelId = personnel._id;

                    ActivityLog.emit('personnel:created', {
                        actionOriginator: uId,
                        accessRoleLevel: accessLevel,
                        body: personnel.toJSON(),
                    });

                    PreviewModel.setNewPreview({
                        model: personnel,
                        base64: imageSrc,
                        contentType: CONTENT_TYPES.PERSONNEL,
                    }, (err) => {
                        if (err) {
                            return cb(err);
                        }

                        const options = {
                            id: personnelId,
                            isMobile,
                        };

                        cb(null, options);
                    });
                },

                (options, cb) => {
                    personnelFindByIdAndPopulate(options, cb);
                },

            ], callback);
        }

        async.waterfall([

            async.apply(access.getWriteAccess, req, ACL_MODULES.PERSONNEL),

            (allowed, personnel, cb) => {
                bodyValidator.validateBody(body, accessLevel, CONTENT_TYPES.PERSONNEL, 'create', cb);
            },

            queryRun,

        ], (err, personnel) => {
            if (err) {
                return next(err);
            }

            res.status(201).send(personnel);
        });
    };

    this.login = function(req, res, next) {
        const session = req.session;
        const body = req.body;

        let login = body.login;
        const password = body.pass;

        if (login && login.charAt(0) === '+') {
            login = login.substring(1);
        }

        let isEmailValid;
        let isPhoneValid;

        if (login) {
            isEmailValid = REGEXP.EMAIL_REGEXP.test(login);
            isPhoneValid = REGEXP.PHONE_REGEXP.test(login);
        }

        if (!login || !password || (!isEmailValid && !isPhoneValid)) {
            return errorSender.badRequest(next, ERROR_MESSAGES.INCORRECT_USERNAME_OR_PASSWORD);
        }

        login = validator.escape(login);
        login = xssFilters.inHTMLData(login);
        login = login.toLowerCase();

        const genericPipeline = [{
            $project: {
                email: 1,
                mobileNumber: 1,
                pass: 1,
                super: 1,
                confirmed: 1,
                archived: 1,
                vacation: 1,
                accessRole: 1,
                position: 1,
            },
        }, {
            $lookup: {
                from: 'accessRoles',
                localField: 'accessRole',
                foreignField: '_id',
                as: 'accessRole',
            },
        }, {
            $unwind: {
                path: '$accessRole',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from: 'positions',
                localField: 'position',
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
                email: 1,
                mobileNumber: 1,
                pass: 1,
                super: 1,
                confirmed: 1,
                archived: 1,
                vacation: 1,
                'accessRole.level': 1,
                'accessRole.name': 1,
                'position.name': 1,
            },
        }];

        async.waterfall([

            (cb) => {
                const pipeline = [{
                    $match: {
                        $and: [{
                            $or: [{
                                email: login,
                            }, {
                                phoneNumber: login,
                            }],
                        }, {
                            archived: false,
                        }],
                    },
                }, ...genericPipeline];

                PersonnelModel.aggregate(pipeline).exec(cb);
            },

            (result, cb) => {
                if (!result.length) {
                    return errorSender.badRequest(next, ERROR_MESSAGES.INCORRECT_USERNAME_OR_PASSWORD);
                }

                if (result.length > 1) {
                    return errorSender.badRequest(next, ERROR_MESSAGES.USERS_WITH_SAME_LOGIN);
                }

                const personnel = result.length ?
                    result.slice().pop() : {};

                if (!personnel || !bcrypt.compareSync(password, personnel.pass)) {
                    return errorSender.notAuthorized(next, ERROR_MESSAGES.INCORRECT_USERNAME_OR_PASSWORD);
                }

                if (!personnel.confirmed && !personnel.super) {
                    return errorSender.badRequest(next, ERROR_MESSAGES.ACCOUNT_IS_NOT_CONFIRMED);
                }

                if (personnel.archived) {
                    return errorSender.badRequest(next, ERROR_MESSAGES.ACCOUNT_IS_BLOCKED);
                }

                const level = personnel.accessRole ? personnel.accessRole.level : null;

                const notAllowedLevelsCMS = [
                    ACL_CONSTANTS.SALES_MAN,
                    ACL_CONSTANTS.MERCHANDISER,
                    ACL_CONSTANTS.CASH_VAN,
                ];
                const notAllowedLevelsMobile = [
                    ACL_CONSTANTS.MASTER_UPLOADER,
                    ACL_CONSTANTS.COUNTRY_UPLOADER,
                ];

                if (notAllowedLevelsCMS.indexOf(level) !== -1 && !req.isMobile) {
                    return errorSender.forbidden(next, ERROR_MESSAGES.FORBIDDEN_LOGIN_TO_CMS);
                } else if (notAllowedLevelsMobile.indexOf(level) !== -1 && req.isMobile) {
                    return errorSender.forbidden(next, ERROR_MESSAGES.FORBIDDEN_LOGIN_FROM_APP);
                }

                const locationsByLevel = {
                    2: 'country',
                    3: 'region',
                    4: 'subRegion',
                    5: 'branch',
                    6: 'branch',
                    7: 'branch',
                    9: 'country',
                };

                const locationField = locationsByLevel[level];

                if (locationField && personnel[locationField] && !personnel[locationField].length) {
                    return errorSender.forbidden(next, ERROR_MESSAGES.USER_LOCATION_IS_NOT_SPECIFIED);
                }

                const onLeave = personnel.vacation.onLeave;

                session.loggedIn = true;
                session.uId = personnel._id;
                session.onLeave = onLeave;

                if (personnel.accessRole) {
                    session.level = personnel.accessRole.level;
                } else {
                    session.level = null;
                }

                session.uName = personnel.login;

                const lastAccess = new Date();

                session.lastAccess = lastAccess;

                if (body.rememberMe === 'true') {
                    session.rememberMe = true;
                } else {
                    delete session.rememberMe;
                }

                const currentLanguage = personnel.currentLanguage || 'en';

                res.cookie('currentLanguage', currentLanguage);

                const update = {
                    beforeAccess: personnel.lastAccess,
                    lastAccess,
                };

                if (personnel.status !== PERSONNEL_STATUSES.ONLEAVE._id) {
                    update.status = PERSONNEL_STATUSES.LOGIN._id;
                }

                // Salesman, Merchandiser and Cash Van ca\'t access app during vacation
                if (onLeave && [
                    ACL_CONSTANTS.SALES_MAN,
                    ACL_CONSTANTS.MERCHANDISER,
                    ACL_CONSTANTS.CASH_VAN,
                ].indexOf(level) > -1) {
                    return errorSender.badRequest(next, ERROR_MESSAGES.ERROR_ACCESS_DENIED_MESSAGE);
                }

                PersonnelModel.findByIdAndUpdate(personnel._id, update, { new: true })
                    .select({ _id: 1 })
                    .lean()
                    .exec(cb);
            },

            (personnel, cb) => {
                const pipeline = [{
                    $match: {
                        _id: personnel._id,
                    },
                }, ...genericPipeline];

                PersonnelModel.aggregate(pipeline).exec(cb);
            },

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            const personnel = result.length ?
                result.slice().pop() : {};

            personnel.pass = null;

            res.status(200).send(personnel);
        });
    };

    this.remove = function(req, res, next) {
        const id = req.params.id;
        let error;
        let query;

        // if (req.session.uId === id) {
        //    error = new Error();
        //    error.status = 400;
        //
        //    return next(error);
        // }

        /* access.getDeleteAccess(req, res, next, mid, function (access) {
         if (!access) {
         error = new Error();
         error.status = 403;

         return next(error);
         }*/

        query = PersonnelModel.remove({ _id: id });
        query.exec((err) => {
            if (err) {
                return next(err);
            }

            res.status(200).send();
        });
        /* });*/
    };

    this.deviceId = function(req, res, next) {
        const { body } = req;

        if (!req.session.loggedIn) {
            return errorSender.notAuthorized(next);
        }

        if (!req.isMobile) {
            return errorSender.badRequest(next);
        }

        if (!body.deviceId) {
            return errorSender.badRequest(next, ERROR_MESSAGES.NOT_VALID_PARAMS);
        }

        req.session.deviceId = body.deviceId;

        res.status(200).send({ message: 'OK Set' });
    };

    this.archive = function(req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        const queryRun = (callback) => {
            const setIdToArchive = req.body.ids.objectID();
            const archived = req.body.archived === 'false' ? false : !!req.body.archived;
            const options = [{
                idsToArchive: setIdToArchive,
                keyForCondition: '_id',
                archived,
                topArchived: archived,
                model: PersonnelModel,
            }];
            const activityType = archived ? 'archived' : 'unarchived';

            async.waterfall([

                (cb) => {
                    archiver.archive(userId, options, cb);
                },

                (done, cb) => {
                    callback();

                    PersonnelModel.find({
                        _id: {
                            $in: setIdToArchive,
                        },
                    }).lean().exec(cb);
                },

                (setPersonnel, cb) => {
                    async.each(setPersonnel, (personnel, eachCb) => {
                        ActivityLog.emit(`personnel:${activityType}`, {
                            actionOriginator: userId,
                            accessRoleLevel,
                            body: personnel,
                        });
                        eachCb();
                    }, cb);
                },

            ]);
        };

        async.waterfall([

            (cb) => {
                access.getArchiveAccess(req, ACL_MODULES.PERSONNEL, cb);
            },

            (personnel, allowed, cb) => {
                queryRun(cb);
            },

        ], (err) => {
            if (err) {
                return next(err);
            }

            res.status(200).send({});
        });
    };

    this.getById = function(req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const isMobile = req.isMobile;

        const queryRun = (callback) => {
            const requestedId = req.params.id;
            const actualId = requestedId || userId;
            const options = {
                id: actualId,
                isMobile,
            };

            async.waterfall([

                (cb) => {
                    personnelFindByIdAndPopulate(options, cb);
                },

                (personnel, cb) => {
                    const onLeave = req.session.onLeave;

                    if (personnel.vacation.onLeave !== onLeave) {
                        session.onLeave = !onLeave;
                    }

                    personnel.workAccess = (personnel.accessRole.level < 3) || !personnel.vacation.onLeave;

                    async.waterfall([

                        (cb) => {
                            const pipeline = [{
                                $project: {
                                    _id: 1,
                                    'name.en': 1,
                                    'name.ar': 1,
                                    type: 1,
                                    parent: 1,
                                },
                            }, {
                                $group: {
                                    _id: null,
                                    setDomain: {
                                        $push: '$$ROOT',
                                    },
                                },
                            }, {
                                $project: {
                                    setDomain: 1,
                                    setCountry: {
                                        $let: {
                                            vars: {
                                                setCountry: personnel.country,
                                            },
                                            in: {
                                                $cond: {
                                                    if: {
                                                        $gt: [{
                                                            $size: '$$setCountry',
                                                        }, 0],
                                                    },
                                                    then: '$$setCountry',
                                                    else: {
                                                        $filter: {
                                                            input: '$setDomain',
                                                            as: 'item',
                                                            cond: {
                                                                $eq: ['$$item.type', 'country'],
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            }, {
                                $project: {
                                    setDomain: 1,
                                    setCountry: 1,
                                    setRegion: {
                                        $let: {
                                            vars: {
                                                setRegion: personnel.region,
                                            },
                                            in: {
                                                $cond: {
                                                    if: {
                                                        $gt: [{
                                                            $size: '$$setRegion',
                                                        }, 0],
                                                    },
                                                    then: '$$setRegion',
                                                    else: {
                                                        $let: {
                                                            vars: {
                                                                setId: '$setCountry._id',
                                                            },
                                                            in: {
                                                                $filter: {
                                                                    input: '$setDomain',
                                                                    as: 'item',
                                                                    cond: {
                                                                        $and: [{
                                                                            $eq: ['$$item.type', 'region'],
                                                                        }, {
                                                                            $setIsSubset: [['$$item.parent'], '$$setId'],
                                                                        }],
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            }, {
                                $project: {
                                    setDomain: 1,
                                    setCountry: 1,
                                    setRegion: 1,
                                    setSubRegion: {
                                        $let: {
                                            vars: {
                                                setSubRegion: personnel.subRegion,
                                            },
                                            in: {
                                                $cond: {
                                                    if: {
                                                        $gt: [{
                                                            $size: '$$setSubRegion',
                                                        }, 0],
                                                    },
                                                    then: '$$setSubRegion',
                                                    else: {
                                                        $let: {
                                                            vars: {
                                                                setId: '$setRegion._id',
                                                            },
                                                            in: {
                                                                $filter: {
                                                                    input: '$setDomain',
                                                                    as: 'item',
                                                                    cond: {
                                                                        $and: [{
                                                                            $eq: ['$$item.type', 'subRegion'],
                                                                        }, {
                                                                            $setIsSubset: [['$$item.parent'], '$$setId'],
                                                                        }],
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            }, {
                                $project: {
                                    setCountry: {
                                        _id: 1,
                                        name: 1,
                                    },
                                    setRegion: {
                                        _id: 1,
                                        name: 1,
                                    },
                                    setSubRegion: {
                                        _id: 1,
                                        name: 1,
                                    },
                                },
                            }];

                            DomainModel.aggregate(pipeline)
                                .exec(cb);
                        },

                        (result, cb) => {
                            const {
                                setCountry,
                                setRegion,
                                setSubRegion,
                            } = result.length > 0 ?
                                result.slice().pop() : {};

                            personnel.country = setCountry;
                            personnel.region = setRegion;
                            personnel.subRegion = setSubRegion;

                            cb(null);
                        },

                        (cb) => {
                            const $match = {};
                            const setBranchId = personnel.branch.map(item => item._id);
                            const setSubRegionId = personnel.subRegion.map(item => item._id);

                            if (personnel.branch.length) {
                                $match.$and = [{
                                    _id: {
                                        $in: setBranchId,
                                    },
                                }, {
                                    subRegion: {
                                        $in: setSubRegionId,
                                    },
                                }];
                            } else {
                                $match.subRegion = {
                                    $in: setSubRegionId,
                                };
                            }

                            const pipeline = [{
                                $match,
                            }, {
                                $project: {
                                    'name.en': 1,
                                    'name.ar': 1,
                                    retailSegment: 1,
                                    outlet: 1,
                                },
                            }, {
                                $group: {
                                    _id: null,
                                    setBranch: {
                                        $push: {
                                            _id: '$_id',
                                            name: {
                                                en: '$name.en',
                                                ar: '$name.ar',
                                            },
                                        },
                                    },
                                    setRetailSegment: {
                                        $addToSet: '$retailSegment',
                                    },
                                    setOutlet: {
                                        $addToSet: '$outlet',
                                    },
                                },
                            }, {
                                $project: {
                                    setBranch: 1,
                                    setRetailSegment: {
                                        $filter: {
                                            input: '$setRetailSegment',
                                            as: 'item',
                                            cond: {
                                                $ne: ['$$item', null],
                                            },
                                        },
                                    },
                                    setOutlet: {
                                        $filter: {
                                            input: '$setOutlet',
                                            as: 'item',
                                            cond: {
                                                $ne: ['$$item', null],
                                            },
                                        },
                                    },
                                },
                            }, {
                                $lookup: {
                                    from: 'retailSegments',
                                    localField: 'setRetailSegment',
                                    foreignField: '_id',
                                    as: 'setRetailSegment',
                                },
                            }, {
                                $project: {
                                    setBranch: 1,
                                    setRetailSegment: {
                                        _id: 1,
                                        name: {
                                            en: 1,
                                            ar: 1,
                                        },
                                    },
                                    setOutlet: 1,
                                },
                            }, {
                                $lookup: {
                                    from: 'outlets',
                                    localField: 'setOutlet',
                                    foreignField: '_id',
                                    as: 'setOutlet',
                                },
                            }, {
                                $project: {
                                    setBranch: 1,
                                    setRetailSegment: 1,
                                    setOutlet: {
                                        _id: 1,
                                        name: {
                                            en: 1,
                                            ar: 1,
                                        },
                                    },
                                },
                            }];

                            BranchModel.aggregate(pipeline).exec(cb);
                        },

                        (result, cb) => {
                            const groups = result.length ?
                                result.slice().pop() : [{
                                    setBranch: [],
                                    setRetailSegment: [],
                                    setOutlet: [],
                                }];

                            personnel.branch = groups.setBranch;
                            personnel.retailSegment = groups.setRetailSegment;
                            personnel.outlet = groups.setOutlet;

                            cb(null, personnel);
                        },

                    ], cb);
                },

            ], callback);
        };

        async.waterfall([

            (cb) => {
                access.getReadAccess(req, ACL_MODULES.PERSONNEL, cb);
            },

            (allowed, personnel, cb) => {
                queryRun(cb);
            },

        ], (err, personnel) => {
            if (err) {
                return next(err);
            }

            next({
                status: 200,
                body: personnel,
            });
        });
    };

    function getAllPipeline(options) {
        const isMobile = options.isMobile || false;
        const aggregateHelper = options.aggregateHelper;
        let queryObject = options.queryObject;
        const onLeaveId = options.onLeaveId;
        const translated = options.translated;
        const translateFields = options.translateFields;
        const language = options.language;
        const domainsArray = options.domainsArray;
        const queryObjectAfterLookup = options.queryObjectAfterLookup;
        const searchFieldsArray = options.searchFieldsArray;
        const filterSearch = options.filterSearch;
        const supervisorFilter = +options.supervisorFilter;
        const skip = options.skip;
        const limit = options.limit;
        const sort = options.sort;
        const forSync = options.forSync;
        let pipeLine = [];
        let accessLevels;
        let mobileMatch;
        let queryObjectTemp;

        if (options.level !== 0) {
            queryObject.super = {
                $ne: true,
            };
        }

        // commented according to QP-175 ticket in youTrack
        // if (isMobile) {
        //     if (!queryObject['accessRole.level']) {
        //         queryObject['accessRole.level'] = {$lt : ACL_CONSTANTS.MASTER_UPLOADER};
        //     }
        // }

        if (options.level > 1 && !isMobile) {
            queryObject._id = queryObject._id || {};
            queryObject._id.$ne = ObjectId(options.uId);
        }

        if (onLeaveId) {
            pipeLine.push({
                $match: {
                    _id: {
                        $ne: ObjectId(onLeaveId),
                    },
                },
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'accessRoles',
            key: 'accessRole',
            isArray: false,
            addProjection: 'level',
        }));

        if (!isMobile) {
            if (queryObject.lasMonthEvaluate) {
                queryObject['accessRole.level'] = {
                    $nin: [
                        ACL_CONSTANTS.MASTER_UPLOADER,
                        ACL_CONSTANTS.COUNTRY_UPLOADER,
                        ACL_CONSTANTS.MASTER_ADMIN,
                        ACL_CONSTANTS.COUNTRY_ADMIN,
                    ],
                };
            }

            if (queryObject.hasOwnProperty('archived') && (!queryObject.archived || !queryObject.archived.$in[0])) {
                queryObjectTemp = _.omit(queryObject, '_id', 'status', 'lasMonthEvaluate');
                queryObject = _.pick(queryObject, '_id', 'status', 'lasMonthEvaluate');
                queryObject.$or = [queryObjectTemp, { temp: true }];
            }

            pipeLine.push({
                $match: queryObject,
            });
        } else {
            pipeLine.push({
                $match: _.pick(queryObject, '$or', 'super', 'accessRole.level'),
            });
        }

        if (isMobile) {
            if (queryObject.country) {
                mobileMatch = {
                    $match: {
                        $or: [
                            {
                                country: queryObject.country,
                            },
                            {
                                country: { $eq: [] },
                                'accessRole.level': { $in: [ACL_CONSTANTS.MASTER_ADMIN, ACL_CONSTANTS.TRADE_MARKETER] },
                            },
                            {
                                temp: true, // TODO, limit by country for mobile
                            },
                        ],

                    },
                };

                pipeLine.push(mobileMatch);
            }
        }

        if (translated && translated.length === 1) {
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
                        ACL_CONSTANTS.COUNTRY_ADMIN,
                    ];
                    break;
                case ACL_CONSTANTS.AREA_IN_CHARGE:
                    accessLevels = [
                        ACL_CONSTANTS.MASTER_ADMIN,
                        ACL_CONSTANTS.COUNTRY_ADMIN,
                        ACL_CONSTANTS.AREA_MANAGER,
                    ];
                    break;
                case ACL_CONSTANTS.SALES_MAN:
                case ACL_CONSTANTS.MERCHANDISER:
                case ACL_CONSTANTS.CASH_VAN:
                    accessLevels = [
                        ACL_CONSTANTS.MASTER_ADMIN,
                        ACL_CONSTANTS.COUNTRY_ADMIN,
                        ACL_CONSTANTS.AREA_MANAGER,
                        ACL_CONSTANTS.AREA_IN_CHARGE,
                    ];
                    break;
                case ACL_CONSTANTS.MASTER_UPLOADER:
                    accessLevels = [ACL_CONSTANTS.MASTER_ADMIN];
                    break;
                case ACL_CONSTANTS.COUNTRY_UPLOADER:
                    accessLevels = [
                        ACL_CONSTANTS.MASTER_ADMIN,
                        ACL_CONSTANTS.COUNTRY_ADMIN,
                    ];
                    break;
            }

            pipeLine.push({
                $match: {
                    'accessRole.level': { $in: accessLevels },
                },
            });
        }

        domainsArray.forEach((element) => {
            pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                from: 'domains',
                key: element,
            }));
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'branches',
            key: 'branch',
            addMainProjection: ['retailSegment', 'outlet'],
        }));

        if (!forSync) {
            pipeLine.push({
                $match: queryObjectAfterLookup,
            });
        }

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
            addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
            includeSiblings: { createdBy: { date: 1 } },
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'personnels',
            key: 'editedBy.user',
            isArray: false,
            addProjection: ['_id', 'firstName', 'lastName', 'position', 'accessRole', 'imageSrc'],
            includeSiblings: { editedBy: { date: 1 } },
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'accessRoles',
            key: 'createdBy.user.accessRole',
            isArray: false,
            addProjection: ['_id', 'name', 'level'],
            includeSiblings: {
                createdBy: {
                    date: 1,
                    user: {
                        _id: 1,
                        position: 1,
                        firstName: 1,
                        lastName: 1,
                        imageSrc: 1,
                    },
                },
            },
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'positions',
            key: 'createdBy.user.position',
            isArray: false,
            includeSiblings: {
                createdBy: {
                    date: 1,
                    user: {
                        _id: 1,
                        accessRole: 1,
                        firstName: 1,
                        lastName: 1,
                        imageSrc: 1,
                    },
                },
            },
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'accessRoles',
            key: 'editedBy.user.accessRole',
            isArray: false,
            addProjection: ['_id', 'name', 'level'],
            includeSiblings: {
                editedBy: {
                    date: 1,
                    user: {
                        _id: 1,
                        position: 1,
                        firstName: 1,
                        lastName: 1,
                        imageSrc: 1,
                    },
                },
            },
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'positions',
            key: 'editedBy.user.position',
            isArray: false,
            includeSiblings: {
                editedBy: {
                    date: 1,
                    user: {
                        _id: 1,
                        accessRole: 1,
                        firstName: 1,
                        lastName: 1,
                        imageSrc: 1,
                    },
                },
            },
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
                                        { $cond: [{ $gte: ['$avgRating.monthly', 0] }, 0.5, -0.5] },
                                    ],
                                },
                            },
                            in: {
                                $subtract: ['$$valAdjusted', { $mod: ['$$valAdjusted', 1] }],
                            },
                        },
                    },
                },
            }),
        });

        pipeLine.push({
            $lookup: {
                from: 'personnels',
                localField: 'manager',
                foreignField: '_id',
                as: 'manager',
            },
        });

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                manager: { $arrayElemAt: ['$manager', 0] },
            }),
        });

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                manager: {
                    _id: '$manager._id',
                    firstName: '$manager.firstName',
                    lastName: '$manager.lastName',
                    imageSrc: '$manager.imageSrc',
                },
            }),
        });

        pipeLine.push({
            $lookup: {
                from: 'personnels',
                localField: 'vacation.cover',
                foreignField: '_id',
                as: 'vacation.cover',
            },
        });

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                vacation: {
                    cover: { $arrayElemAt: ['$vacation.cover', 0] },
                    onLeave: 1,
                },
            }),
        });

        pipeLine.push({
            $project: aggregateHelper.getProjection({
                vacation: {
                    cover: {
                        _id: '$vacation.cover._id',
                        firstName: '$vacation.cover.firstName',
                        lastName: '$vacation.cover.lastName',
                        imageSrc: '$vacation.cover.imageSrc',
                    },
                    onLeave: 1,
                },
                lastDate: {
                    $ifNull: [
                        '$editedBy.date',
                        '$createdBy.date',
                    ],
                },
            }),
        });

        pipeLine.push({
            $unwind: {
                path: '$country',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeLine.push({
            $group: {
                _id: '$_id',
                position: { $first: '$position' },
                avgRating: { $first: '$avgRating' },
                manager: { $first: '$manager' },
                lastAccess: { $first: '$lastAccess' },
                beforeAccess: { $first: '$beforeAccess' },
                firstName: { $first: '$firstName' },
                lastName: { $first: '$lastName' },
                email: { $first: '$email' },
                phoneNumber: { $first: '$phoneNumber' },
                accessRole: { $first: '$accessRole' },
                dateJoined: { $first: '$dateJoined' },
                createdBy: { $first: '$createdBy' },
                editedBy: { $first: '$editedBy' },
                vacation: { $first: '$vacation' },
                status: { $first: '$status' },
                region: { $first: '$region' },
                subRegion: { $first: '$subRegion' },
                retailSegment: { $first: '$retailSegment' },
                outlet: { $first: '$outlet' },
                branch: { $first: '$branch' },
                country: { $addToSet: '$country' },
                currentLanguage: { $first: '$currentLanguage' },
                super: { $first: '$super' },
                archived: { $first: '$archived' },
                temp: { $first: '$temp' },
                confirmed: { $first: '$confirmed' },
                translated: { $first: '$translated' },
                covered: { $first: '$covered' },
                imageSrc: { $first: '$imageSrc' },
            },
        });

        if (sort['firstNameUpper.en'] || sort['firstNameUpper.ar']) {
            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    firstNameUpper: {
                        en: {
                            $toUpper: '$firstName.en',
                        },
                        ar: {
                            $toUpper: '$firstName.ar',
                        },
                    },
                }),
            });
        }

        if (sort['lastNameUpper.en'] || sort['lastNameUpper.ar']) {
            pipeLine.push({
                $project: aggregateHelper.getProjection({
                    lastNameUpper: {
                        en: {
                            $toUpper: '$lastName.en',
                        },
                        ar: {
                            $toUpper: '$lastName.ar',
                        },
                    },
                }),
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile,
            searchFieldsArray,
            filterSearch,
            skip,
            limit,
            sort,
        }));

        return pipeLine;
    }

    function finalStepToRetrieve(options, callback) {
        const pipeline = options.pipeline;
        const personnelLevel = options.personnelLevel;
        const isMobile = options.isMobile;
        const personnel = options.personnel;

        async.waterfall([

            (cb) => {
                PersonnelModel.aggregate(pipeline).exec(cb);
            },

            (result, cb) => {
                const body = result && result[0] ?
                    result[0] : { data: [], total: 0 };

                body.data.forEach(element => {
                    if (element.firstName) {
                        element.firstName = {
                            ar: _.unescape(element.firstName.ar),
                            en: _.unescape(element.firstName.en),
                        };
                    }

                    if (element.lastName) {
                        element.lastName = {
                            ar: _.unescape(element.lastName.ar),
                            en: _.unescape(element.lastName.en),
                        };
                    }
                });

                cb(null, body);
            },

        ], callback);
    }

    this.getAllForSync = function(req, res, next) {
        function queryRun(personnel, callback) {
            const query = req.query;
            const isMobile = req.isMobile;
            const filter = query.filter || {};
            const lastLogOut = new Date(query.lastLogOut);
            const supervisorFilter = query.supervisorFilter;
            const personnelLevel = personnel.accessRole.level;
            const sort = query.sort || {
                lastDate: -1,
            };
            const domainsArray = ['country', 'region', 'subRegion'];

            for (const key in sort) {
                sort[key] = parseInt(sort[key], 10);
                const splitKey = key.split('.');

                if (splitKey[0] === 'firstName' || splitKey[0] === 'lastName') {
                    sort[`${splitKey[0]}Upper.${splitKey[1]}`] = sort[key];
                    delete sort[key];
                }
            }

            const filterMapper = new FilterMapper();
            const queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.PERSONNEL,
                filter,
                personnel,
            });

            if (query._ids) {
                const ids = query._ids.split(',')
                    .map((id) => {
                        return ObjectId(id);
                    });

                queryObject._id = {
                    $in: ids,
                };
            }

            const aggregateHelper = new AggregationHelper($defProjection, queryObject);

            aggregateHelper.setSyncQuery(queryObject, lastLogOut);

            const pipeline = getAllPipeline({
                aggregateHelper,
                domainsArray,
                queryObject,
                forSync: true,
                isMobile,
                sort,
                level: req.session.level,

            });

            finalStepToRetrieve({
                pipeline,
                personnelLevel,
                isMobile,
                personnel,
            }, callback);
        }

        async.waterfall([

            async.apply(access.getReadAccess, req, ACL_MODULES.PERSONNEL),

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

    this.getAll = function(req, res, next) {
        function queryRun(personnel, onlineUsers, callback) {
            const query = req.query;
            const isMobile = req.isMobile;
            const filter = query.filter || {};
            const page = query.page || 1;
            const limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
            const skip = (page - 1) * limit;
            const supervisorFilter = query.supervisorFilter;
            const personnelLevel = personnel.accessRole.level;
            const language = req.cookies.currentLanguage;
            const translateFields = ['firstName', 'lastName'];
            const filterSearch = filter.globalSearch || '';
            const onLeaveId = filter.onLeaveId;
            const queryObjectAfterLookup = {};
            const sort = query.sort || {
                lastDate: -1,
            };
            const domainsArray = ['country', 'region', 'subRegion'];
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
            ];

            for (const key in sort) {
                sort[key] = parseInt(sort[key], 10);
                const splitKey = key.split('.');

                if (splitKey[0] === 'firstName' || splitKey[0] === 'lastName') {
                    sort[`${splitKey[0]}Upper.${splitKey[1]}`] = sort[key];
                    delete sort[key];
                }
            }

            const translated = filter.translated ? filter.translated.values : [];

            delete filter.globalSearch;
            delete filter.onLeaveId;
            delete filter.translated;

            const filterMapper = new FilterMapper();
            const queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.PERSONNEL,
                filter,
                personnel,
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

            if (queryObject.retailSegment) {
                queryObjectAfterLookup.retailSegment = queryObject.retailSegment;
                delete queryObject.retailSegment;
            }

            if (queryObject.outlet) {
                queryObjectAfterLookup.outlet = queryObject.outlet;
                delete queryObject.outlet;
            }

            const onLeave = queryObject.status && queryObject.status.$in && ~queryObject.status.$in.indexOf('onLeave') && queryObject.status.$in.length === 1;

            if (queryObject.status && queryObject.status.$in && !onLeave) {
                const onlineUserIds = onlineUsers.map(el => ObjectId(el));
                const onlineStatus = queryObject.status.$in.indexOf('online');

                if (queryObject.status.$in.length === 1 && ~onlineStatus) {
                    queryObject.status = {
                        $ne: 'onLeave',
                    };
                    queryObject._id = {
                        $in: onlineUserIds,
                    };
                } else if (!~onlineStatus) {
                    queryObject._id = {
                        $nin: onlineUserIds,
                    };
                } else {
                    queryObject.status.$in.splice(onlineStatus, 1);
                    queryObject.$or = [{ _id: {
                        $in: onlineUserIds,
                    } }, {
                        status: queryObject.status,
                    }];

                    delete queryObject.status;
                }
            }

            if (!queryObject.hasOwnProperty('archived') && !isMobile) {
                queryObject.archived = false;
            }

            const aggregateHelper = new AggregationHelper($defProjection, queryObject);
            const pipeline = getAllPipeline({
                queryObject,
                onLeaveId,
                aggregateHelper,
                translated,
                translateFields,
                language,
                domainsArray,
                queryObjectAfterLookup,
                searchFieldsArray,
                filterSearch,
                limit,
                skip,
                sort,
                level: req.session.level,
                uId: req.session.uId,
                isMobile,
                supervisorFilter,
            });

            finalStepToRetrieve({
                pipeline,
                personnelLevel,
                isMobile,
                personnel,
            }, (err, body) => {
                if (err) {
                    return callback(err);
                }

                body.data.forEach((el) => {
                    if (el.status !== 'onLeave' && ~onlineUsers.indexOf(el._id.toString())) {
                        el.status = 'online';
                    }
                });

                if (sort && sort.status) {
                    body.data.sort((a, b) => {
                        function compareField(elA, elB) {
                            if (elA.status > elB.status) {
                                return 1;
                            } else if (elA.status < elB.status) {
                                return -1;
                            }
                            return 0;
                        }

                        if (sort.status === 1) {
                            return compareField(a, b);
                        }

                        return compareField(b, a);
                    });
                }

                callback(null, body);
            });
        }

        function defineOnlineUsers(allowed, personnel, callback) {
            redisClient.cacheStore.getValuesStorageHash('online', (err, onlineUsers) => {
                if (err) {
                    return callback(err);
                }

                callback(null, personnel, onlineUsers);
            });
        }

        async.waterfall([

            async.apply(access.getReadAccess, req, ACL_MODULES.PERSONNEL),
            defineOnlineUsers,
            queryRun,
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

    this.getPersonnelTasks = function(req, res, next) {
        function queryRun(personnel) {
            const query = req.query;
            const filter = query.filter || {};

            const OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
            const OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;

            const $defProjection = {
                _id: 1,
                title: 1,
                companyObjective: 1,
                description: 1,
                objectiveType: 1,
                priority: 1,
                status: 1,
                assignedTo: 1,
                complete: 1,
                parent: 1,
                level: 1,
                countSubTasks: 1,
                completedSubTasks: 1,
                dateStart: 1,
                dateEnd: 1,
                dateClosed: 1,
                comments: 1,
                attachments: 1,
                editedBy: 1,
                createdBy: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                location: 1,
                form: 1,
                history: 1,
                efforts: 1,
                context: 1,
                creationDate: 1,
                updateDate: 1,
                imageSrc: 1,
            };

            const page = query.page || 1;
            const limit = query.count * 1 || parseInt(CONSTANTS.LIST_COUNT, 10);
            const skip = (page - 1) * limit;
            const isMobile = req.isMobile;
            let aggregateHelper;
            const filterMapper = new FilterMapper();
            const filterSearch = filter.globalSearch || '';
            let queryObject;
            let positionFilter = {};
            let ids;
            const uId = req.session.uId;
            let pipeLine;
            let typeFilter;

            const searchFieldsArray = [
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
                'assignedTo.position.name.en',
            ];
            delete filter.globalSearch;

            function getAllPipeLine(options) {
                const aggregateHelper = options.aggregateHelper;
                const queryObject = options.queryObject;
                const positionFilter = options.positionFilter;
                const isMobile = options.isMobile;
                const skip = options.skip;
                const limit = options.limit;
                const id = options.id;
                const searchFieldsArray = options.searchFieldsArray;
                const filterSearch = options.filterSearch;
                const forSync = options.forSync;

                let pipeLine = [];

                pipeLine.push({
                    $match: queryObject,
                });

                pipeLine.push({
                    $match: {
                        $or: [
                            {
                                assignedTo: { $nin: [id] },
                            },
                            {
                                assignedTo: { $in: [id] },
                                status: { $nin: [OBJECTIVE_STATUSES.DRAFT] },
                            },
                        ],
                    },
                });

                if (typeFilter) {
                    pipeLine.push({
                        $match: {
                            $and: [
                                {
                                    objectiveType: typeFilter,
                                },
                                {
                                    context: {
                                        $in: [CONTENT_TYPES.OBJECTIVES],
                                    },
                                },
                            ],
                        },
                    });
                }

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from: 'personnels',
                    key: 'assignedTo',
                    addProjection: ['firstName', 'lastName', 'imageSrc'].concat(isMobile ? [] : ['position', 'accessRole']),
                }));

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from: 'files',
                    key: 'attachments',
                    addProjection: ['contentType', 'originalName', 'createdBy', 'preview'],
                }));

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from: 'domains',
                    key: 'country',
                }));

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from: 'domains',
                    key: 'region',
                }));

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from: 'domains',
                    key: 'subRegion',
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
                    from: 'branches',
                    key: 'branch',
                }));

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from: 'personnels',
                    key: 'createdBy.user',
                    isArray: false,
                    addProjection: ['_id', 'firstName', 'lastName', 'imageSrc'].concat(isMobile ? [] : ['position', 'accessRole']),
                    includeSiblings: { createdBy: { date: 1 } },
                }));

                pipeLine.push({
                    $unwind: {
                        path: '$assignedTo',
                        preserveNullAndEmptyArrays: true,
                    },
                });

                if (positionFilter) {
                    pipeLine.push({
                        $match: positionFilter,
                    });
                }

                if (!isMobile) {
                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from: 'accessRoles',
                        key: 'assignedTo.accessRole',
                        isArray: false,
                        addProjection: ['_id', 'name', 'level'],
                        includeSiblings: {
                            assignedTo: {
                                _id: 1,
                                position: 1,
                                firstName: 1,
                                lastName: 1,
                                imageSrc: 1,
                            },
                        },
                    }));

                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from: 'positions',
                        key: 'assignedTo.position',
                        isArray: false,
                        includeSiblings: {
                            assignedTo: {
                                _id: 1,
                                accessRole: 1,
                                firstName: 1,
                                lastName: 1,
                                imageSrc: 1,
                            },
                        },
                    }));
                }

                pipeLine.push({
                    $group: aggregateHelper.getGroupObject({
                        assignedTo: { $addToSet: '$assignedTo' },
                    }),
                });

                if (!isMobile) {
                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from: 'accessRoles',
                        key: 'createdBy.user.accessRole',
                        isArray: false,
                        addProjection: ['_id', 'name', 'level'],
                        includeSiblings: {
                            createdBy: {
                                date: 1,
                                user: {
                                    _id: 1,
                                    position: 1,
                                    firstName: 1,
                                    lastName: 1,
                                    imageSrc: 1,
                                },
                            },
                        },
                    }));

                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from: 'positions',
                        key: 'createdBy.user.position',
                        isArray: false,
                        includeSiblings: {
                            createdBy: {
                                date: 1,
                                user: {
                                    _id: 1,
                                    accessRole: 1,
                                    firstName: 1,
                                    lastName: 1,
                                    imageSrc: 1,
                                },
                            },
                        },
                    }));
                }

                pipeLine.push({
                    $project: aggregateHelper.getProjection({
                        lastDate: {
                            $ifNull: [
                                '$editedBy.date',
                                '$createdBy.date',
                            ],
                        },
                    }),
                });

                pipeLine.push({
                    $sort: {
                        lastDate: -1,
                    },
                });

                if (isMobile) {
                    pipeLine.push({
                        $project: aggregateHelper.getProjection({
                            creationDate: '$createdBy.date',
                            updateDate: '$editedBy.date',
                        }),
                    });
                }

                if (!forSync) {
                    pipeLine.push({
                        $match: aggregateHelper.getSearchMatch(searchFieldsArray, filterSearch),
                    });
                }

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

                return pipeLine;
            }

            queryObject = filterMapper.mapFilter({
                contentType: CONTENT_TYPES.INSTORETASKS,
                filter: query.filter || {},
            });

            if (query._ids) {
                ids = query._ids.split(',');
                ids = _.map(ids, (id) => {
                    return ObjectId(id);
                });
                queryObject._id = {
                    $in: ids,
                };
            }

            if (queryObject.position && queryObject.position.$in) {
                positionFilter = {
                    $or: [
                        {
                            'assignedTo.position': queryObject.position,
                        },
                        {
                            'createdBy.user.position': queryObject.position,
                        },
                    ],
                };

                delete queryObject.position;
            }

            if (queryObject.objectiveType) {
                typeFilter = queryObject.objectiveType;
                delete queryObject.objectiveType;
            }

            aggregateHelper = new AggregationHelper($defProjection, queryObject);

            pipeLine = getAllPipeLine({
                aggregateHelper,
                queryObject,
                positionFilter,
                isMobile,
                searchFieldsArray,
                filterSearch,
                skip,
                limit,
                id: ObjectId(uId),
            });

            ObjectiveModel.aggregate(pipeLine, (err, result) => {
                if (err) {
                    return next(err);
                }

                const body = result.length ?
                    result[0] : { data: [], total: 0 };

                body.data.forEach(model => {
                    if (model.title) {
                        model.title = {
                            en: model.title.en ? _.unescape(model.title.en) : '',
                            ar: model.title.ar ? _.unescape(model.title.ar) : '',
                        };
                    }

                    if (model.description) {
                        model.description = {
                            en: model.description.en ? _.unescape(model.description.en) : '',
                            ar: model.description.ar ? _.unescape(model.description.ar) : '',
                        };
                    }

                    if (model.companyObjective) {
                        model.companyObjective = {
                            en: model.companyObjective.en ? _.unescape(model.companyObjective.en) : '',
                            ar: model.companyObjective.ar ? _.unescape(model.companyObjective.ar) : '',
                        };
                    }
                });

                next({
                    status: 200,
                    body,
                });
            });
        }

        access.getReadAccess(req, ACL_MODULES.PERSONNEL, (err, allowed, personnel) => {
            if (err) {
                return next(err);
            }

            if (!allowed) {
                return errorSender.forbidden(next);
            }

            queryRun(personnel);
        });
    };

    this.update = function(req, res, next) {
        const personnelId = req.params.id;
        const body = req.body;
        const accessLevel = req.session.level;
        const currentUserId = req.session.uId;
        const currentLanguage = req.cookies.currentLanguage;
        const coveredUsers = [];
        const isMobile = req.isMobile;
        let coverUserId;
        let generatedPassword;

        function queryRun(body, callback) {
            convertDomainsToObjectIdArray(body);

            if (body.firstName) {
                body.firstName = {
                    en: _.escape(body.firstName.en),
                    ar: _.escape(body.firstName.ar),
                };
            }
            if (body.lastName) {
                body.lastName = {
                    en: _.escape(body.lastName.en),
                    ar: _.escape(body.lastName.ar),
                };
            }

            if (body.oldPass || body.newPass) {
                if (currentUserId !== personnelId) {
                    const error = new Error('You can\'t change not own password');

                    error.status = 400;
                    return callback(error);
                }
            }

            if (body.lastAccess) {
                body.lastAccess = new Date(body.lastAccess);
            }

            if (body.sendPass && !(body.oldPass || body.newPass)) {
                generatedPassword = PasswordManager.generatePassword();

                const hash = PasswordManager.encryptPasswordSync(generatedPassword);
                const token = generator.generate();

                body.pass = hash;
                body.token = token;
            }

            if (body.vacation) {
                if (body.vacation.onLeave) {
                    body.status = PERSONNEL_STATUSES.ONLEAVE._id;

                    req.session.onLeave = true;

                    if (!body.vacation.cover) {
                        body.vacation.cover = null;

                        req.session.onLeave = false;
                    }
                } else {
                    body.vacation.cover = null;

                    req.session.onLeave = false;

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

            let email;
            let isEmailValid;

            if (body.email) {
                email = body.email;
                isEmailValid = email === '' || false;
            }

            let phone;
            let isPhoneValid;


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
                const error = new Error('Email/phone validation fail');

                error.status = 400;
                return callback(error);
            }

            body.editedBy = {
                user: req.session.uId,
                date: new Date(),
            };

            function updateCover(model, cb) {
                const id = model._id;
                const data = {
                    position: model.position || null,
                    country: model.country || null,
                    region: model.region || null,
                    subRegion: model.subRegion || null,
                    branch: model.branch || null,
                };

                PersonnelModel.findByIdAndUpdate(id, data, cb);
            }

            function updateUsers(model, cb) {
                if (body.vacation && _.isString(body.vacation.cover) && body.vacation.cover.length === 24) {
                    body.vacation.cover = ObjectId(body.vacation.cover);
                }

                const currentUserIdNew = model._id;
                const parallelTasks = {
                    currentUser: (parallelCb) => {
                        if (body.newPass && body.oldPass) {
                            if (bcrypt.compareSync(body.oldPass, model.pass)) {
                                const hash = PasswordManager.encryptPasswordSync(body.newPass);

                                body.pass = hash;
                            } else {
                                const error = new Error('Current password is invalid');

                                error.status = 432;
                                return parallelCb(error);
                            }
                        }

                        const imageSrc = body.imageSrc;

                        delete body.imageSrc;

                        async.waterfall([
                            (cb) => {
                                PersonnelModel.findByIdAndUpdate(currentUserIdNew, body, { new: true }, cb);
                            },
                            (model, cb) => {
                                PreviewModel.setNewPreview({
                                    model,
                                    base64: imageSrc,
                                    contentType: CONTENT_TYPES.PERSONNEL,
                                }, cb);
                            },
                        ], parallelCb);
                    },
                };
                const coverUserId = body.vacation ? body.vacation.cover : null;
                const coverBeforeUserId = model.vacation && model.vacation.cover ? model.vacation.cover : null;

                if (coverBeforeUserId && body.vacation) {
                    parallelTasks.coverBeforeUser = (parallelCb) => {
                        PersonnelModel
                            .findById(coverBeforeUserId)
                            .lean()
                            .exec((err, personnel) => {
                                if (err) {
                                    return parallelCb(err);
                                }

                                if (!personnel.temp) {
                                    coveredUsers.push(coverBeforeUserId);

                                    return parallelCb(null, {});
                                }

                                updateCover({
                                    _id: coverBeforeUserId,
                                }, (err, model) => {
                                    if (err) {
                                        return parallelCb(err);
                                    }

                                    parallelCb(null, model);
                                });
                            });
                    };
                }

                if (coverUserId) {
                    parallelTasks.coverUser = (parallelCb) => {
                        PersonnelModel
                            .findById(coverUserId)
                            .lean()
                            .exec((err, personnel) => {
                                if (err) {
                                    return parallelCb(err);
                                }

                                coveredUsers.push(coverUserId);

                                if (!personnel.temp) {
                                    return parallelCb(null, {});
                                }

                                updateCover({
                                    _id: coverUserId,
                                    country: model.country,
                                    region: model.region,
                                    subRegion: model.subRegion,
                                    branch: model.branch,
                                    position: model.position,
                                }, (err, personnel) => {
                                    if (err) {
                                        return parallelCb(err);
                                    }

                                    parallelCb(null, personnel);
                                });
                            });
                    };
                }

                async.parallel(parallelTasks, (err, results) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, results.currentUser);
                });
            }

            function getUserForUi(model, cb) {
                const options = {
                    id: model._id,
                    isMobile,
                };

                personnelFindByIdAndPopulate(options, (err, personnel) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, personnel);
                });
            }


            async.waterfall([

                // find personnel by id
                (cb) => {
                    PersonnelModel
                        .findById(personnelId)
                        .lean()
                        .exec(cb);
                },

                (personnel, cb) => {
                    if (!personnel) {
                        return errorSender.badRequest(cb, ERROR_MESSAGES.USER_NOT_FOUND);
                    }

                    let oldAccessRole;

                    if (!personnel.temp) {
                        oldAccessRole = personnel.accessRole.toString();
                    }

                    if ((body.accessRole && oldAccessRole !== body.accessRole) || body.archived) {
                        someEvents.personnelArchived({
                            ids: personnelId,
                            Session: SessionModel,
                        });
                    }

                    cb(null, personnel);
                },

                updateUsers,

                getUserForUi,

            ], callback);
        }

        async.waterfall([

            async.apply(access.getEditAccess, req, ACL_MODULES.PERSONNEL),

            (allowed, personnel, cb) => {
                bodyValidator.validateBody(body, accessLevel, CONTENT_TYPES.PERSONNEL, 'update', cb);
            },

            queryRun,

        ], (err, personnel) => {
            if (err) {
                return next(err);
            }

            const end = (err) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send(personnel);
            };

            if (!body.currentLanguage && !body.newPass && !body.vacation && !body.manager) {
                ActivityLog.emit('personnel:updated', {
                    actionOriginator: currentUserId,
                    accessRoleLevel: accessLevel,
                    body: personnel,
                });
            }
            if (body.vacation) {
                ActivityLog.emit('personnel:on-leave', {
                    actionOriginator: currentUserId,
                    accessRoleLevel: accessLevel,
                    body: personnel,
                    coveredUsers,
                });
            }
            if (coverUserId) {
                ActivityLog.emit('personnel:cover', {
                    actionOriginator: currentUserId,
                    accessRoleLevel: accessLevel,
                    body: personnel,
                    coveredUsers,
                });
            }
            if (body.manager) {
                coveredUsers.push(personnel.manager);
                ActivityLog.emit('personnel:assigned', {
                    actionOriginator: currentUserId,
                    accessRoleLevel: accessLevel,
                    body: personnel,
                    coveredUsers,
                });
            }

            // todo move to function declaration
            if (!body.sendPass) {
                return end();
            }

            const messageOptions = {
                firstName: personnel.firstName,
                lastName: personnel.lastName,
                email: personnel.email,
                phoneNumber: `+${personnel.phoneNumber}`,
                password: generatedPassword,
                token: personnel.token,
                language: currentLanguage,
            };

            if (body.type === 'email') {
                return mailer.confirmNewUserRegistration(messageOptions, end);
            }

            return smsSender.sendNewPassword(messageOptions, end);
        });
    };

    this.forgotPassword = function(req, res, next) {
        const body = req.body;
        let login = body.login;
        const option = body.ifPhone;
        let forgotToken;
        let isValid;

        if (option === 'true') {
            isValid = REGEXP.PHONE_REGEXP.test(login);
            forgotToken = generator.generateOnlyNumbersToken(6);
        } else {
            isValid = REGEXP.EMAIL_REGEXP.test(login);
            forgotToken = generator.generate();
        }

        if (!isValid) {
            return errorSender.badRequest(next, ERROR_MESSAGES.NOT_VALID_PARAMS);
        }

        login = validator.escape(login);
        login = xssFilters.inHTMLData(login);
        login = login.toLowerCase();

        PersonnelModel
            .findOne({
                $or: [{ email: login }, { phoneNumber: login }],
            })
            .lean()
            .exec((err, result) => {
                if (err) {
                    return next(err);
                }

                if (!result) {
                    return errorSender.badRequest(next, ERROR_MESSAGES.USER_NOT_FOUND);
                }

                PersonnelModel.findOneAndUpdate(
                    {
                        $or: [{ email: login }, { phoneNumber: login }],
                    },
                    {
                        $set: { forgotToken },
                    },
                    {
                        new: true,
                    },
                    (err, result) => {
                        if (err) {
                            return next(err);
                        }

                        let resultJSON;
                        let smsOptions;

                        if (result) {
                            if (option === 'true') {
                                resultJSON = result.toJSON();
                                smsOptions = {
                                    phoneNumber: `+${resultJSON.phoneNumber}`,
                                    resetCode: resultJSON.forgotToken,
                                };

                                smsSender.forgotPassword(smsOptions, res, (err, message) => {
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

    this.confirm = function(req, res, next) {
        const token = req.params.token;

        const query = PersonnelModel.findOneAndUpdate({
            token,
        }, {
            token: '',
            status: PERSONNEL_STATUSES.NEVERLOGIN._id,
            confirmed: new Date(),
        });

        query.exec((err) => {
            if (err) {
                return next(err);
            }
            res.redirect(302, `${config.localhost}/#login/confirmed`);
        });
    };

    this.checkVerifCode = function (req, res, next) {
        const body = req.body;
        const phoneNumber = body.phone;
        const code = body.code;
        const url = `${config.localhost}/passwordChange/${code}`;

        PersonnelModel.findOne({
            phoneNumber,
        }, (err, result) => {
            if (err) {
                return next(err);
            }

            if (!result) {
                return errorSender.badRequest(next, ERROR_MESSAGES.USER_NOT_FOUND);
            }

            if (result.forgotToken !== code) {
                return errorSender.badRequest(next, ERROR_MESSAGES.INCORRECT_VERIFICATION_CODE);
            }

            res.status(200).send(url);
        });
    };

    this.changePassword = function(req, res, next) {
        const forgotToken = req.params.forgotToken;
        let currentLanguage;
        const body = req.body;
        let pass = body.pass;
        let message;
        let title;
        let objToSend;
        let url;
        const salt = bcrypt.genSaltSync(10);

        pass = bcrypt.hashSync(pass, salt);

        async.waterfall([updatePass, deleteToken], (err, result) => {
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
                message,
                title,
            };
            url = `${config.localhost}/passwordChangeNotification/${JSON.stringify(objToSend)}`;

            res.status(200).send(url);
        });

        function updatePass(callback) {
            PersonnelModel.findOneAndUpdate(
                {
                    forgotToken,
                },
                {
                    $set: { pass },
                },
                {
                    new: true,
                },
                (err, result) => {
                    if (err) {
                        return callback(err);
                    }

                    callback(null, result);
                });
        }

        function deleteToken(result, callback) {
            let error;

            if (!result) {
                return errorSender.badRequest(callback);
            }

            PersonnelModel.findOneAndUpdate(
                {
                    forgotToken,
                },
                {
                    $set: { forgotToken: '' },
                },
                {
                    new: true,
                },
                (err, result) => {
                    if (err) {
                        return callback(err);
                    }

                    callback(null, result);
                });
        }
    };

    this.existSuperAdmin = function(req, res, next) {
        PersonnelModel.findOne({ super: true }, (err, user) => {
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

    this.logout = function(req, res, next) {
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    return next(err);
                }

                res.status(200).send();
            });
        } else {
            res.status(200).send();
        }

        res.clearCookie();
    };
};

module.exports = Personnel;
