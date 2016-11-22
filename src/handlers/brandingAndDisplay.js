'use strict';

function BrandingAndDisplay(db, redis, event) {
    const _ = require('lodash');
    const async = require('async');
    const mongoose = require('mongoose');
    const CONTENT_TYPES = require('../public/js/constants/contentType.js');
    const FileHandler = require('../handlers/file');
    const fileHandler = new FileHandler(db);
    const BrandingAndDisplayModel = require('../types/brandingAndDisplay/model');
    const DomainModel = require('./../types/domain/model');
    const CategoryModel = require('./../types/category/model');
    const access = require('../helpers/access')(db);
    const joiValidate = require('../helpers/joiValidate');
    const ObjectId = mongoose.Types.ObjectId;

    this.create = function(req, res, next) {
        function queryRun(body) {
            const files = req.files;
            const userId = req.session.uId;

            function uploadFiles(files, body, userId, cb) {
                if (!files) {
                    return cb(null, [], body, userId);
                }

                fileHandler.uploadFile(userId, files, 'brandingAndDisplay', function(err, filesIds) {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, filesIds, body, userId);
                });
            }

            function createBrandingAndDisplay(filesIds, body, userId, cb) {
                body.attachments = filesIds;

                const model = new BrandingAndDisplayModel(body);
                model.save(function(err, model) {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, model);
                });
            }

            async.waterfall([
                async.apply(uploadFiles, files, body, userId),
                createBrandingAndDisplay
            ], function(err, result) {
                if (err) {
                    return next(err);
                }

                res.status(201).send(result);
            });
        }

        let body;
        let error;

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
        joiValidate(body, req.session.level, CONTENT_TYPES.BRANDING_AND_DISPLAY, 'create', function(err, saveData) {
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

    this.getById = function(req, res, next) {
        function queryRun(id) {
            const brandingAndDisplayModelQuery = BrandingAndDisplayModel.aggregate()
                .append([{
                    $match : {
                        _id : new ObjectId(id)
                    }
                }])
                .append({
                    $unwind : {
                        path : '$categories',
                        preserveNullAndEmptyArrays : true
                    }
                })
                //.unwind('categories')
                .lookup({
                    from : 'categories',
                    localField : 'categories',
                    foreignField : '_id',
                    as : 'categories'
                })
                .append({
                    $unwind : {
                        path : '$categories',
                        preserveNullAndEmptyArrays : true
                    }
                })
                .group({
                    '_id' : '$_id',
                    categories : {$push : '$categories'},
                    branch : {$first : '$branch'},
                    displayType : {$first : '$displayType'},
                    outlet : {$first : '$outlet'},
                    attachments : {$first : '$attachments'},
                    description : {$first : '$description'},
                    createdAt : {$first : '$createdAt'},
                    dateEnd : {$first : '$dateEnd'},
                    dateStart : {$first : '$dateStart'},
                    createdBy : {$first : '$createdBy'},
                })
                .unwind('attachments')
                .lookup({
                    from : CONTENT_TYPES.FILES,
                    localField : 'attachments',
                    foreignField : '_id',
                    as : 'attachments'
                })
                .unwind('$attachments')
                .group({
                    '_id' : '$_id',
                    attachments : {$push : '$attachments'},
                    categories : {$first : '$categories'},
                    branch : {$first : '$branch'},
                    subRegion : {$first : '$subRegion'},
                    region : {$first : '$region'},
                    displayType : {$first : '$displayType'},
                    outlet : {$first : '$outlet'},
                    description : {$first : '$description'},
                    createdAt : {$first : '$createdAt'},
                    dateEnd : {$first : '$dateEnd'},
                    dateStart : {$first : '$dateStart'},
                    createdBy : {$first : '$createdBy'}
                })
                .lookup({
                    from : CONTENT_TYPES.PERSONNEL + 's',
                    localField : 'createdBy',
                    foreignField : '_id',
                    as : 'createdBy'
                })
                .unwind('createdBy')
                .lookup({
                    from : CONTENT_TYPES.DISPLAYTYPE + 's',
                    localField : 'displayType',
                    foreignField : '_id',
                    as : 'displayType'
                })
                .lookup({
                    from : CONTENT_TYPES.OUTLET + 's',
                    localField : 'outlet',
                    foreignField : '_id',
                    as : 'outlet'
                })
                .unwind('outlet')
                .lookup({
                    from : CONTENT_TYPES.BRANCH + 'es',
                    localField : 'branch',
                    foreignField : '_id',
                    as : 'branch'
                })
                .unwind('branch')
                .lookup({
                    from : CONTENT_TYPES.DOMAIN + 's',
                    localField : 'branch.subRegion',
                    foreignField : '_id',
                    as : 'subRegion'
                })
                .unwind('subRegion')
                .lookup({
                    from : CONTENT_TYPES.DOMAIN + 's',
                    localField : 'subRegion.parent',
                    foreignField : '_id',
                    as : 'region'
                })
                .unwind('region')
                .project({
                    createdAt : 1,
                    description : 1,
                    dateEnd : 1,
                    dateStart : 1,
                    displayType : 1,
                    'attachments._id' : 1,
                    'attachments.name' : 1,
                    'attachments.originalName' : 1,
                    'categories._id' : 1,
                    'categories.name' : 1,
                    'subRegion._id' : 1,
                    'subRegion.name' : 1,
                    'region._id' : 1,
                    'region.name' : 1,
                    'branch._id' : 1,
                    'branch.name' : 1,
                    'outlet._id' : 1,
                    'outlet.name' : 1,
                    'createdBy._id' : 1,
                    'createdBy.ID' : 1,
                    'createdBy.lastName' : 1,
                    'createdBy.firstName' : 1,
                    'createdBy.country' : 1
                })
                .allowDiskUse(true);

            function getBrandingAndDisplayForm(cb) {
                brandingAndDisplayModelQuery.exec(cb)
            }

            function getAndMapDomains(brandingAndDisplayModel, cb) {
                if (!_.get(brandingAndDisplayModel, '[0].createdBy')) {
                    return cb(null, brandingAndDisplayModel[0]);
                }
                const createdBy = brandingAndDisplayModel[0].createdBy;
                let origins = _.concat(
                    createdBy.country
                );

                DomainModel
                    .find({
                        _id : {
                            $in : origins
                        }
                    }, {
                        name : 1
                    })
                    .lean()
                    .exec(function(err, countries) {
                        if (err) {
                            return cb(err);
                        }
                        createdBy.country = _.filter(countries, function(country) {
                            if (_.includes(_.map(createdBy.country, o => o.toString()),
                                    country._id.toString()
                                )) {
                                return country
                            }
                        });

                        cb(null, brandingAndDisplayModel[0]);
                    })
            }

            function getLinkFromAws(brandingAndDisplayModel, cb) {
                if (!_.get(brandingAndDisplayModel, 'attachments')) {
                    return cb(null, brandingAndDisplayModel || {});
                }
                async.each(brandingAndDisplayModel.attachments,
                    function(file, callback) {
                        file.url = fileHandler.computeUrl(file.name);
                        callback();
                    }, function(err) {
                        if (err) {
                            cb(err);
                        }
                        cb(null, brandingAndDisplayModel);
                    });
            }

            async.waterfall([
                getBrandingAndDisplayForm,
                getAndMapDomains,
                getLinkFromAws
            ], function(err, result) {
                if (err) {
                    return next(err);
                }

                res.send(200, result);
            });
        }

        var id = req.params.id;

        queryRun(id);
    };

    this.getAll = function(req, res, next) {
        var error;

        function generateSearchCondition(query) {
            var searchVariants = [
                'outlet',
                'branch',
                'categories',
                'createdBy'
            ];
            var foreignVariants = [
                'position',
                'country',
                'subRegion',
                'region'
            ];
            if (query && query.time) {
                query.startDate = query.time.values[0];
                query.endDate = query.time.values[1];
            }
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
                    fMatch[`createdBy.${key}`] = {};
                    fMatch[`createdBy.${key}`].$in = value.values;
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
            const limit = query.count;
            const skip = (query.page - 1) * limit;
            const condition = generateSearchCondition(query.filter);
            const mongoQuery = BrandingAndDisplayModel.aggregate()
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
                    as : 'createdBy'
                })
                .unwind('createdBy')
                .lookup({
                    from : CONTENT_TYPES.POSITION + 's',
                    localField : 'createdBy.position',
                    foreignField : '_id',
                    as : 'createdBy.position'
                })
                .unwind('createdBy.position')
                .unwind('createdBy.country')
                .lookup({
                    from : CONTENT_TYPES.DOMAIN + 's',
                    localField : 'createdBy.country',
                    foreignField : '_id',
                    as : 'countries'
                })
                .unwind('countries')
                .lookup({
                    from : CONTENT_TYPES.ACCESSROLE + 's',
                    localField : 'createdBy.accessRole',
                    foreignField : '_id',
                    as : 'createdBy.accessRole'
                })
                .unwind('createdBy.accessRole')
                .unwind('attachments')
                .lookup({
                    from : CONTENT_TYPES.FILES,
                    localField : 'attachments',
                    foreignField : '_id',
                    as : 'attachments'
                })
                .unwind('attachments')
                .group({
                    '_id' : '$_id',
                    attachments : {$push : '$attachments'},
                    categories : {$first : '$categories'},
                    countries : {$first : '$countries'},
                    commentaries : {$first : '$commentaries'},
                    branch : {$first : '$branch'},
                    subRegion : {$first : '$subRegion'},
                    region : {$first : '$region'},
                    retailSegment : {$first : '$retailSegment'},
                    displayType : {$first : '$displayType'},
                    outlet : {$first : '$outlet'},
                    description : {$first : '$description'},
                    createdAt : {$first : '$createdAt'},
                    dateEnd : {$first : '$dateEnd'},
                    dateStart : {$first : '$dateStart'},
                    createdBy : {$first : '$createdBy'}
                })
                .lookup({
                    from : CONTENT_TYPES.DISPLAYTYPE + 's',
                    localField : 'displayType',
                    foreignField : '_id',
                    as : 'displayType'
                })
                .lookup({
                    from : CONTENT_TYPES.OUTLET + 's',
                    localField : 'outlet',
                    foreignField : '_id',
                    as : 'outlet'
                })
                .unwind('outlet')
                .lookup({
                    from : CONTENT_TYPES.BRANCH + 'es',
                    localField : 'branch',
                    foreignField : '_id',
                    as : 'branch'
                })
                .unwind('branch')
                .lookup({
                    from : CONTENT_TYPES.RETAILSEGMENT + 's',
                    localField : 'branch.retailSegment',
                    foreignField : '_id',
                    as : 'retailSegment'
                })
                .unwind('retailSegment')
                .lookup({
                    from : CONTENT_TYPES.DOMAIN + 's',
                    localField : 'branch.subRegion',
                    foreignField : '_id',
                    as : 'subRegion'
                })
                .unwind('subRegion')
                .lookup({
                    from : CONTENT_TYPES.DOMAIN + 's',
                    localField : 'subRegion.parent',
                    foreignField : '_id',
                    as : 'region'
                })
                .unwind('region')
                .append(condition.foreignCondition)
                .project({
                    createdAt : 1,
                    description : 1,
                    dateEnd : 1,
                    dateStart : 1,
                    displayType : 1,
                    categories : 1,
                    'countries._id' : 1,
                    'countries.name' : 1,
                    'commentaries.body' : 1,
                    'attachments._id' : 1,
                    'attachments.name' : 1,
                    'attachments.originalName' : 1,
                    'attachments.contentType' : 1,
                    'branch._id' : 1,
                    'branch.name' : 1,
                    'retailSegment._id' : 1,
                    'retailSegment.name' : 1,
                    'subRegion._id' : 1,
                    'subRegion.name' : 1,
                    'region._id' : 1,
                    'region.name' : 1,
                    'outlet._id' : 1,
                    'outlet.name' : 1,
                    'createdBy._id' : 1,
                    'createdBy.ID' : 1,
                    'createdBy.lastName' : 1,
                    'createdBy.firstName' : 1,
                    'createdBy.imageSrc' : 1,
                    'createdBy.position.name' : 1,
                    'createdBy.accessRole.name' : 1
                })
                .skip(skip)
                .limit(limit)
                .sort(query.sortBy)
                .allowDiskUse(true);

            function getCount(cb) {
                BrandingAndDisplayModel.aggregate()
                    .append(condition.formCondition)
                    .lookup({
                        from : CONTENT_TYPES.PERSONNEL + 's',
                        localField : 'createdBy',
                        foreignField : '_id',
                        as : 'createdBy'
                    })
                    .unwind('createdBy')
                    .lookup({
                        from : CONTENT_TYPES.DISPLAYTYPE + 's',
                        localField : 'displayType',
                        foreignField : '_id',
                        as : 'displayType'
                    })
                    .lookup({
                        from : CONTENT_TYPES.OUTLET + 's',
                        localField : 'outlet',
                        foreignField : '_id',
                        as : 'outlet'
                    })
                    .lookup({
                        from : CONTENT_TYPES.BRANCH + 'es',
                        localField : 'branch',
                        foreignField : '_id',
                        as : 'branch'
                    })
                    .unwind('outlet')
                    .unwind('branch')
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

            function mapCategories(model, callback) {
                async.waterfall([
                    (cb) => {
                        getLinkFromAws(model, cb)
                    },

                    (model, cb) => {
                        CategoryModel.find({
                            _id : {
                                $in : model.categories
                            }
                        }, {
                            name : 1
                        }).then(function(categories) {
                            model.categories = categories;
                            cb(null, model);
                        }).catch(cb);
                    }
                ], callback);
            }

            function getData(cb) {
                mongoQuery.exec(function(err, models) {
                    async.map(models, mapCategories, cb);
                });
            }

            function getLinkFromAws(brandingAndDisplayModel, cb) {
                if (!_.get(brandingAndDisplayModel, 'attachments')) {
                    return cb(null, brandingAndDisplayModel || {});
                }
                async.each(brandingAndDisplayModel.attachments,
                    function(file, callback) {
                        file.url = fileHandler.computeUrl(file.name);
                        callback();
                    }, function(err) {
                        if (err) {
                            cb(err);
                        }
                        cb(null, brandingAndDisplayModel);
                    });
            }

            async.parallel([
                getCount,
                getData
            ], function(err, result) {
                if (err) {
                    return next(err);
                }
                let count = _.get(result, '[0][0].count') || 0;

                res.send(200, {
                    total : count,
                    data : result[1]
                });
            });
        }

        joiValidate(req.query, req.session.level, CONTENT_TYPES.BRANDING_AND_DISPLAY, 'read', function(err, query) {
            if (err) {
                error = new Error();
                error.status = 400;
                error.message = err.name;
                error.details = err.details;

                return next(error);
            }

            queryRun(query);
        });
    }

    this.updateById = function(req, res, next) {
        function queryRun(id, body) {
            BrandingAndDisplayModel.findByIdAndUpdate(id, body, {
                new : true
            }).exec(function(err, result) {
                if (err) {
                    return next(err);
                }

                res.send(200, result);
            });
        }

        var id = req.params.id;
        var body = req.body;
        var error;

        joiValidate(body, req.session.level, CONTENT_TYPES.BRANDING_AND_DISPLAY, 'update', function(err, body) {
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
}

module.exports = BrandingAndDisplay;
