'use strict';

var ContactUs = function(db, redis, event) {
    var async = require('async');
    var _ = require('lodash');
    var FileHandler = require('../handlers/file');
    var fileHandler = new FileHandler(db);
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Types.ObjectId;
    var ACL_MODULES = require('../constants/aclModulesNames');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var ContactUsModel = require('./../types/contactUs/model');
    var CountryModel = require('./../types/origin/model');
    var access = require('../helpers/access')(db);
    var joiValidate = require('../helpers/joiValidate');

    this.create = function(req, res, next) {
        function queryRun(body) {
            var files = req.files;
            var model;
            var fileId;

            function uploadFile(callback) {
                if (!files) {
                    return callback();
                }

                fileHandler.uploadFile(body.createdBy, files, CONTENT_TYPES.CONTACT_US, function(err, filesIds) {
                    if (err) {
                        return callback(err);
                    }

                    fileId = filesIds[0];

                    callback();
                });
            }

            function saveContactUs(callback) {
                body.attachments = fileId;

                model = new ContactUsModel(body);
                model.save(callback);
            }

            async.series([
                uploadFile,
                saveContactUs
            ], function(err, result) {
                if (err) {
                    return next(err);
                }

                res.status(201).send(result);
            });
        }

        access.getWriteAccess(req, ACL_MODULES.CONTACT_US, function(err) {
            var body;
            var error;

            if (err) {
                return next(err);
            }

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
                'creator.position'
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
                    match[key].$in = value;
                }
            });
            _.forOwn(query, function(value, key) {
                if (_.includes(foreignVariants, key)) {
                    fMatch[key] = {};
                    fMatch[key].$in = value;
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
            var skip = (query.page - 1) * query.count;
            var condition = generateSearchCondition(query);
            var mongoQuery = ContactUsModel.aggregate()
                .append(condition.formCondition)
                .lookup({
                    from : CONTENT_TYPES.PERSONNEL + 's',
                    localField : 'createdBy',
                    foreignField : '_id',
                    as : 'creator'
                })
                .project({
                    type : 1,
                    createdAt : 1,
                    description : 1,
                    status : 1,
                    creator : {$arrayElemAt : ['$creator', 0]}
                })
                .project({
                    type : 1,
                    createdAt : 1,
                    description : 1,
                    status : 1,
                    'creator._id' : 1,
                    'creator.ID' : 1,
                    'creator.lastName' : 1,
                    'creator.firstName' : 1,
                    'creator.position' : 1
                })
                .append(condition.foreignCondition)
                .lookup({
                    from : CONTENT_TYPES.POSITION + 's',
                    localField : 'creator.position',
                    foreignField : '_id',
                    as : 'position'
                })
                .unwind('position')
                .project({
                    type : 1,
                    createdAt : 1,
                    description : 1,
                    status : 1,
                    creator : {$ifNull : ["$creator", []]},
                    'position.name' : 1,
                    'position._id' : 1
                })
                .limit(query.count)
                .skip(skip)
                .sort(query.sortBy)
                .allowDiskUse(true);

            function getCount(cb) {
                ContactUsModel.aggregate()
                    .append(condition.formCondition)
                    .lookup({
                        from : CONTENT_TYPES.PERSONNEL + 's',
                        localField : 'createdBy',
                        foreignField : '_id',
                        as : 'creator'
                    })
                    .project({
                        type : 1,
                        createdAt : 1,
                        description : 1,
                        status : 1,
                        creator : {$arrayElemAt : ['$creator', 0]}
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

        // access.getReadAccess(req, ACL_MODULES.CONTACT_US, function(err) {
        var error;
        //
        //     if (err) {
        //         return next(err);
        //     }

        joiValidate(req.query, 1/*req.session.level*/, CONTENT_TYPES.CONTACT_US, 'read', function(err, query) {
            if (err) {
                error = new Error();
                error.status = 400;
                error.message = err.name;
                error.details = err.details;

                return next(error);
            }

            queryRun(query);
        });
        // });
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
                .lookup({
                    from : CONTENT_TYPES.FILES,
                    localField : 'attachments',
                    foreignField : '_id',
                    as : 'file'
                })
                .unwind('file')
                .project({
                    module : 1,
                    type : 1,
                    createdAt : 1,
                    description : 1,
                    status : 1,
                    attachments : 1,
                    'creator._id' : 1,
                    'creator.ID' : 1,
                    'creator.lastName' : 1,
                    'creator.firstName' : 1,
                    'creator.country' : 1,
                    'file.originalName' : 1,
                    'file.name' : 1
                })
                .allowDiskUse(true);

            function getContactUsForm(cb) {
                contactUsQuery.exec(cb)
            }

            function getAndMapCountries(contactUs, cb) {
                if (!contactUs[0].creator) {
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

            function getLinkFromAws(contactUs, cb) {
                contactUs.file.url = fileHandler.computeUrl(contactUs.file.name);
                cb(null, contactUs)

            }

            async.waterfall([
                getContactUsForm,
                getAndMapCountries,
                getLinkFromAws
            ], function(err, result) {
                if (err) {
                    return next(err);
                }

                res.send(200, result);
            });
        }

        access.getReadAccess(req, ACL_MODULES.CONTACT_US, function(err) {
            var id = req.params.id;
            if (err) {
                return next(err);
            }

            queryRun(id);
        });
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

        access.getEditAccess(req, ACL_MODULES.CONTACT_US, function(err) {
            var id = req.params.id;
            var body = req.body;
            var error;

            if (err) {
                return next(err);
            }

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
        });
    }
};

module.exports = ContactUs;
