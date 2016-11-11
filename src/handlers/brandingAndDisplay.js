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

    /* this.getAll = function (req, res, next) {
     function queryRun(personnel) {
     var CONSTANTS = require('../constants/mainConstants');
     var query = req.query;
     var isMobile = req.isMobile;
     var filter = query.filter || {};
     var page = query.page || 1;
     var limit = query.count * 1 || parseInt(CONSTANTS.LIST_COUNT, 10);
     var skip = (page - 1) * limit;
     var filterMapper = new FilterMapper();
     var filterSearch = filter.globalSearch || '';
     var queryObject = filterMapper.mapFilter({
     contentType: CONTENT_TYPES.BRANDINGANDDISPLAY,
     filter     : filter,
     personnel  : personnel
     });
     var pipeLine;
     var aggregation;
     var aggregateHelper;
     var searchFieldsArray = [
     'description.en',
     'description.ar',
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
     'createdBy.user.position.name.en',
     'createdBy.user.position.name.ar',
     'createdBy.user.accessRole.name.en',
     'createdBy.user.accessRole.name.ar',
     'createdBy.user.firstName.en',
     'createdBy.user.firstName.ar',
     'createdBy.user.lastName.en',
     'createdBy.user.lastName.ar',
     'displayType.name.en',
     'displayType.name.ar',
     'category.name.en',
     'category.name.ar'
     ];

     delete filter.globalSearch;

     aggregateHelper = new AggregationHelper($defProjection, queryObject);

     pipeLine = getAllPipeLine({
     aggregateHelper  : aggregateHelper,
     searchFieldsArray: searchFieldsArray,
     queryObject      : queryObject,
     filterSearch     : filterSearch,
     skip             : skip,
     limit            : limit,
     isMobile         : isMobile
     });

     aggregation = BrandingAndDisplayModel.aggregate(pipeLine);

     aggregation.options = {
     allowDiskUse: true
     };

     aggregation.exec(function (err, response) {
     var options = {
     data: {}
     };
     var personnelIds = [];
     var fileIds = [];

     if (err) {
     return next(err);
     }

     response = response && response[0] ? response[0] : {data: [], total: 0};

     response.data = _.map(response.data, function (element) {
     element.description = {
     ar: _.unescape(element.description.ar),
     en: _.unescape(element.description.en)
     };
     personnelIds.push(element.createdBy.user._id);
     fileIds = _.union(fileIds, _.map(element.attachments, '_id'));

     return element;
     });

     if (!response.data.length) {
     return next({status: 200, body: response});
     }

     personnelIds = _.uniqBy(personnelIds, 'id');

     options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;
     options.data[CONTENT_TYPES.FILES] = fileIds;

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
     fieldNames[CONTENT_TYPES.PERSONNEL] = ['createdBy.user'];
     fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
     setOptions.fields = fieldNames;

     getImagesHelper.setIntoResult(setOptions, function (response) {
     next({status: 200, body: response});
     })
     });
     });
     }

     access.getReadAccess(req, ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT, function (err, allowed, personnel) {
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

     this.getAllForSync = function (req, res, next) {
     function queryRun(personnel) {
     var isMobile = req.isMobile;
     var query = req.query;
     var filter = query.filter || {};
     var aggregateHelper;
     var filterMapper = new FilterMapper();
     var lastLogOut = new Date(query.lastLogOut);
     var queryObject;
     var pipeLine;
     var positionFilter;
     var aggregation;
     var ids;

     filterMapper.setFilterLocation(filter, personnel, 'branch', null);
     queryObject = filterMapper.mapFilter({
     contentType: CONTENT_TYPES.BRANDINGANDDISPLAY,
     filter     : filter,
     personnel  : personnel
     });

     aggregateHelper = new AggregationHelper($defProjection, queryObject);

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
     'createdBy.user.position': queryObject.position
     }
     ]
     };

     delete queryObject.position;
     }

     aggregateHelper.setSyncQuery(queryObject, lastLogOut);

     pipeLine = getAllPipeLine({
     aggregateHelper: aggregateHelper,
     queryObject    : queryObject,
     positionFilter : positionFilter,
     isMobile       : isMobile,
     forSync        : true
     });

     aggregation = BrandingAndDisplayModel.aggregate(pipeLine);

     aggregation.options = {
     allowDiskUse: true
     };

     aggregation.exec(function (err, response) {
     var options = {
     data: {}
     };
     var personnelIds = [];
     var fileIds = [];

     if (err) {
     return next(err);
     }

     response = response && response[0] ? response[0] : {data: [], total: 0};

     response.data = _.map(response.data, function (element) {
     element.description = {
     ar: _.unescape(element.description.ar),
     en: _.unescape(element.description.en)
     };
     personnelIds.push(element.createdBy.user._id);
     fileIds = _.union(fileIds, _.map(element.attachments, '_id'));

     return element;
     });

     if (!response.data.length) {
     return next({status: 200, body: response});
     }

     personnelIds = _.uniqBy(personnelIds, 'id');

     options.data[CONTENT_TYPES.PERSONNEL] = personnelIds;
     options.data[CONTENT_TYPES.FILES] = fileIds;

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
     fieldNames[CONTENT_TYPES.PERSONNEL] = ['createdBy.user'];
     fieldNames[CONTENT_TYPES.FILES] = [['attachments']];
     setOptions.fields = fieldNames;

     getImagesHelper.setIntoResult(setOptions, function (response) {
     next({status: 200, body: response});
     })
     });
     });
     }

     access.getReadAccess(req, ACL_MODULES.AL_ALALI_BRANDING_DISPLAY_REPORT, function (err, allowed, personnel) {
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
     };*/

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
                const createdBy = brandingAndDisplayModel[0].createdBy;

                if (!createdBy) {
                    return cb(null, brandingAndDisplayModel[0]);
                }
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
                async.each(brandingAndDisplayModel.attachments,
                    function(file, callback) {
                        file.url = fileHandler.computeUrl(file.name);
                        callback();
                }, function(err) {
                    if (err) {
                        cb(err);
                    }
                    cb(null, brandingAndDisplayModel)
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
    }

};

module.exports = BrandingAndDisplay;
