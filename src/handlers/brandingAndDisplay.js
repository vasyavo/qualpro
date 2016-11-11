'use strict';

function BrandingAndDisplay(db, redis, event) {
    const _ = require('lodash');
    const async = require('async');
    const mongoose = require('mongoose');
    const CONTENT_TYPES = require('../public/js/constants/contentType.js');
    const GetImageHelper = require('../helpers/getImages');
    const getImagesHelper = new GetImageHelper(db);
    const FilterMapper = require('../helpers/filterMapper');
    const FileHandler = require('../handlers/file');
    const fileHandler = new FileHandler(db);
    const BrandingAndDisplayModel = require('../types/brandingAndDisplay/model');
    const CountryModel = require('./../types/origin/model');
    const FileModel = require('./../types/file/model');
    const access = require('../helpers/access')(db);
    const joiValidate = require('../helpers/joiValidate');
    const OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
    const ObjectId = mongoose.Types.ObjectId;
    var AggregationHelper = require('../helpers/aggregationCreater');

    const self = this;

    const $defProjection = {
        _id : 1,
        description : 1,
        displayType : 1,
        dateStart : 1,
        dateEnd : 1,
        attachments : 1,
        category : 1,
        branch : 1,
        country : 1,
        region : 1,
        subRegion : 1,
        retailSegment : 1,
        outlet : 1,
        createdBy : 1,
        editedBy : 1,
        personnel : 1,
        status : 1,
        parent : 1,
        position : 1
    };

    function getAllPipeLine(options) {
        var aggregateHelper = options.aggregateHelper;
        var queryObject = options.queryObject || {};
        var pipeLine = [];
        var skip = options.skip;
        var limit = options.limit;
        var isMobile = options.isMobile;
        var forSync = options.forSync;
        var searchFieldsArray = options.searchFieldsArray;
        var filterSearch = options.filterSearch;

        var positionFilter;
        var mainFilter = {};

        var isMatch = false;

        if (queryObject.position) {
            positionFilter = {position : queryObject.position};

            delete queryObject.position;

            isMatch = true;
        }

        if (queryObject.publisher) {
            mainFilter['createdBy.user'] = queryObject.publisher;

            delete queryObject.publisher;

            isMatch = true;
        }

        if (queryObject.status) {
            mainFilter.status = queryObject.status;

            delete queryObject.status;

            isMatch = true;
        }

        if (options.forSync) {
            pipeLine.push({
                $match : queryObject
            });

            isMatch = true;
        }

        if (Object.keys(mainFilter).length) {
            pipeLine.push({
                $match : mainFilter
            });

            isMatch = true;
        }

        if (queryObject._id) {
            pipeLine.push({
                $match : queryObject
            });

            isMatch = true;
        }

        if (!forSync && isMobile) {
            pipeLine.push({
                $match : {
                    status : {$ne : 'expired'}
                }
            });

            isMatch = true;
        }

        if (!isMatch) {
            pipeLine.push({
                $match : queryObject
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'categories',
            key : 'category'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'displayTypes',
            key : 'displayType',
            isArray : false

        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'branches',
            key : 'branch',
            addMainProjection : ['retailSegment', 'outlet']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'domains',
            key : 'subRegion'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'domains',
            key : 'region'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'domains',
            key : 'country'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'retailSegments',
            key : 'retailSegment'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'outlets',
            key : 'outlet'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'personnels',
            key : 'personnel',
            addMainProjection : ['position']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'personnels',
            key : 'createdBy.user',
            isArray : false,
            addProjection : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
            includeSiblings : {createdBy : {date : 1}}
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'personnels',
            key : 'editedBy.user',
            isArray : false,
            addProjection : ['_id', 'firstName', 'lastName', 'position', 'accessRole'],
            includeSiblings : {editedBy : {date : 1}}
        }));

        pipeLine.push({
            $project : aggregateHelper.getProjection({
                position : {
                    $setUnion : ['$position', ['$createdBy.user.position']]
                }
            })
        });

        if (positionFilter) {
            pipeLine.push({
                $match : positionFilter
            });
        }

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'accessRoles',
            key : 'createdBy.user.accessRole',
            isArray : false,
            addProjection : ['_id', 'name', 'level'],
            includeSiblings : {
                createdBy : {
                    date : 1,
                    user : {
                        _id : 1,
                        position : 1,
                        firstName : 1,
                        lastName : 1
                    }
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'positions',
            key : 'createdBy.user.position',
            isArray : false,
            includeSiblings : {
                createdBy : {
                    date : 1,
                    user : {
                        _id : 1,
                        accessRole : 1,
                        firstName : 1,
                        lastName : 1
                    }
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'accessRoles',
            key : 'editedBy.user.accessRole',
            isArray : false,
            addProjection : ['_id', 'name', 'level'],
            includeSiblings : {
                editedBy : {
                    date : 1,
                    user : {
                        _id : 1,
                        position : 1,
                        firstName : 1,
                        lastName : 1
                    }
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'positions',
            key : 'editedBy.user.position',
            isArray : false,
            includeSiblings : {
                editedBy : {
                    date : 1,
                    user : {
                        _id : 1,
                        accessRole : 1,
                        firstName : 1,
                        lastName : 1
                    }
                }
            }
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from : 'files',
            key : 'attachments',
            addProjection : ['contentType', 'originalName', 'createdBy']
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.endOfPipeLine({
            isMobile : isMobile,
            searchFieldsArray : searchFieldsArray,
            filterSearch : filterSearch,
            skip : skip,
            limit : limit,
            creationDate : true
        }));

        return pipeLine;
    }

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
                .unwind('categories')
                .lookup({
                    from : 'categories',
                    localField : 'categories',
                    foreignField : '_id',
                    as : 'categories'
                })
                .unwind('$categories')
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
                    displayType : {$first : '$displayType'},
                    outlet : {$first : '$outlet'},
                    description : {$first : '$description'},
                    createdAt : {$first : '$createdAt'},
                    dateEnd : {$first : '$dateEnd'},
                    dateStart : {$first : '$dateStart'},
                    createdBy : {$first : '$createdBy'},
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
                .lookup({
                    from : CONTENT_TYPES.BRANCH + 'es',
                    localField : 'branch',
                    foreignField : '_id',
                    as : 'branch'
                })
                .unwind('outlet')
                .unwind('branch')
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
                    'branch._id' : 1,
                    'branch.name' : 1,
                    'outlet._id' : 1,
                    'outlet.name' : 1,
                    'createdBy._id' : 1,
                    'createdBy.ID' : 1,
                    'createdBy.lastName' : 1,
                    'createdBy.firstName' : 1,
                    'createdBy.country' : 1,
                    'createdBy.subRegion' : 1,
                    'createdBy.region' : 1
                })
                .allowDiskUse(true);

            function getBrandingAndDisplayForm(cb) {
                brandingAndDisplayModelQuery.exec(cb)
            }

            function getAndMapCountries(brandingAndDisplayModel, cb) {
                if (!_.get(brandingAndDisplayModel, 'brandingAndDisplayModel[0].createdBy')) {
                    return cb(null, brandingAndDisplayModel[0]);
                }
                const createdBy = brandingAndDisplayModel[0].createdBy;
                const origins = _.concat(
                    createdBy.country,
                    createdBy.region,
                    createdBy.subRegion
                );

                CountryModel
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

                        createdBy.region = _.filter(countries, function(country) {
                            if (_.includes(_.map(createdBy.region, o => o.toString()),
                                    country._id.toString()
                                )) {
                                return country
                            }
                        });

                        createdBy.subRegion = _.filter(countries, function(country) {
                            if (_.includes(_.map(createdBy.subRegion, o => o.toString()),
                                    country._id.toString()
                                )) {
                                return country
                            }
                        });

                        cb(null, brandingAndDisplayModel[0]);
                    })
            }

            function getLinkFromAws(brandingAndDisplayModel, cb) {
                if (!_.get(brandingAndDisplayModel, 'brandingAndDisplayModel.attachments')) {
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
                getAndMapCountries,
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
                .unwind('categories')
                .lookup({
                    from : 'categories',
                    localField : 'categories',
                    foreignField : '_id',
                    as : 'categories'
                })
                .unwind('$categories')
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
                .project({
                    createdAt : 1,
                    description : 1,
                    dateEnd : 1,
                    dateStart : 1,
                    displayType : 1,
                    'categories._id' : 1,
                    'categories.name' : 1,
                    'branch._id' : 1,
                    'branch.name' : 1,
                    'outlet._id' : 1,
                    'outlet.name' : 1,
                    'createdBy._id' : 1,
                    'createdBy.ID' : 1,
                    'createdBy.lastName' : 1,
                    'createdBy.firstName' : 1
                })
                .limit(limit)
                .skip(skip)
                .sort(query.sortBy)
                .allowDiskUse(true);

            function getCount(cb) {
                cb()
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
                let count = 0;

               /* if (result[0][0] && result[0][0].count) {
                    count = result[0][0].count
                }*/

                res.send(200, {
                    total : count,
                    data : result[1]
                });
            });
        }

        joiValidate(req.query, 1/*req.session.level*/, CONTENT_TYPES.BRANDING_AND_DISPLAY, 'read', function(err, query) {
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
}

module.exports = BrandingAndDisplay;
