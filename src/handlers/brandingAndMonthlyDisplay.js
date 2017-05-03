const _ = require('lodash');
const async = require('async');
const mongoose = require('mongoose');
const CONTENT_TYPES = require('../public/js/constants/contentType');
const FileHandler = require('../handlers/file');
const logger = require('../utils/logger');
const BrandingAndMonthlyDisplayModel = require('./../types/brandingAndMonthlyDisplay/model');
const DomainModel = require('./../types/domain/model');
const access = require('../helpers/access')();
const bodyValidator = require('../helpers/bodyValidator');
const joiValidate = require('../helpers/joiValidate');
const ACL_MODULES = require('./../constants/aclModulesNames');
const extractBody = require('./../utils/extractBody');
const ActivityLog = require('./../stories/push-notifications/activityLog');

const fileHandler = new FileHandler();
const ObjectId = mongoose.Types.ObjectId;

const create = (req, res, next) => {
    const session = req.session;
    const userId = session.uId;
    const accessRoleLevel = session.level;
    const files = req.files;

    const queryRun = (body, callback) => {
        const createBrandingAndDisplay = (cb) => {
            BrandingAndMonthlyDisplayModel.create(body, (err, report) => {
                if (err) {
                    return cb(err);
                }

                res.status(201).send(report);

                cb(null, report);
            });
        };

        const uploadFiles = (report, cb) => {
            if (!files) {
                return cb(null, {
                    setFileId: [],
                    report,
                });
            }

            fileHandler.uploadFile(userId, files, CONTENT_TYPES.MARKETING_CAMPAIGN, (err, setFileId) => {
                if (err) {
                    return cb(err);
                }

                cb(null, {
                    setFileId,
                    report,
                });
            });
        };

        const updateAttachment = (options, cb) => {
            const {
                setFileId,
                report,
            } = options;

            report.set('attachments', setFileId);

            report.save((err) => {
                if (err) {
                    return cb(err);
                }

                ActivityLog.emit('marketing:al-alali-branding-and-monthly-display:published', {
                    actionOriginator: userId,
                    accessRoleLevel,
                    body: report.toJSON(),
                });

                cb(null);
            });
        };

        async.waterfall([

            createBrandingAndDisplay,
            uploadFiles,
            updateAttachment,

        ], callback);
    };

    async.waterfall([

        (cb) => {
            access.getWriteAccess(req, ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT, cb);
        },

        (allowed, personnel, cb) => {
            const body = extractBody(req.body);

            body.createdBy = userId;
            joiValidate(body, accessRoleLevel, CONTENT_TYPES.BRANDING_AND_MONTHLY_DISPLAY, 'create', cb);
        },

        queryRun,

    ], (err) => {
        if (err) {
            if (!res.headersSent) {
                next(err);
            }

            logger.error(err);
        }
    });
};

