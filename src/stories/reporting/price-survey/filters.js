const AggregationHelper = require('./../../../helpers/aggregationCreater');
const FilterMapper = require('./../../../helpers/filterMapper');
const PriceSurveyModel = require('./../../../types/priceSurvey/model');

const $defProjection = {
    _id: 1,
    origin: 1,
    country: 1,
    retailSegment: 1,
    displayType: 1,
    region: 1,
    subRegion: 1,
    outlet: 1,
    branch: 1,
    brand: 1,
    variant: 1,
    category: 1,
    product: 1,
    editedBy: 1,
    createdBy: 1,
    archived: 1,
    type: 1,
    status: 1,
    configuration: 1,
    priority: 1,
    assignedTo: 1,
    location: 1,
    name: 1,
    position: 1
};

module.exports = (req, res, next) => {
    const query = req.query;
    const queryFilter = query.filter || {};
    const filterMapper = new FilterMapper();
    const filter = filterMapper.mapFilter({
        filter: queryFilter,
        personnel: req.personnelModel
    });

    let personnelFilter;

    if (filter.personnel) {
        personnelFilter = filter.personnel;
        delete filter.personnel;
    }

    let positionFilter;

    if (filter.position) {
        positionFilter = filter.position;
        delete filter.position;
    }

    const aggregateHelper = new AggregationHelper($defProjection, filter);
    const pipeLine = [];

    if (personnelFilter) {
        pipeLine.push({
            $match: {
                'createdBy.user': personnelFilter
            }
        });
    }

    pipeLine.push(...aggregateHelper.aggregationPartMaker({
        from: 'categories',
        key: 'category',
        isArray: false
    }));

    pipeLine.push(...aggregateHelper.aggregationPartMaker({
        from: 'domains',
        key: 'country',
        isArray: false
    }));

    pipeLine.push(...aggregateHelper.aggregationPartMaker({
        from: 'domains',
        key: 'region',
        isArray: false
    }));

    pipeLine.push(...aggregateHelper.aggregationPartMaker({
        from: 'domains',
        key: 'subRegion',
        isArray: false
    }));

    pipeLine.push(...aggregateHelper.aggregationPartMaker({
        from: 'retailSegments',
        key: 'retailSegment',
        isArray: false
    }));

    pipeLine.push(...aggregateHelper.aggregationPartMaker({
        from: 'outlets',
        key: 'outlet',
        isArray: false
    }));

    pipeLine.push(...aggregateHelper.aggregationPartMaker({
        from: 'branches',
        key: 'branch',
        isArray: false
    }));

    pipeLine.push(...aggregateHelper.aggregationPartMaker({
        from: 'personnels',
        key: 'createdBy.user',
        addProjection: ['position', 'firstName', 'lastName'],
        isArray: false,
        includeSiblings: {
            createdBy: {
                date: 1
            }
        }
    }));

    if (positionFilter) {
        pipeLine.push({
            $match: {
                'createdBy.user.position': positionFilter
            }
        });
    }

    pipeLine.push(...aggregateHelper.aggregationPartMaker({
        from: 'positions',
        key: 'createdBy.user.position',
        isArray: false,
        includeSiblings: {
            createdBy: {
                date: 1,
                user: {
                    _id: 1,
                    position: 1,
                    firstName: 1,
                    lastName: 1
                }
            }
        }
    }));

    pipeLine.push({
        $project: aggregateHelper.getProjection({
            createdBy: {
                date: 1,
                user: {
                    _id: 1,
                    name: {
                        en: { $concat: ['$createdBy.user.firstName.en', ' ', '$createdBy.user.lastName.en'] },
                        ar: { $concat: ['$createdBy.user.firstName.ar', ' ', '$createdBy.user.lastName.ar'] }
                    }
                }
            },
            position: { $arrayElemAt: ['$createdBy.user.position', 0] }
        })
    });

    pipeLine.push({
        $group: {
            _id: null,
            branch: { $addToSet: '$branch' },
            outlet: { $addToSet: '$outlet' },
            retailSegment: { $addToSet: '$retailSegment' },
            subRegion: { $addToSet: '$subRegion' },
            region: { $addToSet: '$region' },
            country: { $addToSet: '$country' },
            category: { $addToSet: '$category' },
            position: { $addToSet: '$position' },
            personnel: { $addToSet: '$createdBy.user' }
        }
    });

    PriceSurveyModel.aggregate(pipeLine)
        .allowDiskUse(true)
        .exec((err, result) => {
            if (err) {
                return next(err);
            }

            const groups = result[0] || {};
            const body = {
                branch: groups.branch || [],
                outlet: groups.outlet || [],
                retailSegment: groups.retailSegment || [],
                subRegion: groups.subRegion || [],
                region: groups.region || [],
                country: groups.country || [],
                category: groups.category || [],
                position: groups.position || [],
                personnel: groups.personnel || []
            };

            res.status(200).send(body);
        });
};
