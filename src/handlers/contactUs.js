const ActivityLog = require('./../stories/push-notifications/activityLog');
const extractBody = require('./../utils/extractBody');

var ContactUs = function(db, redis, event) {
    var async = require('async');
    var _ = require('lodash');
    var FileHandler = require('../handlers/file');
    var fileHandler = new FileHandler(db);
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Types.ObjectId;
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var ContactUsModel = require('./../types/contactUs/model');
    var CountryModel = require('./../types/origin/model');
    var FileModel = require('./../types/file/model');
    var access = require('../helpers/access')(db);
    var joiValidate = require('../helpers/joiValidate');
    var AggregationHelper = require('../helpers/aggregationCreater');

    this.create = function(req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        const queryRun = (body, callback) => {
            const files = req.files;

            async.waterfall([

                (cb) => {
                    if (!files && !files.length) {
                        return cb(null, []);
                    }

                    fileHandler.uploadFile(body.createdBy, files, CONTENT_TYPES.CONTACT_US, (err, setFileId) => {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, setFileId);
                    });
                },

                (setFileId, cb) => {
                    body.attachments = setFileId;

                    const model = new ContactUsModel();

                    model.set(body);
                    model.save((err, model) => {
                        cb(err, model);
                    });
                },

            ], callback);
        };

        async.waterfall([

            (cb) => {
                const body = extractBody(req.body);

                body.createdBy = userId;

                joiValidate(body, accessRoleLevel, CONTENT_TYPES.CONTACT_US, 'create', (err, body) => {
                    if (err) {
                        const error = new Error();

                        error.status = 400;
                        error.message = err.name;
                        error.details = err.details;

                        return next(error);
                    }

                    cb(null, body);
                });
            },

            queryRun,

        ], (err, result) => {
            if (err) {
                return next(err);
            }

            ActivityLog.emit('contact-us:published', {
                actionOriginator: userId,
                accessRoleLevel,
                body: result.toJSON(),
            });

            res.status(201).send(result);
        });
    };

    this.getAll = function(req, res, next) {
        function generateSearchCondition(query) {
            const  match = {};
            
            var searchVariants = [
                'type',
                'status',
                'createdBy'
            ];
            var foreignVariants = [
                'position',
                'country'
            ];
            const aggregateHelper = new AggregationHelper({});
           
    
            if (match.createdAt) {
                match.createdAt = {
                    $gte: new Date(query.startDate),
                    $lte: new Date(query.endDate)
                };
            }
            
            const filterSearch = query.globalSearch && aggregateHelper.getSearchMatch([
                    'type',
                    'description',
                    'status',
                    'createdBy.user.lastName.en',
                    'createdBy.user.firstName.en',
                    'createdBy.user.lastName.ar',
                    'createdBy.user.firstName.ar'
                ], query.globalSearch);

            var fMatch = filterSearch || {};
            var formCondition;
            var foreignCondition;

            _.forOwn(query, function (value, key) {
                if (_.includes(searchVariants, key)) {
                    match[key] = {};
                    match[key].$in = value.values;
                }
            });
            _.forOwn(query, function (value, key) {
                if (_.includes(foreignVariants, key)) {
                    fMatch[`createdBy.user.${key}`] = {};
                    fMatch[`createdBy.user.${key}`].$in = value.values;
                }
            });

            formCondition = {
                $match: match
            };

            foreignCondition = {
                $match: fMatch
            };

            return {
                formCondition   : formCondition,
                foreignCondition: foreignCondition
            };
        }

        function queryRun(query) {
            const count = query.count;
            const skip = (query.page - 1) * count;
            if (query.filter && query.filter.time) {
                query.filter.startDate = query.filter.time.values[0];
                query.filter.endDate = query.filter.time.values[1];
            }
            const condition = generateSearchCondition(query.filter);
            const mongoQuery = ContactUsModel.aggregate([
                condition.formCondition,
                {
                    $lookup: {
                        from        : CONTENT_TYPES.COMMENT + 's',
                        localField  : '_id',
                        foreignField: 'taskId',
                        as          : 'commentaries'
                    }
                }, {
                    $lookup: {
                        from        : CONTENT_TYPES.PERSONNEL + 's',
                        localField  : 'createdBy',
                        foreignField: '_id',
                        as          : 'createdBy.user'
                    }
                }, {
                    $project: {
                        type               : 1,
                        createdAt          : 1,
                        description        : 1,
                        status             : 1,
                        attachments        : 1,
                        'commentaries.body': 1,
                        'createdBy.user'   : {$arrayElemAt: ['$createdBy.user', 0]}
                    }
                }, {
                    $project: {
                        type                      : 1,
                        createdAt                 : 1,
                        description               : 1,
                        status                    : 1,
                        attachments               : 1,
                        'commentaries.body'       : 1,
                        'createdBy.user._id'      : 1,
                        'createdBy.user.ID'       : 1,
                        'createdBy.user.country'  : 1,
                        'createdBy.user.lastName' : 1,
                        'createdBy.user.firstName': 1,
                        'createdBy.user.position' : 1,
                        'createdBy.user.imageSrc' : 1
                    }
                },
                condition.foreignCondition,
                {
                    $lookup: {
                        from        : CONTENT_TYPES.POSITION + 's',
                        localField  : 'createdBy.user.position',
                        foreignField: '_id',
                        as          : 'position'
                    }
                },
                {
                    $unwind: '$position'
                },
                {
                    $project: {
                        type               : 1,
                        createdAt          : 1,
                        description        : 1,
                        status             : 1,
                        attachments        : 1,
                        'commentaries.body': 1,
                        'createdBy.user'   : {$ifNull: ["$createdBy.user", []]},
                        'position.name'    : 1,
                        'position._id'     : 1
                    }
                }, {
                    $unwind: {
                        path                      : '$createdBy.user.country',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from        : CONTENT_TYPES.DOMAIN + 's',
                        localField  : 'createdBy.user.country',
                        foreignField: '_id',
                        as          : 'country'
                    }
                }, {
                    $unwind: {
                        path                      : '$country',
                        preserveNullAndEmptyArrays: true
                    }
                }, {
                    $project: {
                        type               : 1,
                        createdAt          : 1,
                        description        : 1,
                        status             : 1,
                        attachments        : 1,
                        'commentaries.body': 1,
                        'createdBy.user'   : {$ifNull: ["$createdBy.user", []]},
                        'country.name'     :  {$ifNull: ["$country.name", '']},
                        'country._id'     :  {$ifNull: ["$country._id", '']},
                    }
                }, {
                    $group: {
                        _id  : null,
                        total: {$sum: 1},
                        root : {$push: '$$ROOT'}
                    }
                }, {
                    $unwind: '$root'
                }, {
                    $project: {
                        _id         : '$root._id',
                        type        : '$root.type',
                        status      : '$root.status',
                        createdAt   : '$root.createdAt',
                        description : '$root.description',
                        attachments : '$root.attachments',
                        commentaries: '$root.commentaries',
                        createdBy   : '$root.createdBy',
                        country     : '$root.country',
                        total       : 1
                    }
                }, {
                    $sort: {
                        [query.sortBy]: -1
                    }
                }, {
                    $skip: skip
                }, {
                    $limit: count
                }]);

            mongoQuery.options = {
                allowDiskUse: true
            };


            mongoQuery.exec(function (err, result) {
                var total;
                if (err) {
                    return next(err);
                }
                total = result && result[0] ? result[0].total : 0;

                res.send(200, {
                    total: total,
                    data : result
                });
            });
        }

        joiValidate(req.query, req.session.level, CONTENT_TYPES.CONTACT_US, 'read', function(err, query) {
            if (err) {
                const error = new Error();

                error.status = 400;
                error.message = err.name;
                error.details = err.details;

                return next(error);
            }

            queryRun(query);
        });
    };

    this.getById = function(req, res, next) {
        function queryRun(id) {
            var contactUsQuery = ContactUsModel.aggregate()
                .append([{
                    $match : {
                        _id : new ObjectId(id)
                    }
                }])
                .lookup({
                    from : CONTENT_TYPES.PERSONNEL + 's',
                    localField : 'createdBy',
                    foreignField : '_id',
                    as : 'creator'
                })
                .unwind('creator')
                .project({
                    type : 1,
                    createdAt : 1,
                    description : 1,
                    status : 1,
                    attachments : 1,
                    comments : 1,
                    'creator._id' : 1,
                    'creator.ID' : 1,
                    'creator.lastName' : 1,
                    'creator.firstName' : 1,
                    'creator.country' : 1
                })
                .allowDiskUse(true);

            function getContactUsForm(cb) {
                contactUsQuery.exec(cb)
            }

            function getAndMapCountries(contactUs, cb) {
                if (!_.get(contactUs, '[0].creator')) {
                    return cb(null, contactUs[0]);
                }
                CountryModel
                    .find({
                        _id : {
                            $in : contactUs[0].creator.country
                        }
                    }, {
                        name : 1
                    })
                    .lean()
                    .exec(function(err, countries) {
                        if (err) {
                            return cb(err);
                        }
                        contactUs[0].creator.country = _.map(contactUs[0].creator.country, function(o) {
                            return _.forEach(countries, function(country) {
                                if (_.isEqual(o.toString(), country._id.toString())) {
                                    return country;
                                }
                            });
                        });
                        cb(null, contactUs[0]);
                    })
            }

            function getAndMapAttachments(contactUs, cb) {
                if (!_.get(contactUs, 'attachments')) {
                    return cb(null, contactUs);
                }
                FileModel
                    .find({
                        _id : {
                            $in : contactUs.attachments
                        }
                    }, {
                        name : 1,
                        originalName : 1,
                        contentType : 1
                    })
                    .lean()
                    .exec(function(err, attachments) {
                        if (err) {
                            return cb(err);
                        }

                        contactUs.attachments = _.filter(attachments, function(attachment) {
                            if (_.includes(_.map(contactUs.attachments, o => o.toString()),
                                    attachment._id.toString()
                                )) {
                                return attachment
                            }
                        });
                        cb(null, contactUs);
                    })
            }

            function getLinkFromAws(contactUs, cb) {
                if (!_.get(contactUs, 'attachments')) {
                    return cb(null, contactUs || {});
                }
                async.each(contactUs.attachments,
                    function(file, callback) {
                        file.url = fileHandler.computeUrl(file.name);
                        callback();
                    }, function(err) {
                        if (err) {
                            cb(err);
                        }
                        cb(null, contactUs);
                    });
            }

            async.waterfall([
                getContactUsForm,
                getAndMapCountries,
                getAndMapAttachments,
                getLinkFromAws
            ], function(err, result) {
                if (err) {
                    return next(err);
                }

                res.send(200, result);
            });
        }

        queryRun(req.params.id);
    };

    this.updateById = function(req, res, next) {
        const session = req.session;
        const userId = session.uId;
        const accessRoleLevel = session.level;

        function queryRun(id, body) {
            ContactUsModel.findByIdAndUpdate(id, body, { new : true })
                .exec((err, result) => {
                    if (err) {
                        return next(err);
                    }

                    ActivityLog.emit('contact-us:updated', {
                        actionOriginator: userId,
                        accessRoleLevel,
                        body: result.toJSON(),
                    });

                    res.send(200, result);
                });
        }

        const id = req.params.id;
        const body = req.body;

        joiValidate(body, req.session.level, CONTENT_TYPES.CONTACT_US, 'update', (err, body) => {
            if (err) {
                const error = new Error();

                error.status = 400;
                error.message = err.name;
                error.details = err.details;

                return next(error);
            }

            queryRun(id, body);
        });
    };
};

module.exports = ContactUs;