const getById = (req, res, next) => {
    const id = req.params.id;

    const queryRun = (id, callback) => {
        const pipeline = [{
            $match: {
                _id: new ObjectId(id),
            },
        }, {
            $unwind: {
                path: '$categories',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from: 'categories',
                localField: 'categories',
                foreignField: '_id',
                as: 'categories',
            },
        }, {
            $unwind: {
                path: '$categories',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $group: {
                _id: '$_id',
                categories: { $push: '$categories' },
                branch: { $first: '$branch' },
                displayType: { $first: '$displayType' },
                outlet: { $first: '$outlet' },
                retailSegment: { $first: '$retailSegment' },
                attachments: { $first: '$attachments' },
                description: { $first: '$description' },
                createdAt: { $first: '$createdAt' },
                dateEnd: { $first: '$dateEnd' },
                dateStart: { $first: '$dateStart' },
                createdBy: { $first: '$createdBy' },
            },
        }, {
            $unwind: {
                path: '$attachments',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from: CONTENT_TYPES.FILES,
                localField: 'attachments',
                foreignField: '_id',
                as: 'attachments',
            },
        }, {
            $unwind: {
                path: '$attachments',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $group: {
                _id: '$_id',
                attachments: { $push: '$attachments' },
                categories: { $first: '$categories' },
                branch: { $first: '$branch' },
                subRegion: { $first: '$subRegion' },
                region: { $first: '$region' },
                displayType: { $first: '$displayType' },
                outlet: { $first: '$outlet' },
                retailSegment: { $first: '$retailSegment' },
                description: { $first: '$description' },
                createdAt: { $first: '$createdAt' },
                dateEnd: { $first: '$dateEnd' },
                dateStart: { $first: '$dateStart' },
                createdBy: { $first: '$createdBy' },
            },
        }, {
            $lookup: {
                from: `${CONTENT_TYPES.PERSONNEL}s`,
                localField: 'createdBy',
                foreignField: '_id',
                as: 'createdBy',
            },
        }, {
            $unwind: {
                path: '$createdBy',
            },
        }, {
            $unwind: {
                path: '$displayType',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $lookup: {
                from: `${CONTENT_TYPES.DISPLAYTYPE}s`,
                localField: 'displayType',
                foreignField: '_id',
                as: 'displayType',
            },
        }, {
            $unwind: {
                path: '$displayType',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $group: {
                _id: '$_id',
                displayType: { $push: '$displayType' },
                branch: { $first: '$branch' },
                categories: { $first: '$categories' },
                outlet: { $first: '$outlet' },
                retailSegment: { $first: '$retailSegment' },
                attachments: { $first: '$attachments' },
                description: { $first: '$description' },
                createdAt: { $first: '$createdAt' },
                dateEnd: { $first: '$dateEnd' },
                dateStart: { $first: '$dateStart' },
                createdBy: { $first: '$createdBy' },
            },
        }, {
            $lookup: {
                from: `${CONTENT_TYPES.OUTLET}s`,
                localField: 'outlet',
                foreignField: '_id',
                as: 'outlet',
            },
        }, {
            $unwind: {
                path: '$outlet',
            },
        }, {
            $lookup: {
                from: `${CONTENT_TYPES.RETAILSEGMENT}s`,
                localField: 'retailSegment',
                foreignField: '_id',
                as: 'retailSegment',
            },
        }, {
            $unwind: {
                path: '$retailSegment',
            },
        }, {
            $lookup: {
                from: `${CONTENT_TYPES.BRANCH}es`,
                localField: 'branch',
                foreignField: '_id',
                as: 'branch',
            },
        }, {
            $unwind: {
                path: '$branch',
            },
        }, {
            $lookup: {
                from: `${CONTENT_TYPES.DOMAIN}s`,
                localField: 'branch.subRegion',
                foreignField: '_id',
                as: 'subRegion',
            },
        }, {
            $unwind: {
                path: '$subRegion',
            },
        }, {
            $lookup: {
                from: `${CONTENT_TYPES.DOMAIN}s`,
                localField: 'subRegion.parent',
                foreignField: '_id',
                as: 'region',
            },
        }, {
            $unwind: {
                path: '$region',
            },
        }, {
            $project: {
                createdAt: 1,
                description: 1,
                dateEnd: 1,
                dateStart: 1,
                displayType: 1,
                'attachments._id': 1,
                'attachments.name': 1,
                'attachments.preview': 1,
                'attachments.originalName': 1,
                'categories._id': 1,
                'categories.name': 1,
                'subRegion._id': 1,
                'subRegion.name': 1,
                'region._id': 1,
                'region.name': 1,
                'branch._id': 1,
                'branch.name': 1,
                'outlet._id': 1,
                'outlet.name': 1,
                'retailSegment._id': 1,
                'retailSegment.name': 1,
                'createdBy._id': 1,
                'createdBy.ID': 1,
                'createdBy.lastName': 1,
                'createdBy.firstName': 1,
                'createdBy.country': 1,
            },
        }];

        const getReport = (cb) => {
            BrandingAndMonthlyDisplayModel.aggregate(pipeline)
                .allowDiskUse(true)
                .exec(cb);
        };

        const getAndMapDomains = (result, cb) => {
            const report = result.pop() || {};

            if (!report.createdBy) {
                return cb(null, report);
            }

            const createdBy = report.createdBy;
            const setDomainId = _.concat(createdBy.country);

            DomainModel
                .find({
                    _id: {
                        $in: setDomainId,
                    },
                }, {
                    name: 1,
                })
                .lean()
                .exec((err, countries) => {
                    if (err) {
                        return cb(err);
                    }

                    createdBy.country = countries.filter((country) => {
                        const setCountryId = createdBy.country.map(objectId => objectId.toString());
                        const countryId = country._id.toString();

                        return _.includes(setCountryId, countryId);
                    });

                    cb(null, report);
                });
        };

        const getLinkFromAws = (report, cb) => {
            if (!_.get(report, 'attachments')) {
                return cb(null, report);
            }

            async.each(report.attachments, (file, eachCb) => {
                file.url = fileHandler.computeUrl(file.name);
                eachCb();
            }, (err) => {
                cb(err, report);
            });
        };

        async.waterfall([

            getReport,
            getAndMapDomains,
            getLinkFromAws,

        ], callback);
    };

    async.waterfall([

        (cb) => {
            access.getReadAccess(req, ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT, cb);
        },

        (allowed, personnel, cb) => {
            queryRun(id, cb);
        },

    ], (err, report) => {
        if (err) {
            return next(err);
        }

        res.status(200).send(report);
    });
};

const update = (req, res, next) => {
    const session = req.session;
    const userId = session.uId;
    const accessRoleLevel = session.level;
    const requestBody = req.body;
    const id = req.params.id;

    const queryRun = (body, callback) => {
        body.editedBy = {
            user: userId,
            date: Date.now()
        };
        BrandingAndMonthlyDisplayModel.findByIdAndUpdate(id, body, { new: true }).populate('displayType').exec(callback);
    };

    async.waterfall([
        (cb) => {
            access.getEditAccess(req, ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT, cb);
        },

        (allowed, personnel, cb) => {
            bodyValidator.validateBody(requestBody, accessRoleLevel, CONTENT_TYPES.BRANDING_AND_MONTHLY_DISPLAY, 'update', cb);
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

const getAll = (req, res, next) => {
    const session = req.session;
    const accessRoleLevel = session.level;
    let currentUser;

    const generateSearchCondition = (query) => {
        const globalSearch = query.globalSearch;
        const searchVariants = [
            'outlet',
            'branch',
            'createdBy',
            'category',
            'retailSegment',
        ];
        const foreignVariants = [
            'position',
            'country',
            'subRegion',
            'region',
        ];
        if (query && query.time) {
            query.startDate = query.time.values[0];
            query.endDate = query.time.values[1];
        }
        const match = {
            createdAt: {
                $gte: new Date(query.startDate),
                $lte: new Date(query.endDate),
            },
        };
        const fMatch = {};
        const formCondition = [];
        const foreignCondition = [];
        const searchCondition = [];

        _.forOwn(query, (value, key) => {
            if (_.includes(searchVariants, key)) {
                // different name in ui and model
                key = key === 'category' ? 'categories' : key;

                match[key] = {};
                match[key].$in = value.values;
            }
        });
        _.forOwn(query, (value, key) => {
            if (_.includes(foreignVariants, key)) {
                fMatch[`createdBy.${key}`] = {};
                fMatch[`createdBy.${key}`].$in = value.values;
            }
        });

        formCondition.push({
            $match: match,
        });
        foreignCondition.push({
            $match: fMatch,
        });

        if (globalSearch) {
            const regex = new RegExp(`.*${query.globalSearch}.*`, 'ig');

            searchCondition.push({
                $match: {
                    $or: [
                        {
                            'createdBy.lastName.ar': { $regex: regex },
                        },
                        {
                            'createdBy.lastName.en': { $regex: regex },
                        },
                        {
                            'createdBy.firstName.ar': { $regex: regex },
                        },
                        {
                            'createdBy.firstName.en': { $regex: regex },
                        },
                        {
                            'categories.name.en': { $regex: regex },
                        },
                        {
                            'categories.name.ar': { $regex: regex },
                        },
                    ],
                },
            });
        }

        return {
            formCondition,
            foreignCondition,
            searchCondition,
        };
    };

    const queryRun = (query, callback) => {
        const limit = query.count;
        const skip = (query.page - 1) * limit;
        const condition = generateSearchCondition(query.filter);
        const locations = ['country', 'region', 'subRegion', 'branch'];
        const $generalMatch = {
            $and: [],
        };

        locations.forEach((location) => {
            if (currentUser[location] && currentUser[location].length) {
                $generalMatch.$and.push({
                    $or: [
                        {
                            [location]: { $in: currentUser[location] },
                        },
                        {
                            [location]: { $eq: [] },
                        },
                        {
                            [location]: { $eq: null },
                        },
                    ],
                });
            }
        });

        let mongoQuery = BrandingAndMonthlyDisplayModel.aggregate();

        if ($generalMatch.$and.length) {
            mongoQuery = mongoQuery.append({
                $match: $generalMatch,
            });
        }

        mongoQuery
            .append(condition.formCondition)
            .lookup({
                from: `${CONTENT_TYPES.COMMENT}s`,
                localField: '_id',
                foreignField: 'taskId',
                as: 'commentaries',
            })
            .lookup({
                from: `${CONTENT_TYPES.PERSONNEL}s`,
                localField: 'createdBy',
                foreignField: '_id',
                as: 'createdBy',
            })
            .append([{
                $unwind: {
                    path: '$createdBy',
                    preserveNullAndEmptyArrays: true,
                },
            }])
            .append([{
                $unwind: {
                    path: '$createdBy.country',
                    preserveNullAndEmptyArrays: true,
                },
            }])
            .lookup({
                from: `${CONTENT_TYPES.DOMAIN}s`,
                localField: 'createdBy.country',
                foreignField: '_id',
                as: 'countries',
            })
            .append([{
                $unwind: {
                    path: '$countries',
                    preserveNullAndEmptyArrays: true,
                },
            }])
            .lookup({
                from: `${CONTENT_TYPES.ACCESSROLE}s`,
                localField: 'createdBy.accessRole',
                foreignField: '_id',
                as: 'createdBy.accessRole',
            })
            .append([{
                $unwind: {
                    path: '$createdBy.accessRole',
                    preserveNullAndEmptyArrays: true,
                },
            }])
            .append([{
                $unwind: {
                    path: '$attachments',
                    preserveNullAndEmptyArrays: true,
                },
            }])
            .lookup({
                from: CONTENT_TYPES.FILES,
                localField: 'attachments',
                foreignField: '_id',
                as: 'attachments',
            })
            .append([{
                $unwind: {
                    path: '$attachments',
                    preserveNullAndEmptyArrays: true,
                },
            }])
            .group({
                _id: '$_id',
                attachments: { $push: '$attachments' },
                categories: { $first: '$categories' },
                countries: { $first: '$countries' },
                commentaries: { $first: '$commentaries' },
                branch: { $first: '$branch' },
                subRegion: { $first: '$subRegion' },
                region: { $first: '$region' },
                retailSegment: { $first: '$retailSegment' },
                displayType: { $first: '$displayType' },
                outlet: { $first: '$outlet' },
                description: { $first: '$description' },
                createdAt: { $first: '$createdAt' },
                dateEnd: { $first: '$dateEnd' },
                dateStart: { $first: '$dateStart' },
                createdBy: { $first: '$createdBy' },
            })
            .append([{
                $unwind: {
                    path: '$categories',
                    preserveNullAndEmptyArrays: true,
                },
            }])
            .lookup({
                from: 'categories',
                localField: 'categories',
                foreignField: '_id',
                as: 'categories',
            })
            .append([{
                $unwind: {
                    path: '$categories',
                    preserveNullAndEmptyArrays: true,
                },
            }])
            .group({
                _id: '$_id',
                categories: { $push: '$categories' },
                attachments: { $first: '$attachments' },
                countries: { $first: '$countries' },
                commentaries: { $first: '$commentaries' },
                branch: { $first: '$branch' },
                subRegion: { $first: '$subRegion' },
                region: { $first: '$region' },
                retailSegment: { $first: '$retailSegment' },
                displayType: { $first: '$displayType' },
                outlet: { $first: '$outlet' },
                description: { $first: '$description' },
                createdAt: { $first: '$createdAt' },
                dateEnd: { $first: '$dateEnd' },
                dateStart: { $first: '$dateStart' },
                createdBy: { $first: '$createdBy' },
            })
            .append({
                $unwind: {
                    path: '$displayType',
                    preserveNullAndEmptyArrays: true,
                },
            })
            .lookup({
                from: `${CONTENT_TYPES.DISPLAYTYPE}s`,
                localField: 'displayType',
                foreignField: '_id',
                as: 'displayType',
            })
            .append({
                $unwind: {
                    path: '$displayType',
                    preserveNullAndEmptyArrays: true,
                },
            })
            .group({
                _id: '$_id',
                displayType: { $push: '$displayType' },
                branch: { $first: '$branch' },
                categories: { $first: '$categories' },
                outlet: { $first: '$outlet' },
                attachments: { $first: '$attachments' },
                description: { $first: '$description' },
                createdAt: { $first: '$createdAt' },
                dateEnd: { $first: '$dateEnd' },
                dateStart: { $first: '$dateStart' },
                createdBy: { $first: '$createdBy' },
            })
            .lookup({
                from: `${CONTENT_TYPES.OUTLET}s`,
                localField: 'outlet',
                foreignField: '_id',
                as: 'outlet',
            })
            .append([{
                $unwind: {
                    path: '$outlet',
                    preserveNullAndEmptyArrays: true,
                },
            }])
            .lookup({
                from: `${CONTENT_TYPES.BRANCH}es`,
                localField: 'branch',
                foreignField: '_id',
                as: 'branch',
            })
            .append([{
                $unwind: {
                    path: '$branch',
                    preserveNullAndEmptyArrays: true,
                },
            }])
            .lookup({
                from: `${CONTENT_TYPES.RETAILSEGMENT}s`,
                localField: 'branch.retailSegment',
                foreignField: '_id',
                as: 'retailSegment',
            })
            .append([{
                $unwind: {
                    path: '$retailSegment',
                    preserveNullAndEmptyArrays: true,
                },
            }])
            .lookup({
                from: `${CONTENT_TYPES.DOMAIN}s`,
                localField: 'branch.subRegion',
                foreignField: '_id',
                as: 'subRegion',
            })
            .append([{
                $unwind: {
                    path: '$subRegion',
                    preserveNullAndEmptyArrays: true,
                },
            }])
            .lookup({
                from: `${CONTENT_TYPES.DOMAIN}s`,
                localField: 'subRegion.parent',
                foreignField: '_id',
                as: 'region',
            })
            .append([{
                $unwind: {
                    path: '$region',
                    preserveNullAndEmptyArrays: true,
                },
            }])
            .append(condition.foreignCondition)
            .lookup({
                from: `${CONTENT_TYPES.POSITION}s`,
                localField: 'createdBy.position',
                foreignField: '_id',
                as: 'createdBy.position',
            })
            .append([{
                $unwind: {
                    path: '$createdBy.position',
                    preserveNullAndEmptyArrays: true,
                },
            }])
            .append(condition.searchCondition)
            .project({
                createdAt: 1,
                description: 1,
                dateEnd: 1,
                dateStart: 1,
                displayType: 1,
                'categories._id': 1,
                'categories.name': 1,
                'countries._id': 1,
                'countries.name': 1,
                'commentaries.body': 1,
                'attachments._id': 1,
                'attachments.name': 1,
                'attachments.originalName': 1,
                'attachments.contentType': 1,
                'branch._id': 1,
                'branch.name': 1,
                'retailSegment._id': 1,
                'retailSegment.name': 1,
                'subRegion._id': 1,
                'subRegion.name': 1,
                'region._id': 1,
                'region.name': 1,
                'outlet._id': 1,
                'outlet.name': 1,
                'createdBy._id': 1,
                'createdBy.ID': 1,
                'createdBy.lastName': 1,
                'createdBy.firstName': 1,
                'createdBy.imageSrc': 1,
                'createdBy.position.name': 1,
                'createdBy.accessRole.name': 1,
            })
            .skip(skip)
            .limit(limit)
            .sort(query.sortBy)
            .allowDiskUse(true);

        const getCount = (cb) => {
            BrandingAndMonthlyDisplayModel.aggregate()
                .append(condition.formCondition)
                .lookup({
                    from: `${CONTENT_TYPES.PERSONNEL}s`,
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'createdBy',
                })
                .append([{
                    $unwind: {
                        path: '$createdBy',
                        preserveNullAndEmptyArrays: true,
                    },
                }])
                .lookup({
                    from: `${CONTENT_TYPES.DISPLAYTYPE}s`,
                    localField: 'displayType',
                    foreignField: '_id',
                    as: 'displayType',
                })
                .lookup({
                    from: `${CONTENT_TYPES.OUTLET}s`,
                    localField: 'outlet',
                    foreignField: '_id',
                    as: 'outlet',
                })
                .lookup({
                    from: `${CONTENT_TYPES.BRANCH}es`,
                    localField: 'branch',
                    foreignField: '_id',
                    as: 'branch',
                })
                .append([{
                    $unwind: {
                        path: '$outlet',
                        preserveNullAndEmptyArrays: true,
                    },
                }])
                .append([{
                    $unwind: {
                        path: '$branch',
                        preserveNullAndEmptyArrays: true,
                    },
                }])
                .append([{
                    $unwind: {
                        path: '$categories',
                        preserveNullAndEmptyArrays: true,
                    },
                }])
                .lookup({
                    from: 'categories',
                    localField: 'categories',
                    foreignField: '_id',
                    as: 'categories',
                })
                .append([{
                    $unwind: {
                        path: '$categories',
                        preserveNullAndEmptyArrays: true,
                    },
                }])
                .group({
                    _id: '$_id',
                    categories: { $push: '$categories' },
                    attachments: { $first: '$attachments' },
                    countries: { $first: '$countries' },
                    commentaries: { $first: '$commentaries' },
                    branch: { $first: '$branch' },
                    subRegion: { $first: '$subRegion' },
                    region: { $first: '$region' },
                    retailSegment: { $first: '$retailSegment' },
                    displayType: { $first: '$displayType' },
                    outlet: { $first: '$outlet' },
                    description: { $first: '$description' },
                    createdAt: { $first: '$createdAt' },
                    dateEnd: { $first: '$dateEnd' },
                    dateStart: { $first: '$dateStart' },
                    createdBy: { $first: '$createdBy' },
                })
                .append(condition.foreignCondition)
                .append(condition.searchCondition)
                .append([{
                    $group: {
                        _id: null,
                        count: {
                            $sum: 1,
                        },
                    },
                }])
                .exec(cb);
        };

        const getData = (cb) => {
            mongoQuery.exec(cb);
        };

        async.parallel([

            getCount,
            getData,

        ], callback);
    };

    async.waterfall([

        (cb) => {
            access.getReadAccess(req, ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT, cb);
        },

        (allowed, personnel, cb) => {
            currentUser = personnel;

            joiValidate(req.query, accessRoleLevel, CONTENT_TYPES.BRANDING_AND_MONTHLY_DISPLAY, 'read', cb);
        },

        queryRun,

    ], (err, result) => {
        if (err) {
            return next(err);
        }

        const count = _.get(result, '[0][0].count') || 0;
        const body = {
            total: count,
            data: result[1],
        };

        res.send(200, body);
    });
};

module.exports = {
    create,
    getById,
    getAll,
    update,
};
