'use strict';

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

    this.create = function(req, res, next) {
        function queryRun(body) {
            var files = req.files;
            var model;
            var fileIds;

            function uploadFiles(callback) {
                if (!files && !files.length) {
                    return callback();
                }

                fileHandler.uploadFile(body.createdBy, files, CONTENT_TYPES.CONTACT_US, function(err, filesIds) {
                    if (err) {
                        return callback(err);
                    }

                    fileIds = filesIds || [];
                    callback();
                });
            }

            function saveContactUs(callback) {
                body.attachments = fileIds;

                model = new ContactUsModel(body);
                model.save(callback);
            }

            async.series([
                uploadFiles,
                saveContactUs
            ], function(err, result) {
                if (err) {
                    return next(err);
                }

                res.status(201).send(result);
            });
        }
            var body;
            var error;

            try {
                if (req.body.data) {
                    body = JSON.parse(req.body.data);
                } else {
                    body = req.body;
                }
            } catch (err) {
                return next(err);
            }

            body.createdBy = req.session.uId;

            joiValidate(body, req.session.level, CONTENT_TYPES.CONTACT_US, 'create', function(err, saveData) {
                if (err) {
                    error = new Error();
                    error.status = 400;
                    error.message = err.name;
                    error.details = err.details;

                    return next(error);
                }

                queryRun(saveData);
            });
    };

    this.getAll = function(req, res, next) {
        function generateSearchCondition(query) {
            var searchVariants = [
                'type',
                'status',
                'createdBy'
            ];
            var foreignVariants = [
                'position',
                'country'
            ];
            var match = {
                createdAt : {
                    $gte : new Date(query.startDate),
                    $lte : new Date(query.endDate)
                },
            };
            var fMatch = {};
            var formCondition = [];
            var foreignCondition = [];

            _.forOwn(query, function(value, key) {
                if (_.includes(searchVariants, key)) {
                    match[key] = {};
                    match[key].$in = value.values;
                }
            });
            _.forOwn(query, function(value, key) {
                if (_.includes(foreignVariants, key)) {
                    fMatch[`createdBy.user.${key}`] = {};
                    fMatch[`createdBy.user.${key}`].$in = value.values;
                }
            });

            formCondition.push({
                $match : match
            });

            foreignCondition.push({
                $match : fMatch
            });

            return {
                formCondition : formCondition,
                foreignCondition : foreignCondition
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
            const mongoQuery = ContactUsModel.aggregate()
                .append(condition.formCondition)
                .lookup({
                    from : CONTENT_TYPES.COMMENT + 's',
                    localField : '_id',
                    foreignField : 'taskId',
                    as : 'commentaries'
                })
                .lookup({
                    from : CONTENT_TYPES.PERSONNEL + 's',
                    localField : 'createdBy',
                    foreignField : '_id',
                    as : 'createdBy.user'
                })
                .project({
                    type : 1,
                    createdAt : 1,
                    description : 1,
                    status : 1,
                    attachments : 1,
                    'commentaries.body' : 1,
                    'createdBy.user' : {$arrayElemAt : ['$createdBy.user', 0]}
                })
                .project({
                    type : 1,
                    createdAt : 1,
                    description : 1,
                    status : 1,
                    attachments : 1,
                    'commentaries.body' : 1,
                    'createdBy.user._id' : 1,
                    'createdBy.user.ID' : 1,
                    'createdBy.user.country' : 1,
                    'createdBy.user.lastName' : 1,
                    'createdBy.user.firstName' : 1,
                    'createdBy.user.position' : 1,
                    'createdBy.user.imageSrc' : 1
                })
                .append(condition.foreignCondition)
                .lookup({
                    from : CONTENT_TYPES.POSITION + 's',
                    localField : 'createdBy.user.position',
                    foreignField : '_id',
                    as : 'position'
                })
                .unwind('position')
                .project({
                    type : 1,
                    createdAt : 1,
                    description : 1,
                    status : 1,
                    attachments : 1,
                    'commentaries.body' : 1,
                    'createdBy.user' : {$ifNull : ["$createdBy.user", []]},
                    'position.name' : 1,
                    'position._id' : 1
                })
                .unwind('createdBy.user.country')
                .lookup({
                    from : CONTENT_TYPES.DOMAIN + 's',
                    localField : 'createdBy.user.country',
                    foreignField : '_id',
                    as : 'country'
                })
                .unwind('country')
                .project({
                    type : 1,
                    createdAt : 1,
                    description : 1,
                    status : 1,
                    attachments : 1,
                    'commentaries.body' : 1,
                    'createdBy.user' : {$ifNull : ["$createdBy.user", []]},
                    'country.name' : 1,
                    'country._id' : 1
                })
                .skip(skip)
                .limit(count)
                .sort(query.sortBy)
                .allowDiskUse(true);

            function getCount(cb) {
                ContactUsModel.aggregate()
                    .append(condition.formCondition)
                    .lookup({
                        from : CONTENT_TYPES.PERSONNEL + 's',
                        localField : 'createdBy',
                        foreignField : '_id',
                        as : 'createdBy.user'
                    })
                    .project({
                        type : 1,
                        createdAt : 1,
                        description : 1,
                        status : 1,
                        'createdBy.user' : {$arrayElemAt : ['$createdBy.user', 0]}
                    })
                    .append(condition.foreignCondition)
                    .append([
                        {
                            $group : {
                                _id : null,
                                count : {
                                    $sum : 1
                                }
                            }
                        }
                    ])
                    .exec(cb)
            }

            function getData(cb) {
                mongoQuery.exec(cb)
            }

            async.parallel([
                getCount,
                getData
            ], function(err, result) {
                if (err) {
                    return next(err);
                }
                var count = 0;

                if (result[0][0] && result[0][0].count) {
                    count = result[0][0].count
                }

                res.send(200, {
                    total : count,
                    data : result[1]
                });
            });
        }

        var error;

        joiValidate(req.query, req.session.level, CONTENT_TYPES.CONTACT_US, 'read', function(err, query) {
            if (err) {
                error = new Error();
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
        function queryRun(id, body) {
            ContactUsModel.findByIdAndUpdate(id, body, {
                new : true
            })
                .exec(function(err, result) {
                    if (err) {
                        return next(err);
                    }

                    res.send(200, result);
                });
        }

        var id = req.params.id;
        var body = req.body;
        var error;

        joiValidate(body, req.session.level, CONTENT_TYPES.CONTACT_US, 'update', function(err, body) {
            if (err) {
                error = new Error();
                error.status = 400;
                error.message = err.name;
                error.details = err.details;

                return next(error);
            }

            queryRun(id, body);
        });
    }
};

module.exports = ContactUs;
