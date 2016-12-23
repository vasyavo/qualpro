const _ = require('underscore');
const AggregationHelper = require('../../../helpers/aggregationCreater');
const FilterMapper = require('../../../helpers/filterMapper');
const PersonnelModel = require('../../../types/personnel/model');

const $defProjectionExtended = {
    _id : 1,
    origin : 1,
    country : 1,
    retailSegment : 1,
    region : 1,
    subRegion : 1,
    outlet : 1,
    branch : 1,
    brand : 1,
    variant : 1,
    category : 1,
    product : 1,
    editedBy : 1,
    createdBy : 1,
    archived : 1,
    type : 1,
    status : 1,
    configuration : 1,
    priority : 1,
    assignedTo : 1,
    location : 1,
    name : 1,
    position : 1,
    firstName : 1,
    lastName : 1
};

module.exports = (req, res, next) => {
    var query = req.query;
    var queryFilter = query.filter || {};
    var currentSelected = query.current;
    var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);

    var filterMapper = new FilterMapper();
    var filter = filterMapper.mapFilter({
        filter : query.filter,
        personnel : req.personnelModel
    });

    var aggregationHelper = new AggregationHelper($defProjectionExtended, filter);
    var aggregation;
    var pipeLine = [];

    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
        from : 'domains',
        key : 'country',
        isArray : true
    }));

    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
        from : 'domains',
        key : 'region',
        isArray : true,
        addProjection : ['parent']
    }));

    pipeLine.push({
        $unwind : {
            path : '$region',
            preserveNullAndEmptyArrays : true
        }
    });

    if (filter.country) {
        pipeLine.push({
            $match : {
                $or : [
                    {
                        'region.parent' : filter.country
                    },
                    {
                        region : {
                            $exists : false
                        }
                    }
                ]
            }
        });
    }

    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
        from : 'domains',
        key : 'subRegion',
        isArray : true,
        addProjection : ['parent']
    }));

    pipeLine.push({
        $unwind : {
            path : '$subRegion',
            preserveNullAndEmptyArrays : true
        }
    });

    if (filter.region) {
        pipeLine.push({
            $match : {
                $or : [
                    {
                        'subRegion.parent' : filter.region
                    },
                    {
                        subRegion : {
                            $exists : false
                        }
                    }
                ]
            }
        });
    }

    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
        from : 'branches',
        key : 'branch',
        isArray : true,
        addProjection : ['subRegion', 'outlet', 'retailSegment']
    }));

    pipeLine.push({
        $unwind : {
            path : '$branch',
            preserveNullAndEmptyArrays : true
        }
    });

    if (filter.outlet) {
        pipeLine.push({
            $match : {
                $or : [
                    {
                        'branch.outlet' : filter.outlet
                    },
                    {
                        'branch.outlet' : {$exists : false}
                    }
                ]
            }
        });
    }

    if (filter.retailSegment) {
        pipeLine.push({
            $match : {
                $or : [
                    {
                        'branch.retailSegment' : filter.retailSegment
                    },
                    {
                        'branch.retailSegment' : {$exists : false}
                    }
                ]
            }
        });
    }

    if (filter.subRegion) {
        pipeLine.push({
            $match : {
                $or : [
                    {
                        'branch.subRegion' : filter.subRegion
                    },
                    {
                        'branch.subRegion' : {$exists : false}
                    }
                ]
            }
        });
    }

    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
        from : 'outlets',
        key : 'branch.outlet',
        as : 'outlet',
        isArray : false
    }));

    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
        from : 'retailSegments',
        key : 'branch.retailSegment',
        as : 'retailSegment',
        isArray : false
    }));

    pipeLine = _.union(pipeLine, aggregationHelper.aggregationPartMaker({
        from : 'positions',
        key : 'position',
        isArray : false
    }));

    pipeLine.push({
        $project : aggregationHelper.getProjection({
            personnel : {
                _id : '$_id',
                name : {
                    en : {$concat : ['$firstName.en', ' ', '$lastName.en']},
                    ar : {$concat : ['$firstName.ar', ' ', '$lastName.ar']}
                }
            }
        })
    });

    pipeLine.push({
        $group : {
            _id : null,
            personnel : {$addToSet : '$$ROOT.personnel'},
            country : {$addToSet : '$country'},
            region : {$addToSet : '$region'},
            subRegion : {$addToSet : '$subRegion'},
            branch : {$addToSet : '$branch'},
            position : {$addToSet : '$position'},
            retailSegment : {$addToSet : '$retailSegment'},
            outlet : {$addToSet : '$outlet'}
        }
    });
    aggregation = PersonnelModel.aggregate(pipeLine);

    aggregation.options = {
        allowDiskUse : true
    };

    aggregation.exec(function(err, result) {
        var response;

        if (err) {
            return next(err);
        }

        result = result[0] || {};

        response = {
            country : result.country && _.uniq(_.flatten(result.country)) || [],
            region : result.region || [],
            subRegion : result.subRegion || [],
            retailSegment : result.retailSegment || [],
            outlet : result.outlet || [],
            branch : result.branch || [],
            personnel : result.personnel || [],
            position : result.position || []
        };

        Object.keys(response).forEach(function(key) {
            if (response[key]) {
                var i = response[key].length - 1;
                for (i; i >= 0; i--) {
                    if (!response[key][i] || !response[key][i]._id) {
                        response[key].splice(i, 1);
                    }
                }
            }
        });

        res.status(200).send(response);
    });
};
