const _ = require('underscore');
const CONSTANTS = require('../../../public/js/constants/otherConstants');
const FilterMapper = require('../../../helpers/filterMapper');
const ConsumersSurveyModel = require('../../../types/consumersSurvey/model');
const mapFilterValues = require('../reusable-components/mapFilterValues');

const AggregationHelper = require('../../../helpers/aggregationCreater');

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
    personnels : 1,
    employee : 1,
    publisher : 1,
    personnel : 1
};

module.exports = (req, res, next) => {
    var query = req.query;
    var queryFilter = query.filter || {};
    var currentSelected = query.current;
    const filterMapper = new FilterMapper();
    var filterExists = Object.keys(queryFilter).length && !(Object.keys(queryFilter).length === 1 && queryFilter.archived);
    var filter = filterMapper.mapFilter({
        filter : query.filter
    });
    var aggregation;
    var positionFilter;
    var publisherFilter;
    var pipeLine = [];

    if (filter.position) {
        positionFilter = filter.position;
        delete filter.position;
    }

    if (filter.publisher) {
        publisherFilter = filter.publisher;
        delete filter.publisher;
    }

    const aggregateHelper = new AggregationHelper($defProjectionExtended, filter);

    if (publisherFilter) {
        pipeLine.push({
            $match : {
                'createdBy.user' : publisherFilter
            }
        });
    }

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from : 'personnels',
        key : 'personnels',
        isArray : true,
        addProjection : ['firstName', 'lastName', 'position']
    }));

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from : 'personnels',
        key : 'createdBy.user',
        isArray : false,
        addProjection : ['firstName', 'lastName', 'position'],
        includeSiblings : {
            createdBy : {
                date : 1
            }
        }
    }));

    pipeLine.push({
        $unwind : {
            path : '$personnels',
            preserveNullAndEmptyArrays : true
        }
    });

    if (positionFilter) {
        pipeLine.push({
            $match : {
                $or : [
                    {
                        'createdBy.user.position' : positionFilter
                    },
                    {
                        'personnels.position' : positionFilter
                    }
                ]
            }
        });
    }

    pipeLine.push({
        $project : aggregateHelper.getProjection({
            position : {$concatArrays : [['$createdBy.user.position'], ['$personnels.position']]},
            personnels : {
                _id : 1,
                position : 1,
                name : {
                    en : {$concat : ['$personnels.firstName.en', ' ', '$personnels.lastName.en']},
                    ar : {$concat : ['$personnels.firstName.ar', ' ', '$personnels.lastName.ar']}
                }
            }
        })
    });

    pipeLine.push({
        $group : aggregateHelper.getGroupObject({
            personnels : {
                $addToSet : '$personnels'
            }
        })
    });

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from : 'positions',
        key : 'position',
        isArray : true
    }));

    pipeLine.push({
        $project : aggregateHelper.getProjection({
            publisher : {
                _id : '$createdBy.user._id',
                position : '$createdBy.user.position',
                name : {
                    en : {$concat : ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en']},
                    ar : {$concat : ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar']}
                }
            }
        })
    });

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from : 'domains',
        key : 'country',
        isArray : true
    }));

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
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

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
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

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
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

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from : 'outlets',
        key : 'outlet',
        addProjection : ['retailSegments', 'subRegions']
    }));

    if (filter.retailSegment || filter.subRegion) {
        pipeLine.push({
            $unwind : {
                path : '$outlet',
                preserveNullAndEmptyArrays : true
            }
        });

        if (filter.retailSegment) {
            pipeLine.push({
                $match : {
                    $or : [
                        {
                            'outlet.retailSegments' : filter.retailSegment
                        },
                        {
                            'outlet.retailSegments' : {
                                $exists : false
                            }
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
                            'outlet.subRegions' : filter.subRegion
                        },
                        {
                            'outlet.subRegions' : {
                                $exists : false
                            }
                        }
                    ]
                }
            });
        }

        pipeLine.push({
            $group : aggregateHelper.getGroupObject({
                outlet : {$addToSet : '$outlet'}
            })
        });
    }

    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
        from : 'retailSegments',
        key : 'retailSegment',
        addProjection : ['subRegions']
    }));

    if (filter.subRegion) {
        pipeLine.push({
            $unwind : {
                path : '$retailSegment',
                preserveNullAndEmptyArrays : true
            }
        });

        pipeLine.push({
            $match : {
                $or : [
                    {
                        'retailSegment.subRegions' : filter.subRegion
                    },
                    {
                        'retailSegment.subRegions' : {
                            $exists : false
                        }
                    }
                ]
            }
        });

        pipeLine.push({
            $group : aggregateHelper.getGroupObject({
                retailSegment : {$addToSet : '$retailSegment'}
            })
        });
    }

    pipeLine.push({
        $group : {
            _id : null,
            personnel : {$addToSet : '$personnels'},
            country : {$addToSet : '$country'},
            region : {$addToSet : '$region'},
            subRegion : {$addToSet : '$subRegion'},
            retailSegment : {$addToSet : '$retailSegment'},
            outlet : {$addToSet : '$outlet'},
            branch : {$addToSet : '$branch'},
            position : {$addToSet : '$position'},
            publisher : {$addToSet : '$publisher'},
            status : {$addToSet : '$status'}
        }
    });

    aggregation = ConsumersSurveyModel.aggregate(pipeLine);

    aggregation.options = {
        allowDiskUse : true
    };

    aggregation.exec(function(err, response) {
        var result;
        if (err) {
            return next(err);
        }

        result = response[0] || {};

        result = {
            country : result.country && _.flatten(result.country) || [],
            region : result.region && _.flatten(result.region) || [],
            subRegion : result.subRegion && _.flatten(result.subRegion) || [],
            retailSegment : result.retailSegment && _.flatten(result.retailSegment) || [],
            outlet : result.outlet && _.flatten(result.outlet) || [],
            branch : result.branch && _.flatten(result.branch) || [],
            publisher : result.publisher || [],
            position : result.position && _.flatten(result.position) || [],
            personnel : result.personnel && _.flatten(result.personnel) || [],
            status : mapFilterValues(result.status, CONSTANTS.PROMOTION_UI_STATUSES)
        };

        Object.keys(result).forEach(function(key) {
            var condition = ['personnel', 'publisher'].indexOf(key) !== -1 && positionFilter;
            var positions = [];
            if (positionFilter) {
                positions = positionFilter.$in.fromObjectID();
            }
            if (result[key]) {
                var i = result[key].length - 1;
                for (i; i >= 0; i--) {
                    if (!result[key][i] || !result[key][i]._id || (condition && result[key][i].position && positions.indexOf(result[key][i].position.toString()) === -1)) {
                        result[key].splice(i, 1);
                    }
                }
            }
        });

        res.status(200).send(result);
    });
};
